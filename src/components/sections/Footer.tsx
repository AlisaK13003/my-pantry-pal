import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center', // Centers the inner box
      padding: theme.spacing(2),
      backgroundColor: theme.palette.primary.main, // Ensures the footer background is the primary color
      color: theme.palette.common.white,
      width: '100%', // This ensures it spans the full width of the viewport
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%', // Takes the full width of the inner container
        maxWidth: 1200, // Maximum width of the content
        padding: '0 20px', // Padding inside the container
      }}>
        <Typography variant="body2">
          © Copyright My Pantry Pal
        </Typography>
        <Typography variant="body2">
          Designed by Alisa Katasonova
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
