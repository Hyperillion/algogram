import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import {
    TextField,
    Button,
    Box,
    Typography,
    Paper,
    Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '70vh',
                display: 'fixed',
                justifyContent: 'center',
                alignItems: 'center',
                px: 2,
            }}
        >
            <Box
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 0,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{ fontWeight: 'bold', fontFamily: 'monospace', mb: 3, textAlign: 'center' }}
                >
                    Welcome Back
                </Typography>

                <TextField
                    label="Email"
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                    <Typography color="error" sx={{ mt: 1, fontSize: 14 }}>
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    onClick={handleLogin}
                    fullWidth
                    sx={{
                        mt: 3,
                        py: 1.3,
                        textTransform: 'none',
                        fontFamily: 'monospace',
                        fontSize: 16,
                        letterSpacing: '0.05em',
                        borderRadius: 0,
                    }}
                >
                    Log In
                </Button>

                <Divider sx={{ my: 3 }} />

                <Typography
                    variant="body2"
                    align="center"
                    sx={{ fontFamily: 'monospace' }}
                >
                    Don’t have an account?
                    <Button
                        onClick={() => navigate('/register')}
                        sx={{
                            textTransform: 'none',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            ml: 1,
                        }}
                    >
                        Sign up
                    </Button>
                </Typography>
            </Box>
        </Box>
    );
}
