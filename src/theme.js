import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#232F3E', // AWS dark blue/navy
      light: '#37475A',
      dark: '#191E26',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF9900', // AWS orange
      light: '#FFAC33',
      dark: '#CC7A00',
      contrastText: '#000000',
    },
    background: {
      default: '#F2F3F3', // Light gray background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#16191F', // Dark text
      secondary: '#545B64', // Medium gray text
    },
    error: {
      main: '#D13212', // AWS red
    },
    warning: {
      main: '#FF9900', // AWS orange
    },
    info: {
      main: '#0073BB', // AWS blue
    },
    success: {
      main: '#1E8900', // AWS green
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    aws: {
      orange: '#FF9900',
      teal: '#00A1C9',
      red: '#D13212',
      green: '#1E8900',
      purple: '#5A3AA5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.5px',
      lineHeight: 2.5,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1)',
    '0px 1px 5px rgba(0, 0, 0, 0.05), 0px 2px 5px rgba(0, 0, 0, 0.07)',
    '0px 1px 8px rgba(0, 0, 0, 0.05), 0px 3px 7px rgba(0, 0, 0, 0.07)',
    '0px 2px 10px rgba(0, 0, 0, 0.05), 0px 4px 8px rgba(0, 0, 0, 0.07)',
    '0px 3px 12px rgba(0, 0, 0, 0.05), 0px 5px 10px rgba(0, 0, 0, 0.07)',
    '0px 3px 15px rgba(0, 0, 0, 0.05), 0px 6px 12px rgba(0, 0, 0, 0.07)',
    '0px 4px 18px rgba(0, 0, 0, 0.05), 0px 7px 14px rgba(0, 0, 0, 0.07)',
    '0px 5px 22px rgba(0, 0, 0, 0.05), 0px 8px 16px rgba(0, 0, 0, 0.07)',
    '0px 6px 25px rgba(0, 0, 0, 0.05), 0px 9px 18px rgba(0, 0, 0, 0.07)',
    '0px 7px 28px rgba(0, 0, 0, 0.05), 0px 10px 20px rgba(0, 0, 0, 0.07)',
    '0px 7px 30px rgba(0, 0, 0, 0.05), 0px 11px 22px rgba(0, 0, 0, 0.07)',
    '0px 8px 32px rgba(0, 0, 0, 0.05), 0px 12px 24px rgba(0, 0, 0, 0.07)',
    '0px 9px 34px rgba(0, 0, 0, 0.05), 0px 13px 26px rgba(0, 0, 0, 0.07)',
    '0px 10px 36px rgba(0, 0, 0, 0.05), 0px 14px 28px rgba(0, 0, 0, 0.07)',
    '0px 11px 38px rgba(0, 0, 0, 0.05), 0px 15px 30px rgba(0, 0, 0, 0.07)',
    '0px 12px 40px rgba(0, 0, 0, 0.05), 0px 16px 32px rgba(0, 0, 0, 0.07)',
    '0px 13px 42px rgba(0, 0, 0, 0.05), 0px 17px 34px rgba(0, 0, 0, 0.07)',
    '0px 14px 44px rgba(0, 0, 0, 0.05), 0px 18px 36px rgba(0, 0, 0, 0.07)',
    '0px 15px 46px rgba(0, 0, 0, 0.05), 0px 19px 38px rgba(0, 0, 0, 0.07)',
    '0px 16px 48px rgba(0, 0, 0, 0.05), 0px 20px 40px rgba(0, 0, 0, 0.07)',
    '0px 17px 50px rgba(0, 0, 0, 0.05), 0px 21px 42px rgba(0, 0, 0, 0.07)',
    '0px 18px 52px rgba(0, 0, 0, 0.05), 0px 22px 44px rgba(0, 0, 0, 0.07)',
    '0px 19px 54px rgba(0, 0, 0, 0.05), 0px 23px 46px rgba(0, 0, 0, 0.07)',
    '0px 20px 56px rgba(0, 0, 0, 0.05), 0px 24px 48px rgba(0, 0, 0, 0.07)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0A3977',
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#CC7A00',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          height: 32,
        },
        label: {
          paddingLeft: 12,
          paddingRight: 12,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F9FAFB',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F52BA',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 4,
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export default theme;
