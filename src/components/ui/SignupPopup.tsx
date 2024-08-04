import React, { useState, FormEvent, ChangeEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useRouter } from 'next/router';
import { signIn, signUp } from '../../firebase'; // Ensure the path to your firebase config file is correct

interface SignInSignUpModalProps {
  open: boolean;
  handleClose: () => void;
}

const SignInSignUpModal: React.FC<SignInSignUpModalProps> = ({ open, handleClose }) => {
  const router = useRouter();
  const [tabValue, setTabValue] = useState<number>(0);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    setPasswordError('');
  
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
  
    try {
      await signIn(email, password);
      console.log('Sign in successful');
      router.push('/inventory');
    } catch (error: any) {
      console.error('Sign in failed', error);
      switch (error.code) {
        case 'auth/invalid-email':
          setEmailError('Please enter a valid email address.');
          break;
        case 'auth/invalid-credential':
          setEmailError('Your email or password is incorrect.');
          break;
        default:
          setEmailError('An error occurred during sign in. Please try again.');
          break;
      }
    }
  };
  
  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Confirm password is required');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
  
    try {
      await signUp(email, password);
      console.log('Sign up successful');
      router.push('/inventory');
    } catch (error: any) {
      console.error('Sign up failed', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setEmailError('This email is already in use.');
          break;
        case 'auth/invalid-email':
          setEmailError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setPasswordError('Password should be at least 6 characters.');
          break;
        default:
          setEmailError('Please double-check your email and password.');
          break;
      }
    }
  };

  const handleTabChange = (event: ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tabValue === 0 ? 'Sign In' : 'Sign Up'}</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={tabValue === 0 ? handleSignIn : handleSignUp}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
        >
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
          />
          <TextField
            label="Password"
            fullWidth
            margin="dense"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
          />
          {tabValue === 1 && (
            <TextField
              label="Confirm Password"
              fullWidth
              margin="dense"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
            />
          )}
          <Button type="submit" fullWidth variant="contained">
            {tabValue === 0 ? 'Sign In' : 'Sign Up'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default SignInSignUpModal;
