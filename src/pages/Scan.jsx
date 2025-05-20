import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import CameraSelector from '../components/CameraSelector';
import GlitchLoading from '../components/GlitchLoading';
import { sendToDeepSeek } from '../utils/Deepseek';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { parseJSONfromText } from '../utils/parseJSONfromText';


export default function Scan() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [detector, setDetector] = useState(null);
    const lastVideoTimeRef = useRef(-1);
    const detectionCache = useRef(null);
    const MAX_TTL = 10;
    const [clippedImageUrl, setClippedImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const shouldDetectRef = useRef(true);
    const [userType, setUserType] = useState('Emotion-Driven'); // fallback
    const [showClippedResult, setShowClippedResult] = useState(false);

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return '#' + ((hash >> 24) & 0xff).toString(16).padStart(2, '0') +
            ((hash >> 16) & 0xff).toString(16).padStart(2, '0') +
            ((hash >> 8) & 0xff).toString(16).padStart(2, '0');
    };

    useEffect(() => {
        const fetchUserType = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const docRef = doc(db, 'user_profiles', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserType(data.userType || 'Emotion-Driven');
            }
        };
        fetchUserType();
    }, []);


    useEffect(() => {
        const loadModel = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
            const objectDetector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
                    delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                scoreThreshold: 0.4,
                maxResults: -1,
            });
            setDetector(objectDetector);
        };

        loadModel();
    }, []);

    const handleStreamReady = (stream) => {
        const video = videoRef.current;
        if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                requestAnimationFrame(() => detectFrame(video));
            };
        }
    };

    const detectFrame = async (video) => {
        if (!detector || !video || loading) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            requestAnimationFrame(() => detectFrame(video));
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let currentDetections = [];

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const result = await detector.detectForVideo(video, performance.now());

            if (result.detections.length > 0) {
                detectionCache.current = {
                    detections: result.detections,
                    ttl: MAX_TTL,
                };
            } else if (detectionCache.current) {
                detectionCache.current.ttl -= 1;
                if (detectionCache.current.ttl < 0) {
                    detectionCache.current = null;
                }
            }
        }

        if (detectionCache.current) {
            currentDetections = detectionCache.current.detections;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        currentDetections.forEach(({ boundingBox }) => {
            const { originX, originY, width, height } = boundingBox;
            const sx = Math.floor(originX);
            const sy = Math.floor(originY);
            const sw = Math.floor(width);
            const sh = Math.floor(height);

            const subImage = ctx.createImageData(sw, sh);
            for (let y = 0; y < sh; y++) {
                for (let x = 0; x < sw; x++) {
                    const srcIndex = ((sy + y) * canvas.width + (sx + x)) * 4;
                    const dstIndex = (y * sw + x) * 4;
                    for (let i = 0; i < 4; i++) {
                        subImage.data[dstIndex + i] = imageData.data[srcIndex + i];
                    }
                }
            }
            ctx.putImageData(subImage, sx, sy);
        });

        currentDetections.forEach(({ categories, boundingBox }) => {
            const label = categories[0].categoryName;
            const color = stringToColor(label);

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            ctx.globalAlpha   = 0.9;
            ctx.strokeRect(
                boundingBox.originX,
                boundingBox.originY,
                boundingBox.width,
                boundingBox.height
            );

            ctx.fillStyle = color;
            ctx.font = '16px monospace';
            ctx.fillText(label, boundingBox.originX + 5, boundingBox.originY - 8);
        });

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (shouldDetectRef.current) {
            requestAnimationFrame(() => detectFrame(video));
        }
    };

    const imageClip = async () => {
        setLoading(true);
        shouldDetectRef.current = false;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !detectionCache.current || detectionCache.current.detections.length === 0) {
            setLoading(false);
            return;
        }

        // 🖼️ 捕捉当前帧
        const originalFrameCanvas = document.createElement('canvas');
        originalFrameCanvas.width = canvas.width;
        originalFrameCanvas.height = canvas.height;
        const originalCtx = originalFrameCanvas.getContext('2d');
        originalCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 🧠 处理所有检测对象
        const allDetections = detectionCache.current.detections.map((d) => ({
            label: d.categories[0].categoryName,
            score: d.categories[0].score,
            box: d.boundingBox,
        }));

        const objectList = allDetections.map(d => `${d.label} (${d.score.toFixed(2)})`).join(', ');
        const prompt = `
You are an intelligent content curation algorithm.
The user has been profiled as: ${userType}.
From their camera input, the following objects have been detected: ${objectList}.
Your tasks:
1. Select the object the user is most likely to upload, based on their psychological profile and engagement patterns.
2. Write an emotionally revealing or ironically insightful caption for the selected object.
3. Provide a brief explanation in the first person, as if the algorithm is speaking directly. Use confident, analytic language — e.g., “I know you're the type who...”, “You tend to be drawn to...”, “That’s why I chose...”
4. For each of the following user types, generate:
    - a caption tailored to their worldview
    - a Stable Diffusion image prompt that visualizes the selected object according to their perceptual bias
User types:
- Emotion-Driven
- Logic-Seeker
- Entertainment-Lover
- Conspiracy-Oriented
- Aesthetic-Focused
Respond ONLY with a valid JSON object. Do not include markdown or formatting.
Format:
{
  "selectedObject": "tv",
  "reason": "I know you're the type who sees patterns behind screens. You tend to fixate on symbols of surveillance and passive observation — that’s why I chose the TV.",
  "userVariants": {
    "Emotion-Driven": {
      "caption": "You leave the TV on, not to watch — but to not feel alone. #lonelyscrolling #blueglow #silentcompany",
      "prompt": "a person curled up on a couch with a television casting a soft blue glow, dark surroundings, emotional loneliness, flickering static on the screen, tears barely visible, cinematic lighting, intimate mood"
    },
    "Logic-Seeker": {
      "caption": "The TV isn’t entertainment — it’s a system of information delivery. #infovision #structuredconsumption #algorithmicefficiency",
      "prompt": "a person analyzing data graphs and news tickers on a television screen, minimalistic living room, neutral tones, charts and statistics displayed on-screen, cool lighting, focus on clarity and order"
    },
    "Entertainment-Lover": {
      "caption": "You don’t care what’s on — as long as it keeps going. #bingewatchlife #tvjunkie #funneverends",
      "prompt": "a person laughing in front of a bright, colorful TV showing a game show or reality TV, popcorn scattered on the floor, neon lighting, saturated colors, fun and chaotic energy, living room cluttered with media devices"
    },
    "Conspiracy-Oriented": {
      "caption": "The TV doesn’t broadcast — it brainwashes. #wakeupsheeple #controlledfeeds #surveillancesignal",
      "prompt": "a person watching a television with subliminal messages and surveillance footage on the screen, static noise, hidden camera in the corner, glitch textures, ominous lighting, secret codes and red overlays, dystopian style"
    },
    "Aesthetic-Focused": {
      "caption": "Framed like a painting, the TV becomes the altar of modern stillness. #moodcomposition #minimalartifacts #formoverfunction",
      "prompt": "a minimalist interior with a sleek flat-screen TV turned off, balanced composition, ambient shadows, soft golden hour lighting through curtains, focus on symmetry and negative space, styled like a magazine photo"
    }
  }
}
`;
        let selectedLabel = '';
        let explanation = '';
        let userVariants = {};

        try {
            const response = await sendToDeepSeek(prompt);
            const parsed = parseJSONfromText(response.response);
            if (!parsed) throw new Error('Invalid DeepSeek response');
            selectedLabel = parsed.selectedObject || '';
            explanation = parsed.reason || '';
            userVariants = parsed.userVariants || {};
        } catch (err) {
            console.warn('DeepSeek parse failed:', err);
            setLoading(false);
            return;
        }

        const candidates = allDetections.filter(d => d.label === selectedLabel);
        if (candidates.length === 0) {
            alert('No matching object found.');
            setLoading(false);
            return;
        }
        const bestMatch = candidates.reduce((a, b) => (a.score > b.score ? a : b));
        const { originX, originY, width, height } = bestMatch.box;

        const sx = Math.floor(originX);
        const sy = Math.floor(originY);
        const sw = Math.floor(width);
        const sh = Math.floor(height);

        const outputCanvas = document.createElement('canvas');
        const size = 512;
        outputCanvas.width = size;
        outputCanvas.height = size;
        const ctx = outputCanvas.getContext('2d');

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);

        const scale = Math.min(size / sw, size / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = (size - dw) / 2;
        const dy = (size - dh) / 2;

        ctx.drawImage(originalFrameCanvas, sx, sy, sw, sh, dx, dy, dw, dh);

        outputCanvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setClippedImageUrl(url);
                navigate('/upload', {
                    state: {
                        clippedImageUrl: url,
                        detectedLabel: selectedLabel,
                        reason: explanation,
                        userVariants,
                    },
                });
            }
            setLoading(false);
        }, 'image/png');
    };


    return (
        <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {loading && <GlitchLoading />}

            <CameraSelector onStreamReady={handleStreamReady} />

            {!showClippedResult && (
                <>
                    <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
                    <canvas
                        ref={canvasRef}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}
                    />
                </>
            )}

            {showClippedResult && clippedImageUrl && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: '#000',
                        zIndex: 5,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <img
                        src={clippedImageUrl}
                        alt="Clipped"
                        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                    />
                </Box>
            )}

            {/* <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#39ff14' }}>
                    Object Detection
                </Typography>
            </Box> */}

            <Button
                variant="contained"
                sx={{
                    position: 'absolute',
                    bottom: '12%',
                    left: '50%',
                    position: 'fixed',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                }}
                onClick={imageClip}
            >
                Capture
            </Button>

        </Box>
    );

}
