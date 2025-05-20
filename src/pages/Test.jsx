import React, { useRef, useState } from "react";
import { Box, Button, Typography, TextField, CircularProgress } from "@mui/material";
import ComfyUiP5Helper from "../utils/ComfyUiP5Helper";

// 请改成你的 ComfyUI 服务器公网地址
const comfyBaseUrl = "https://50bf-202-66-60-186.ngrok-free.app";

const comfy = new ComfyUiP5Helper(comfyBaseUrl);

// 原始workflow结构
const getDefaultWorkflow = (imgBase64, prompt) => {
    // 深拷贝一份workflow（你可以用lodash/cloneDeep等）
    const workflow = JSON.parse(JSON.stringify(defaultWorkflow));
    workflow["33"].inputs.image = imgBase64;
    workflow["6"].inputs.text = prompt;
    return workflow;
};

// 你的默认workflow模板（放外面，避免每次render重定义）
const defaultWorkflow = {
    "3": {
        "inputs": {
            "seed": [
                "28",
                0
            ],
            "steps": 5,
            "cfg": 3.5,
            "sampler_name": "euler",
            "scheduler": "karras",
            "denoise": 0.8000000000000002,
            "model": [
                "14",
                0
            ],
            "positive": [
                "18",
                0
            ],
            "negative": [
                "7",
                0
            ],
            "latent_image": [
                "12",
                0
            ]
        },
        "class_type": "KSampler",
        "_meta": {
            "title": "KSampler"
        }
    },
    "6": {
        "inputs": {
            "text": "narrative-driven, visually dynamic style that channels raw, anger-fueled intensity through a skeptical, relativistic lens, favoring immersive, experiential storytelling with an observational edge.",
            "clip": [
                "14",
                1
            ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
            "title": "CLIP Text Encode (Prompt)"
        }
    },
    "7": {
        "inputs": {
            "text": "nudity, breast,(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime), cropped, out of frame, worst quality, low quality, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, UnrealisticDream\n \n",
            "clip": [
                "14",
                1
            ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
            "title": "CLIP Text Encode (Prompt)"
        }
    },
    "8": {
        "inputs": {
            "samples": [
                "3",
                0
            ],
            "vae": [
                "14",
                2
            ]
        },
        "class_type": "VAEDecode",
        "_meta": {
            "title": "VAE Decode"
        }
    },
    "12": {
        "inputs": {
            "pixels": [
                "33",
                0
            ],
            "vae": [
                "14",
                2
            ]
        },
        "class_type": "VAEEncode",
        "_meta": {
            "title": "VAE Encode"
        }
    },
    "14": {
        "inputs": {
            "ckpt_name": "dreamshaper_8LCM.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
            "title": "Load Checkpoint"
        }
    },
    "18": {
        "inputs": {
            "strength": 0.8000000000000002,
            "conditioning": [
                "6",
                0
            ],
            "control_net": [
                "19",
                0
            ],
            "image": [
                "20",
                0
            ]
        },
        "class_type": "ControlNetApply",
        "_meta": {
            "title": "Apply ControlNet"
        }
    },
    "19": {
        "inputs": {
            "control_net_name": "canny.safetensors"
        },
        "class_type": "ControlNetLoader",
        "_meta": {
            "title": "Load ControlNet Model"
        }
    },
    "20": {
        "inputs": {
            "preprocessor": "CannyEdgePreprocessor",
            "resolution": 512,
            "image": [
                "33",
                0
            ]
        },
        "class_type": "AIO_Preprocessor",
        "_meta": {
            "title": "AIO Aux Preprocessor"
        }
    },
    "22": {
        "inputs": {
            "images": [
                "20",
                0
            ]
        },
        "class_type": "PreviewImage",
        "_meta": {
            "title": "Preview Image"
        }
    },
    "28": {
        "inputs": {
            "int": 0
        },
        "class_type": "Primitive integer [Crystools]",
        "_meta": {
            "title": "🪛 Primitive integer"
        }
    },
    "33": {
        "inputs": {
            "image": ""
        },
        "class_type": "ETN_LoadImageBase64",
        "_meta": {
            "title": "Load Image (Base64)"
        }
    },
    "34": {
        "inputs": {
            "images": [
                "8",
                0
            ]
        },
        "class_type": "ETN_SendImageWebSocket",
        "_meta": {
            "title": "Send Image (WebSocket)"
        }
    }


};

export default function TestComfyUi() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [prompt, setPrompt] = useState(defaultWorkflow["6"].inputs.text);
    const [resultUrl, setResultUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef();

    // 处理图片文件变为 base64
    const fileToBase64 = file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result.split("base64,")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    // 处理上传和生成
    const handleGenerate = async () => {
        if (!selectedFile) {
            alert("Please upload an image.");
            return;
        }
        setLoading(true);
        setResultUrl("");

        try {
            const imgBase64 = await fileToBase64(selectedFile);
            const workflow = getDefaultWorkflow(imgBase64, prompt);

            // 调用ComfyUI API
            const outputs = await comfy.run(workflow, (results, err) => {
                console.log('callback outputs:', results, err);
                if (err) {
                    setLoading(false);
                    alert(err);
                }
            });
            console.log('outputs from run:', outputs);

            // 默认用第一个结果
            if (outputs && outputs[0] && outputs[0].src) {
                setResultUrl(outputs[0].src);
            } else {
                alert("No image generated.");
            }


        } catch (e) {
            alert("Error: " + e);
        }
        setLoading(false);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 480, mx: "auto" }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
                ComfyUI Test
            </Typography>
            <Button
                variant="contained"
                component="label"
                sx={{ mb: 2 }}
            >
                Upload Image
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => setSelectedFile(e.target.files[0])}
                />
            </Button>
            {selectedFile && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedFile.name}
                </Typography>
            )}
            <TextField
                fullWidth
                label="Prompt"
                variant="outlined"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                sx={{ mb: 2 }}
            />
            <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate"}
            </Button>
            <Box sx={{ mt: 3, textAlign: "center" }}>
                {loading && <CircularProgress />}
                {resultUrl && (
                    <Box sx={{ mt: 2 }}>
                        <img
                            src={resultUrl}
                            alt="Generated"
                            style={{ maxWidth: "100%", borderRadius: 8 }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
