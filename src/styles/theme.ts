import { createTheme } from '@mui/material/styles';

// Function to get design tokens based on the mode (light or dark)
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,  // Automatically set light or dark mode based on value
    ...(mode === 'dark'
      ? {
          // Palette settings for dark mode
          primary: {
            main: '#A0D3DB', // Example primary color for dark mode
          },
          secondary: {
            main: '#B8B8B8',  // Example secondary color for dark mode
          },
          background: {
            default: '#1D1D1D',  // Darker background for dark mode
            paper: '#242424',
          },
          text: {
            primary: '#D3D3D3',  // Off-white for better visibility in dark mode
            secondary: '#B8B8B8',
          },
        }
      : {
          // Palette settings for light mode
          primary: {
            main: '#A0D3DB', // Example primary color for light mode
          },
          secondary: {
            main: '#3C2F21',  // Example secondary color for light mode
          },
          background: {
            default: '#FCF4E4',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#3C2F21',  // Primary text color for light mode
            secondary: '#5A6978',  // Secondary text color for light mode
          },
        }),
    common: {
      white: '#FFFFFF',  // Define common white color
    }
  },
  typography: {
    fontFamily: 'Bubbler One, sans-serif',  // Set custom font along with generic fallback
  },
});

// Function to create theme based on mode
export const createMyTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));
