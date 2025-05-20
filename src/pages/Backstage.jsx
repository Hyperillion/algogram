import React, { useEffect, useState } from 'react';
import {
    Box, Card, Typography, Avatar, Tooltip
} from '@mui/material';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const USER_TYPES = [
    'Aesthetic-Focused',
    'Conspiracy-Oriented',
    'Emotion-Driven',
    'Entertainment-Lover',
    'Logic-Seeker'
];

const USER_COLORS = {
    'Aesthetic-Focused': '#7CF1C0',
    'Conspiracy-Oriented': '#F9F871',
    'Emotion-Driven': '#F57DFF',
    'Entertainment-Lover': '#6FC3FF',
    'Logic-Seeker': '#39ff14',
};

export default function Backstage() {
    const [latestPost, setLatestPost] = useState(null);
    const [latestUsers, setLatestUsers] = useState({});

    // 实时监听最新 post
    useEffect(() => {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setLatestPost({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            }
        });
        return () => unsubscribe();
    }, []);

    // 实时监听五类用户
    useEffect(() => {
        const unsubscribes = USER_TYPES.map((type) => {
            const usersRef = collection(db, 'user_profiles');
            const q = query(
                usersRef,
                where('userType', '==', type),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            return onSnapshot(q, (snap) => {
                setLatestUsers(prev => ({
                    ...prev,
                    [type]: snap.empty ? null : snap.docs[0].data()
                }));
            });
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    return (
        <Box
            sx={{
                width: '95vw',
                height: '95vh',
                minHeight: '95vh',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                p: 0,
                overflow: 'hidden',
                //centering
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100,
            }}
        >
            {/* 横向五栏，每栏一张用户视角卡片 */}
            {USER_TYPES.map((type) => {
                const color = USER_COLORS[type];
                const user = latestUsers[type];
                const caption =
                    latestPost?.userVariants?.[type]?.caption ||
                    latestPost?.caption ||
                    '';
                return (
                    <Card
                        key={type}
                        sx={{
                            width: '18vw',
                            minWidth: 220,
                            maxWidth: 340,
                            height: '78vh',
                            minHeight: 420,
                            maxHeight: 740,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: '#111',
                            border: `2.5px solid ${color}`,
                            boxShadow: `0 0 22px 2px ${color}55`,
                            borderRadius: 14,
                            px: 2.2,
                            py: 3,
                            m: 0,
                            transition: 'box-shadow 0.3s'
                        }}
                    >
                        {/* 图片 1:1 比例+主题色半透明遮罩 */}
                        <Box
                            sx={{
                                width: '100%',
                                aspectRatio: '1 / 1',
                                position: 'relative',
                                mb: 2.2,
                                mt: 0,
                                borderRadius: 9,
                                overflow: 'hidden',
                                border: `1.5px solid ${color}`,
                                boxShadow: `0 0 12px 0 ${color}44`,
                            }}
                        >
                            {latestPost ? (
                                <>
                                    <img
                                        src={latestPost.imageUrl}
                                        alt="Latest Post"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: 9,
                                            display: 'block',
                                            filter: 'contrast(1.04) brightness(0.95)'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: `${color}BB`, // 半透明遮罩
                                            mixBlendMode: 'screen',
                                            opacity: 0.35,
                                            borderRadius: 9,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                </>
                            ) : (
                                <Typography color="text.secondary" variant="body1" sx={{ m: 'auto' }}>
                                    Loading...
                                </Typography>
                            )}
                        </Box>
                        {/* 用户名/类型 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                            <Avatar
                                sx={{
                                    width: 42, height: 42,
                                    mb: 1, boxShadow: `0 0 8px ${color}AA`, border: `2px solid ${color}`,
                                    bgcolor: color, color: '#222',
                                    fontWeight: 700,
                                }}
                                src={user ? `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid || user.username}` : ''}
                            >
                                {user?.username?.[0]?.toUpperCase() || type[0]}
                            </Avatar>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: 16,
                                    color: color,
                                    letterSpacing: 1,
                                    textShadow: `0 0 7px ${color}55`,
                                    mb: 0.2,
                                }}
                            >
                                {user?.username || 'Anonymous'}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: color,
                                    fontWeight: 600,
                                    opacity: 0.68,
                                    letterSpacing: 1.1,
                                }}
                            >
                                {type}
                            </Typography>
                        </Box>
                        {/* caption - 强烈主视觉 */}
                        <Box sx={{
                            width: '97%',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            mt: 1,
                        }}>
                            <Tooltip title={caption} arrow>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: color,
                                        fontFamily: 'monospace',
                                        fontWeight: 600,
                                        textShadow: `0 0 7px ${color}66`,
                                        textAlign: 'center',
                                        fontSize: 17,
                                        lineHeight: 1.35,
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'pre-line',
                                        maxHeight: 122,
                                        overflowY: caption.length > 250 ? 'auto' : 'visible'
                                    }}
                                >
                                    {caption}
                                </Typography>
                            </Tooltip>
                        </Box>
                        {/* 个性签名/自述 */}
                        {user?.selfDescription && (
                            <Tooltip title={user.selfDescription} arrow>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 2,
                                        color: color,
                                        fontSize: 13,
                                        textAlign: 'center',
                                        fontStyle: 'italic',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '98%',
                                        whiteSpace: 'pre-line',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {user.selfDescription}
                                </Typography>
                            </Tooltip>
                        )}
                    </Card>
                );
            })}
        </Box>
    );
}
