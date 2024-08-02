import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

const Newsletter = () => {
  const theme = useTheme();

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginX: 'auto',
      maxWidth: 1200, // Consistent with other sections
      padding: theme.spacing(8, 2), // Vertical and horizontal padding like other sections
      backgroundColor: theme.palette.background.default, // Background color from the theme
      width: '100%', // Takes full viewport width
    }}>
      <Typography variant="h4" gutterBottom component="h2" sx={{ fontSize: '2.5rem' }}>
        Join Our Newsletter
      </Typography>
      <Typography sx={{
        maxWidth: 800,
        textAlign: 'center',
        marginBottom: 3, // More space below the paragraph
        fontSize: '1.25rem', // Larger text for readability
      }}>
        If you would like to receive occasional emails from us about important updates 
        and other information relating to My Pantry Pal, please enter your email address 
        below to join our newsletter. 
        <br />
        <Typography component="span" sx={{ fontStyle: 'italic' }}>
          (We will never sell your data to a 3rd party, pinky promise!)
        </Typography>
      </Typography>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%', // Full width for better responsiveness
        maxWidth: 800, // Limit width to keep the form aligned and centered
      }}>
        <TextField
          label="Email Address"
          variant="outlined"
          sx={{ marginRight: 1, flexGrow: 1 }}
          fullWidth
        />
        <Button variant="contained" color="primary" sx={{ fontSize: '1rem' }}>
          Subscribe
        </Button>
      </Box>
    </Box>
  );
};

export default Newsletter;
