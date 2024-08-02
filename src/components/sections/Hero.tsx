import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const Hero = () => {
  const theme = useTheme();

  return (
    <Box sx={{
      position: 'relative',  // Important for absolute positioning of the SVG
      width: '100%',         // Ensures it spans the full width of the viewport
      overflow: 'visible',   // Allows elements to extend outside the container if necessary
      paddingTop: theme.spacing(8),
      paddingBottom: theme.spacing(16),  // Provides space at the top, adjust if the navbar height affects this
    }}>
      {/* SVG Background */}
      <Box sx={{
        position: 'absolute',
        top: '-12%',                 // Ensures it starts right at the top of the container
        left: '2%',                  // Align to the left
        width: '100%',               // Full width
        height: '80vh',             // Full viewport height
        backgroundImage: `url('/assets/images/backgroundHero.svg')`,
        backgroundSize: 'cover',     // Ensures the SVG covers the entire area
        backgroundRepeat: 'no-repeat',
        zIndex: -1,                  // Keeps it behind the content
      }} />

      {/* Section Wrapper */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginX: 'auto',
        maxWidth: 1200,              // Matches the content width with other components
        padding: theme.spacing(2),   // Provides consistent spacing
        zIndex: 1,                   // Ensures content is above the background
        paddingTop: theme.spacing(20)  // Increased top padding to lower the text content
      }}>
        <Box sx={{
          maxWidth: '600px',         // Content width
        }}>
          <Typography component="h1" gutterBottom sx={{
            fontSize: '5rem',
          }}>
            My Pantry Pal
          </Typography>
          <Typography sx={{
            fontSize:'1.8rem',
          }}>
            Press "Open Web Browser App" to start organizing your pantry today!
            <br /><br />
            Effortlessly manage your pantry by scanning item barcodes with your device's camera!
            Instantly upload and classify ingredients using AI, while our app suggests delicious
            recipes tailored to your pantry.
          </Typography>
        </Box>
        {/* Placeholder for an image */}
        <Box sx={{
          width: 450,                // Width for the image
          height: 300,               // Height for the image
          backgroundColor: '#ccc',   // Placeholder color for the image
        }}>
          {/* Placeholder for image, you can replace it with an <img> tag or similar */}
        </Box>
      </Box>
    </Box>
  );
};

export default Hero;
