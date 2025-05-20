import React from 'react';
import { Typography, Paper } from '@mui/material';
import '../styles/fonts.css';
import useScrollDirection from '../utils/useScrollDirection';

export default function Header() {
  const scrollDirection = useScrollDirection();
  // console.log(scrollDirection[1]);
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        top: scrollDirection[0] === 'up' ? 0 : -80,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '60px',
        transition: 'top 0.3s ease-in-out',
        // backgroundColor: '#fff',
        borderRadius: 0,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          padding: 2,
          textAlign: 'left',
          fontFamily: 'LilyScriptOne',
        }}
      >
        Algogram
      </Typography>
    </Paper>
  );
}
