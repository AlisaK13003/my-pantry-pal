import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

const Newsletter = () => {
  const theme = useTheme();

  // Convert hex color to RGB
  const hexToRgb = (hex) => {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the r, g, b values
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return `${r}, ${g}, ${b}`;
  };

  const primaryRgb = hexToRgb(theme.palette.primary.main);

  return (
    <Box
      id="Contact"
      sx={{
        width: '100%', // Full width for the background
        backgroundColor: `rgba(${primaryRgb}, 0.5)`, // Background color with 50% transparency
        display: 'flex',
        justifyContent: 'center', // Center the inner content box
        padding: theme.spacing(8, 2), // Padding for top and bottom
      }}
    >
      <Box
        sx={{
          maxWidth: 1200, // Maximum width for the inner content
          width: '100%', // Ensures the content box scales down for smaller screens
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          component="h2"
          sx={{ fontSize: '2.5rem' }}
        >
          Join Our Newsletter
        </Typography>
        <Typography
          sx={{
            maxWidth: 800,
            textAlign: 'center',
            marginBottom: 3, // More space below the paragraph
            fontSize: '1.25rem', // Larger text for readability
          }}
        >
          If you would like to receive occasional emails from us about important updates and other information relating to My Pantry Pal, please enter your email address below to join our newsletter. <br />
          <Typography component="span" sx={{ fontStyle: 'italic' }}>
            (We will never sell your data to a 3rd party, pinky promise!)
          </Typography>
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%', // Full width for better responsiveness
            maxWidth: 800, // Limit width to keep the form aligned and centered
          }}
        >
          <TextField
            label="Email Address"
            variant="outlined"
            sx={{
              marginRight: 1,
              flexGrow: 1,
              backgroundColor: 'white', // Set background to white
              borderRadius: 1, // Rounded corners
              '& .MuiInputLabel-root': {
                color: 'black', // Label color
              },
            }}
            InputLabelProps={{
              sx: {
                color: 'white', // Ensure the label text is white
              },
            }}
            InputProps={{
              sx: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'white', // Default border color to white
                  },
                  '&:hover fieldset': {
                    borderColor: 'white', // Hover border color to white
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white', // Focused border color to white
                  },
                  '& input': {
                    color: 'black', // Input text color
                  },
                },
              },
            }}
            fullWidth
          />
          <Button variant="contained" color="primary" sx={{ fontSize: '1rem' }}>
            Subscribe
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Newsletter;
