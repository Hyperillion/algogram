import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate } from 'react-router-dom';
import { storage, auth, db } from '../firebase';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, Typography, Button } from '@mui/material';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export default function Upload() {
    const location = useLocation();
    const navigate = useNavigate();
    const { clippedImageUrl, detectedLabel, reason, userVariants = {} } = location.state || {};

    const [user, setUser] = useState(null);
    const [postImageUrl, setPostImageUrl] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [userType, setUserType] = useState(null); // 核心：数据库查询得来
    const hasUploaded = useRef(false);

    // 查找 Firestore 里的 userType
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // 查询 user_profiles
                const profileRef = doc(db, 'user_profiles', currentUser.uid);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    setUserType(profileSnap.data().userType || 'Emotion-Driven');
                } else {
                    setUserType('Emotion-Driven'); // fallback
                }
            } else {
                alert('You must be logged in to upload.');
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // 自动上传图片到 storage
    useEffect(() => {
        if (!clippedImageUrl || !user || hasUploaded.current) return;

        const uploadImage = async () => {
            hasUploaded.current = true;
            try {
                const response = await fetch(clippedImageUrl);
                const blob = await response.blob();

                if (blob.type !== 'image/png') {
                    alert('Only PNG images are allowed.');
                    navigate('/scan');
                    return;
                }

                const filename = `${uuidv4()}.png`;
                const storageRef = ref(storage, `images/${filename}`);
                const uploadTask = uploadBytesResumable(storageRef, blob);

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error('Upload failed:', error);
                        alert('Upload failed.');
                    },
                    async () => {
                        const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${storageRef.bucket}/o/${encodeURIComponent(storageRef.fullPath)}?alt=media`;
                        setPostImageUrl(downloadURL);
                        setUploadProgress(100);
                    }
                );
            } catch (err) {
                console.error('Error during upload:', err);
                alert('Something went wrong.');
                navigate('/scan');
            }
        };

        uploadImage();
    }, [clippedImageUrl, user, navigate]);

    // 获取当前画像内容
    const currentVariant = userType && userVariants[userType] ? userVariants[userType] : {};
    const caption = currentVariant.caption || '';
    const prompt = currentVariant.prompt || '';

    const uploadPost = async () => {
        if (!postImageUrl || !caption.trim()) {
            alert('Please enter a caption.');
            return;
        }

        const postData = {
            userId: user.uid,
            imageUrl: postImageUrl,
            caption: caption.trim(),
            detectedLabel: detectedLabel || '',
            userType: userType || '',
            createdAt: serverTimestamp(),
            likes: 0,
            userVariants: userVariants
        };

        try {
            const docRef = await addDoc(collection(db, 'posts'), postData);
            alert('✅ Your post is published!');
            navigate(`/post/${docRef.id}`);
        } catch (err) {
            console.error("❌ Firestore error:", err);
            alert('Failed to save post data.');
        }
    };

    return (
        <Box sx={{ p: 3, paddingBottom: "80px", textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', m: 3 }}>
                My Post Preview
            </Typography>

            {clippedImageUrl && (
                <Box sx={{ mb: 2 }}>
                    <img
                        src={clippedImageUrl}
                        alt="Clipped"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Box>
            )}

            {userType && caption && (
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                    “{caption}”
                </Typography>
            )}

            {/* {prompt && (
                <Typography
                    variant="caption"
                    sx={{
                        color: '#888',
                        fontFamily: 'monospace',
                        display: 'block',
                        mb: 2,
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-all'
                    }}
                >
                    <b>Stable Diffusion Prompt:</b> {prompt}
                </Typography>
            )} */}

            {reason && (
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        m: 2,
                        display: 'block',
                        textAlign: 'left'
                    }}
                >
                    Words from Algorithm: {reason}
                </Typography>
            )}

            <Button
                variant="contained"
                onClick={uploadPost}
                disabled={!postImageUrl}
                sx={{ textTransform: 'none', mt: 2 }}
            >
                Post
            </Button>
        </Box>
    );
}
