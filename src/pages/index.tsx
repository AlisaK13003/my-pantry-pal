import * as React from 'react';
import Navbar from '../components/sections/Navbar';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import Contact from '../components/sections/Contact';
import Footer from '../components/sections/Footer';

interface HomeProps {
  appMode: 'light' | 'dark';
  onToggleAppMode: () => void;
}

export default function Home({ appMode, onToggleAppMode }: HomeProps) {
  return (
    <>
      <Navbar mode={appMode} onToggleMode={onToggleAppMode} />
      <main>
        <Hero />
        <Features />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
