import React, { useState } from 'react';
import {
    Box, TextField, Typography, Radio, RadioGroup,
    FormControlLabel, FormControl, FormLabel, Button, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { sendToDeepSeek } from '../utils/Deepseek';
import { auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import GlitchLoading from '../components/GlitchLoading';

export default function Questionnaire() {
    const [username, setUsername] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [selfDescription, setSelfDescription] = useState('');

    const [emotionalCoping, setEmotionalCoping] = useState('');
    const [selfNarrative, setSelfNarrative] = useState('');
    const [postingBehavior, setPostingBehavior] = useState('');
    const [contentDislike, setContentDislike] = useState('');
    const [scrollingMotive, setScrollingMotive] = useState('');

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const classifyUser = ({
        emotionalCoping,
        selfNarrative,
        postingBehavior,
        contentDislike,
        scrollingMotive
    }) => {
        const score = {
            emotion: 0,
            logic: 0,
            entertainment: 0,
            conspiracy: 0,
            aesthetic: 0
        };

        if (["Doomscrolling", "Escapist Fantasies", "Comment Section Seeker"].includes(emotionalCoping)) score.emotion++;
        if (["Silence by Fear", "Personal Monologue"].includes(postingBehavior)) score.emotion++;
        if (contentDislike === "Toxic Negativity") score.emotion++;
        if (["Distraction", "Habitual"].includes(scrollingMotive)) score.emotion++;

        if (selfNarrative === "Critical Consumer") score.logic++;
        if (postingBehavior === "Perfect Curation") score.logic++;
        if (contentDislike === "Overfed Algorithm") score.logic++;
        if (scrollingMotive === "Searching") score.logic++;

        if (emotionalCoping === "Retail Therapy") score.entertainment++;
        if (selfNarrative === "Polite Liker") score.entertainment++;
        if (contentDislike === "Hard Sell") score.entertainment++;
        if (["Endless Novelty", "Algorithm Knows Me"].includes(scrollingMotive)) score.entertainment++;

        if (selfNarrative === "Detached Browser") score.conspiracy++;
        if (postingBehavior === "Post-and-Pull") score.conspiracy++;
        if (["Perfect Personas", "Hidden Gems"].includes(contentDislike)) score.conspiracy++;
        if (["Habitual", "Algorithm Knows Me"].includes(scrollingMotive)) score.conspiracy++;

        if (emotionalCoping === "Shutdown") score.aesthetic++;
        if (["Perfect Curation", "Personal Monologue"].includes(postingBehavior)) score.aesthetic++;
        if (selfNarrative === "Smart Shopper") score.aesthetic++;
        if (scrollingMotive === "Searching") score.aesthetic++;

        const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
        const topCategory = sorted[0][0];

        const mapping = {
            emotion: "Emotion-Driven",
            logic: "Logic-Seeker",
            entertainment: "Entertainment-Lover",
            conspiracy: "Conspiracy-Oriented",
            aesthetic: "Aesthetic-Focused"
        };

        return mapping[topCategory];
    };


    const handleSubmit = async () => {
        if (
            !username ||
            !birthdate ||
            !emotionalCoping ||
            !selfNarrative ||
            !postingBehavior ||
            !contentDislike ||
            !scrollingMotive
        ) {
            alert('Please complete all fields before submitting :)');
            return;
        }

        const user = auth.currentUser;
        const uid = user?.uid || 'unknown_user';
        if (uid === 'unknown_user') {
            console.error("User not authenticated.");
            return;
        }

        const rawBirthDate = new Date(birthdate);
        const today = new Date();
        let rawAge = today.getFullYear() - rawBirthDate.getFullYear();
        const monthDiff = today.getMonth() - rawBirthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < rawBirthDate.getDate())) {
            rawAge--;
        }

        const userType = classifyUser({
            emotionalCoping,
            selfNarrative,
            postingBehavior,
            contentDislike,
            scrollingMotive,
        });

        const data = {
            uid,
            username,
            age: rawAge,
            birthdate,
            selfDescription,
            emotionalCoping,
            selfNarrative,
            postingBehavior,
            contentDislike,
            scrollingMotive,
        };

        const fingerprintPrompt = `Generate a satirical and psychologically insightful user profile based on these traits: emotional coping = ${emotionalCoping}, self-narrative = ${selfNarrative}, posting behavior = ${postingBehavior}, content dislike = ${contentDislike}, scrolling motive = ${scrollingMotive}. Respond with one or two ironic sentences that sound like the algorithm knows the user too well. Respond ONLY with the profile sentence.`;

        setLoading(true);
        const fingerprintRes = await sendToDeepSeek(fingerprintPrompt);
        setLoading(false);

        const fingerprint = fingerprintRes.response || '';

        const completeData = {
            ...data,
            fingerprint,
            userType,
            timestamp: new Date(),
        };

        try {
            await setDoc(doc(db, 'user_profiles', uid), completeData);
            alert('✅ Your data is saved!');
            navigate('/profile');
        } catch (err) {
            console.error("❌ Firestore error:", err);
            alert('Failed to save data.');
        }
    };

    const questions = [
        {
            label: 'Q1. When you’re emotionally unstable, what do you usually do?',
            value: emotionalCoping,
            setValue: setEmotionalCoping,
            options: [
                ['Doomscrolling', '📱 Open short video platforms and just scroll'],
                ['Escapist Fantasies', '📷 Watch others’ lives and imagine being part of them'],
                ['Retail Therapy', '🛒 Buy small things to feel better'],
                ['Shutdown', '🔌 Turn off everything and lie down'],
                ['Comment Section Seeker', '💬 Look for comments from people who feel the same'],
            ],
        },
        {
            label: 'Q2. Which of these sounds like you?',
            value: selfNarrative,
            setValue: setSelfNarrative,
            options: [
                ['Detached Browser', '😐 I just browse casually. I don’t take anything seriously'],
                ['Critical Consumer', '📊 I only care about content quality, not algorithms'],
                ['Polite Liker', '👍 I like posts out of courtesy, not because I like them'],
                ['Smart Shopper', '🛍️ I don’t fall for looks — only value matters'],
                ['Quiet Repeater', '🔁 I rewatch posts silently but never engage'],
            ],
        },
        {
            label: 'Q3. What do you care most about when posting something?',
            value: postingBehavior,
            setValue: setPostingBehavior,
            options: [
                ['Perfect Curation', '🎨 Carefully choose images, edit captions'],
                ['Private Sharing', '🔒 Only for close friends'],
                ['Silence by Fear', '😶 I don’t post — fear of being misunderstood'],
                ['Post-and-Pull', '🚮 Post, check who saw it, then delete'],
                ['Personal Monologue', '🗣️ I post not for others, but for myself'],
            ],
        },
        {
            label: 'Q4. What kind of content annoys you the most?',
            value: contentDislike,
            setValue: setContentDislike,
            options: [
                ['Perfect Personas', '💄 People who look too polished and perfect'],
                ['Hard Sell', '📢 Content that obviously wants to sell something'],
                ['Toxic Negativity', '😡 Angry, messy comment sections'],
                ['Hidden Gems', '📉 Great work that no one sees'],
                ['Overfed Algorithm', '🌀 Getting repeated irrelevant recommendations'],
            ],
        },
        {
            label: 'Q5. Why do you think you keep scrolling?',
            value: scrollingMotive,
            setValue: setScrollingMotive,
            options: [
                ['Searching', '🔍 I’m still looking for what I want to see'],
                ['Endless Novelty', '🎡 There’s always something new'],
                ['Algorithm Knows Me', '🧠 It gets me — always accurate recommendations'],
                ['Distraction', '🙈 I just want to take my mind off things'],
                ['Habitual', '🔁 I don’t know — maybe just habit'],
            ],
        },
    ];

    return (
        <Box
            sx={{
                minHeight: '70vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                px: 2,
                py: 4,
                position: 'relative',
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 600, p: 4 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        mb: 3,
                        textAlign: 'center',
                    }}
                >
                    Tell us about yourself
                </Typography>

                <TextField
                    label="Username"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    label="Birthday"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                />
                <TextField
                    label="Describe yourself in one sentence (optional)"
                    fullWidth
                    margin="normal"
                    multiline
                    minRows={2}
                    value={selfDescription}
                    onChange={(e) => setSelfDescription(e.target.value)}
                />

                <Divider sx={{ my: 3 }} />

                {questions.map((q, idx) => (
                    <FormControl key={idx} margin="normal" fullWidth>
                        <FormLabel sx={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: 16 }}>
                            {q.label}
                        </FormLabel>
                        <RadioGroup value={q.value} onChange={(e) => q.setValue(e.target.value)}>
                            {q.options.map(([val, label]) => (
                                <FormControlLabel
                                    key={val}
                                    value={val}
                                    control={
                                        <Radio sx={{
                                            color: '#888',
                                            '&.Mui-checked': { color: '#39ff14' },
                                        }} />
                                    }
                                    label={<Typography sx={{ color: q.value === val ? '#39ff14' : '#ddd', fontFamily: 'monospace' }}>{label}</Typography>}
                                />
                            ))}
                        </RadioGroup>
                        <Divider sx={{ my: 3, borderColor: '#444' }} />
                    </FormControl>
                ))}

                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    fullWidth
                    sx={{
                        mt: 1,
                        py: 1.3,
                        mb: 3,
                        textTransform: 'none',
                        fontFamily: 'monospace',
                        fontSize: 16,
                        borderRadius: 0,
                    }}
                >
                    Submit
                </Button>
            </Box>
            {loading && (<GlitchLoading />)}
        </Box>
    );
}
