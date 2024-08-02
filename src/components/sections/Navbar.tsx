import * as React from 'react';
import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

export default function Navbar() {
  const [elevated, setElevated] = useState(false);
  const theme = useTheme(); // Correctly use the theme

  useEffect(() => {
    const handleScroll = () => {
      setElevated(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{
        backgroundColor: elevated 
          ? `rgba(${parseInt(theme.palette.background.default.slice(1, 3), 16)}, 
                  ${parseInt(theme.palette.background.default.slice(3, 5), 16)}, 
                  ${parseInt(theme.palette.background.default.slice(5, 7), 16)}, 0.9)` 
          : 'transparent', // Use theme's background color with opacity when scrolled
        transition: 'background-color 0.3s ease-in-out', // Smooth transition for background color
        boxShadow: elevated ? 3 : 'none', // Add shadow when elevated
        color: theme.palette.text.primary, // Ensures text is visible
      }}>
        <Toolbar sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginX: 'auto',
          width: '100%',
          maxWidth: 1200,
          padding: '0 20px'
        }}>
          <img src="/assets/icons/pantryIcon.svg" alt="Home" style={{ height: '80px', width: '80px' }} />
          <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '1rem', marginRight: 2 }}>Home</Typography>
            <Typography sx={{ fontSize: '1rem', marginRight: 2 }}>App Features</Typography>
            <Typography sx={{ fontSize: '1rem', marginRight: 2 }}>Contact</Typography>
            <Button variant="outlined" color="inherit" sx={{
              textTransform: 'none',
              fontSize: '1rem',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '20px',
              color: theme.palette.common.white,
              border: 'none',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Sign In</Typography>
            </Button>
            <Button variant="outlined" color="inherit" sx={{
              textTransform: 'none',
              fontSize: '1rem',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '20px',
              color: theme.palette.common.white,
              border: 'none',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Open Web Browser App</Typography>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This offsets the content below the AppBar */}
    </Box>
  );
}
