import * as React from 'react';
import Navbar from '../components/sections/Navbar';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import Contact from '../components/sections/Contact';
import Footer from '../components/sections/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
