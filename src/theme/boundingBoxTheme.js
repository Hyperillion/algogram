import { createTheme } from '@mui/material/styles';

const boundingBoxTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#39ff14',
    },
    background: {
      default: '#000',
      paper: '#111',
    },
    text: {
      primary: '#39ff14',
      secondary: '#aaa',
    },
  },
  typography: {
    fontFamily: 'monospace',
    button: {
      textTransform: 'lowercase',
      fontSize: '1rem',
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          border: '2px solid #39ff14',
          color: '#39ff14',
          borderRadius: 0,
          backgroundColor: 'transparent',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: '#6aff64',
            color: '#6aff64',
            backgroundColor: 'rgba(57,255,20,0.08)',
            boxShadow: '0 0 10px #39ff14',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#111',
          border: '1px solid #39ff14',
          borderRadius: 0,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#39ff14',
        },
      },
    },
  },
});

export default boundingBoxTheme;
