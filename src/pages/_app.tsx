import * as React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createMyTheme } from '../styles/theme';  // Adjust the path as necessary
import '../styles/globals.css';  // Global styles

function MyApp({ Component, pageProps }: AppProps) {
  const theme = createMyTheme('light');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
