import * as React from 'react';
import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Brightness4 from '@mui/icons-material/Brightness4';
import Brightness7 from '@mui/icons-material/Brightness7';
import { Link } from 'react-scroll';
import SignInSignUpModal from "../ui/SignupPopup";
  // Make sure this path is correct

interface NavbarProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

export default function Navbar({ mode, onToggleMode }: NavbarProps) {
  const [elevated, setElevated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setElevated(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{
        backgroundColor: elevated 
          ? `rgba(${parseInt(theme.palette.background.default.slice(1, 3), 16)}, 
                  ${parseInt(theme.palette.background.default.slice(3, 5), 16)}, 
                  ${parseInt(theme.palette.background.default.slice(5, 7), 16)}, 0.9)` 
          : 'transparent',
        transition: 'background-color 0.3s ease-in-out',
        boxShadow: elevated ? 3 : 'none',
        color: theme.palette.text.primary,
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
            <Link to="Hero" spy={true} smooth={true} offset={-70} duration={1200}>
              <Typography sx={{ fontSize: '1rem', marginRight: 2, cursor: 'pointer' }}>Home</Typography>
            </Link>
            <Link to="Features" spy={true} smooth={true} offset={-70} duration={1200}>
              <Typography sx={{ fontSize: '1rem', marginRight: 2, cursor: 'pointer' }}>App Features</Typography>
            </Link>
            <Link to="Contact" spy={true} smooth={true} offset={-70} duration={1200}>
              <Typography sx={{ fontSize: '1rem', marginRight: 2, cursor: 'pointer' }}>Contact</Typography>
            </Link>
            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton color="inherit" onClick={onToggleMode} aria-label="toggle light and dark mode">
                {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
              </IconButton>
            </Tooltip>
            <Button onClick={handleOpenModal} variant="outlined" color="inherit" sx={{
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
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This offsets the content below the AppBar */}
      <SignInSignUpModal open={modalOpen} handleClose={handleCloseModal} />
    </Box>
  );
}
