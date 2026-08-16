import * as React from 'react';
import { useMemo, useState } from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createMyTheme } from '../styles/theme';  // Adjust the path as necessary
import '../styles/globals.css';  // Global styles

function MyApp({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => createMyTheme(mode), [mode]);

  const handleToggleMode = () => {
    setMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS */}
      <Component {...pageProps} appMode={mode} onToggleAppMode={handleToggleMode} />
    </ThemeProvider>
  );
}

export default MyApp;
