import React, { useEffect } from 'react';
import LandingNavbar from '../components/LandingNavbar';
import Hero from '../components/Hero';
import TrustedBy from '../components/TrustedBy';
import Stats from '../components/Stats';
import Features from '../components/Features';
import AIShowcase from '../components/AIShowcase';
import PublicationShowcase from '../components/PublicationShowcase';
import HowItWorks from '../components/HowItWorks';
import DashboardPreview from '../components/DashboardPreview';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/Faq';
import CTA from '../components/CTA';
import Footer from '../../../layouts/Footer/Footer';

const LandingPage = () => {
  useEffect(() => {
    // SEO: set document title and meta description
    document.title = 'Research Connect — AI-Powered Research Discovery & Collaboration Platform';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content =
      'Research Connect is an enterprise-grade AI-powered platform for researchers. Discover publications, collaborate globally, sync Google Scholar metrics, and get AI-powered researcher recommendations.';

    // Open Graph
    const ogTags = {
      'og:title': 'Research Connect — AI-Powered Research Platform',
      'og:description': 'Discover publications, collaborate with researchers worldwide, and sync Google Scholar metrics with AI.',
      'og:type': 'website',
    };
    Object.entries(ogTags).forEach(([prop, content]) => {
      let tag = document.querySelector(`meta[property="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    return () => {
      document.title = 'Research Connect';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Landing-specific Navbar */}
      <LandingNavbar />

      {/* Sections */}
      <main>
        <Hero />
        <TrustedBy />
        <Stats />
        <Features />
        <AIShowcase />
        <PublicationShowcase />
        <HowItWorks />
        <DashboardPreview />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
