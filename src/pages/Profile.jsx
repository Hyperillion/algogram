import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Typography, Grid, Button, Divider } from '@mui/material';
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function Profile() {
    const navigate = useNavigate();
    const [fingerprint, setFingerprint] = useState('...');
    const [username, setUsername] = useState('...');
    const [userPosts, setUserPosts] = useState([]);
    const [userType, setUserType] = useState('...'); // Assuming you want to use this later

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch profile info
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, 'user_profiles', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFingerprint(data.fingerprint || 'No fingerprint available');
                    setUsername(data.username || 'No username available');
                    setUserType(data.userType || 'No user type available');
                } else {
                    setFingerprint('No data found.');
                    setUsername('No username available');
                    setUserType('No user type available');
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setFingerprint('Error fetching profile');
            }
        };

        // Fetch user's posts
        const fetchUserPosts = async () => {
            try {
                const postsRef = collection(db, 'posts');
                const q = query(
                    postsRef,
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUserPosts(posts);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        fetchProfile();
        fetchUserPosts();
    }, []);

    return (
        <Box sx={{ padding: 2, paddingBottom: '80px', paddingTop: '60px' }}>
            {/* Top Section */}
            <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                    alt="User Avatar"
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${auth.currentUser?.uid}`}
                    sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                    <Typography variant="h6">{username}</Typography>
                    <Typography variant="body2" color="textSecondary">{userType}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>{fingerprint}</Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1, fontWeight: 'bold' }}
                        onClick={() => navigate('/questionare')}
                    >
                        Edit Profile
                    </Button>

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleLogout}
                        sx={{ mt: 1, ml: 2, color: 'red', borderColor: 'red', fontWeight: 'bold' }}
                    >
                        Log Out
                    </Button>
                </Box>

            </Box>

            {/* Stats */}
            <Box display="flex" justifyContent="space-around" mb={2}>
                <Box textAlign="center">
                    <Typography variant="subtitle1" fontWeight="bold">{userPosts.length}</Typography>
                    <Typography variant="body2">Posts</Typography>
                </Box>
                <Box textAlign="center">
                    <Typography variant="subtitle1" fontWeight="bold">0</Typography>
                    <Typography variant="body2">Followers</Typography>
                </Box>
                <Box textAlign="center">
                    <Typography variant="subtitle1" fontWeight="bold">0</Typography>
                    <Typography variant="body2">Following</Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Post Feed */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 2,
                }}
            >
                {userPosts.map((post) => (
                    <Box
                        key={post.id}
                        sx={{
                            width: '100%',
                            maxWidth: 600,
                            my: 2,
                            border: '1px solid',
                            borderColor: 'primary.main',
                        }}
                    >
                        <Box
                            component="img"
                            src={post.imageUrl}
                            alt="post"
                            sx={{
                                width: '100%',
                                maxHeight: 400,
                                objectFit: 'contain',
                                display: 'block',
                                backgroundColor: '#000',
                            }}
                        />

                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {post.caption}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

        </Box>
    );
}
