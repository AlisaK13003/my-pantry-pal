import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const Hero = () => {
  const theme = useTheme();

  return (
    <Box id="Hero" sx={{
      position: 'relative',
      width: '100%',
      overflow: 'visible',
      paddingTop: theme.spacing(8),
      paddingBottom: theme.spacing(16),
    }}>
      <Box sx={{
        position: 'absolute',
        top: '-12%',
        left: '2%',
        width: '100%',
        height: '80vh',
        backgroundImage: `url('/assets/images/backgroundHero.svg')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        zIndex: -1,
      }} />

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginX: 'auto',
        maxWidth: 1200,
        padding: theme.spacing(2),
        zIndex: 1,
        paddingTop: theme.spacing(20)
      }}>
        <Box sx={{
          maxWidth: '600px',
        }}>
          <Typography component="h1" gutterBottom sx={{
            fontSize: '5rem',
          }}>
            My Pantry Pal
          </Typography>
          <Typography sx={{
            fontSize:'1.8rem',
          }}>
            Make an account to start organizing your pantry today!
            <br /><br />
            Effortlessly manage your pantry by scanning item barcodes with your device&apos;s camera!
            Instantly upload and classify ingredients using AI, while our app suggests delicious
            recipes tailored to your pantry.
          </Typography>
        </Box>
        <Box sx={{
          width: 450,
          height: 300,
          backgroundColor: '#ccc',
        }}>
          {/* Placeholder for image */}
        </Box>
      </Box>
    </Box>
  );
};

export default Hero;
