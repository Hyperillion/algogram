import React, { useState, useEffect } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
} from '@mui/material';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import FaceRetouchingNaturalOutlinedIcon from '@mui/icons-material/FaceRetouchingNaturalOutlined';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState('/');

  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  const navActionStyle = {
    border: '2px solid transparent',
    borderRadius: 0,
    color: '#39ff14',
    '&.Mui-selected': {
      borderColor: '#39ff14',
      color: '#39ff14',
      backgroundColor: 'rgba(57,255,20,0.06)',
    },
    '&:hover': {
      backgroundColor: 'rgba(57,255,20,0.03)',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.8rem',
    },
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '2px solid #39ff14',
        backgroundColor: '#000',
        zIndex: 10,
      }}
      elevation={0}
    >
      <BottomNavigation
        showLabels={false}
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          navigate(newValue);
        }}
        sx={{
          backgroundColor: 'transparent',
        }}
      >
        <BottomNavigationAction
          value="/"
          icon={value === '/' ? <ViewStreamIcon /> : <ViewStreamOutlinedIcon />}
          sx={navActionStyle}
        />
        <BottomNavigationAction
          value="/scan"
          icon={
            value === '/scan' ? (
              <DocumentScannerIcon />
            ) : (
              <DocumentScannerOutlinedIcon />
            )
          }
          sx={navActionStyle}
        />
        <BottomNavigationAction
          value="/profile"
          icon={
            value === '/profile' ? (
              <FaceRetouchingNaturalIcon />
            ) : (
              <FaceRetouchingNaturalOutlinedIcon />
            )
          }
          sx={navActionStyle}
        />
      </BottomNavigation>
    </Paper>
  );
}
