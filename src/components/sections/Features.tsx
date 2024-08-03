import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PriceCheckIcon from '@mui/icons-material/PriceCheck'; // Icon for pricing
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Icon with stars
import ThemeIcon from '@mui/icons-material/Brightness4'; // Example icon
import BackupIcon from '@mui/icons-material/Backup'; // Additional example icon

const AppFeatures = () => {
  const theme = useTheme();

  return (
    <Box id="Features" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',  // Ensures it takes the full viewport width
      padding: theme.spacing(16, 2),  // Vertical and horizontal padding
      backgroundColor: theme.palette.background.default,  // Background color from theme
      overflow: 'hidden',  // Keeps all content within the bounds of the Box
    }}>
    
      <Typography gutterBottom sx={{
        fontSize:'2.5rem',
      }}>
        App Features
      </Typography>
      <Typography sx={{ 
        maxWidth: 1200, 
        textAlign: 'center', 
        marginBottom: 10,
        fontSize: '1.5rem',
      }}>
        My Pantry Pal is a web browser app that keeps your pantry organized with a detailed inventory, tracking quantities,
        expiration dates, prices, and more. Quickly add items by scanning barcodes with your device's camera, and
        let our AI tools classify ingredients and suggest recipes based on your pantry's contents. Available on your
        web browser for absolutely free.
      </Typography>
      <List sx={{
        display: 'flex',
        flexWrap: 'wrap',  // Allows wrapping of list items
        justifyContent: 'center',  // Centers items
        padding: 0,
        width: '100%',  // Full width of the container
        maxWidth: 800,  // Limit width for better alignment
      }}>
        <ListItem sx={{ width: '50%', textAlign: 'center' }}>  {/* Sets width to 50% for 2 items per row */}
          <ListItemIcon>
            <PriceCheckIcon fontSize="large" sx={{ color: theme.palette.primary.main }}/>  {/* Price tag icon */}
          </ListItemIcon>
          <ListItemText 
            primary="100% Free" 
            primaryTypographyProps={{ 
              sx: { fontSize: '1.25rem', fontWeight: 'bold' }  // Adjust font size and weight
            }}  
            secondary={
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '1.15rem' }}  // Updated secondary font size
              >
                No pricing plans. No subscriptions. No ads.
              </Typography>
            }
          />
        </ListItem>
        <ListItem sx={{ width: '50%', textAlign: 'center' }}>  {/* Sets width to 50% for 2 items per row */}
          <ListItemIcon>
            <AutoAwesomeIcon fontSize="large" sx={{ color: theme.palette.primary.main }}/>  {/* Correct icon */}
          </ListItemIcon>
          <ListItemText             
            primary="AI-Powered Tools" 
            primaryTypographyProps={{ 
              sx: { fontSize: '1.25rem', fontWeight: 'bold' }  // Adjust font size and weight
            }}  
            secondary={
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '1.15rem' }}  // Updated secondary font size
              >
                So easy even your grandma can use it!
              </Typography>
            }
          />
        </ListItem>
        <ListItem sx={{ width: '50%', textAlign: 'center' }}>  {/* Sets width to 50% for 2 items per row */}
          <ListItemIcon>
            <ThemeIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
          </ListItemIcon>
          <ListItemText 
            primary="Light & Dark Mode" 
            primaryTypographyProps={{ 
              sx: { fontSize: '1.25rem', fontWeight: 'bold' }  // Adjust font size and weight
            }} 
            secondary={
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '1.15rem' }}  // Updated secondary font size
                dangerouslySetInnerHTML={{
                  __html: 'Want to <del>increase</del> reduce eye strain? No problem!',
                }}
              />
            }
          />
        </ListItem>
        <ListItem sx={{ width: '50%', textAlign: 'center' }}>  {/* Sets width to 50% for 2 items per row */}
          <ListItemIcon>
            <BackupIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
          </ListItemIcon>
          <ListItemText 
            primary="Save Your Data" 
            primaryTypographyProps={{ 
              sx: { fontSize: '1.25rem', fontWeight: 'bold' }  // Adjust font size and weight
            }}  
            secondary={
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: '1.15rem' }}  // Updated secondary font size
              >
                Make an account, and don't lose track of your groceries!
              </Typography>
            }
          />
        </ListItem>
      </List>
    </Box>
  );
};

export default AppFeatures;
