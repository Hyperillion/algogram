import React, { useEffect, useState } from 'react';
import { Box, Card, CardHeader, CardMedia, CardContent, Typography, Avatar } from '@mui/material';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Stream() {
  const [posts, setPosts] = useState([]);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const profileRef = doc(db, 'user_profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserType(profileSnap.data().userType || 'Emotion-Driven');
        } else {
          setUserType('Emotion-Driven'); 
        }
      } else {
        setUserType('Emotion-Driven'); 
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPostsWithUsernames = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const userIds = [...new Set(fetchedPosts.map(post => post.userId))];
        const userMap = {};
        await Promise.all(
          userIds.map(async (uid) => {
            const profileRef = doc(db, 'user_profiles', uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              userMap[uid] = profileSnap.data().username || uid;
            } else {
              userMap[uid] = uid; // fallback
            }
          })
        );

        const postsWithUsernames = fetchedPosts.map(post => ({
          ...post,
          username: userMap[post.userId] || post.userId,
        }));

        setPosts(postsWithUsernames);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts or usernames:', error);
        setLoading(false);
      }
    };

    fetchPostsWithUsernames();
  }, []);

  if (loading || userType === null) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        paddingBottom: '80px',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {posts.map((post) => {
        // 优先显示和当前 userType 匹配的 caption
        let caption = post.caption;
        if (post.userVariants && post.userVariants[userType] && post.userVariants[userType].caption) {
          caption = post.userVariants[userType].caption;
        }
        return (
          <Card
            key={post.id}
            sx={{
              my: 2,
              width: '100%',
              maxWidth: 600,
            }}
          >
            <CardHeader
              avatar={<Avatar src={`https://api.dicebear.com/7.x/identicon/svg?seed=${post.userId}`} />}
              title={post.username}
            />
            <CardMedia
              component="img"
              image={post.imageUrl}
              alt="post image"
              sx={{
                maxHeight: 400,
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                backgroundColor: '#000',
              }}
            />

            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {caption}
              </Typography>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
