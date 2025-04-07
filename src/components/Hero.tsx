import React from 'react';
import { Button } from '@/components/ui/button';

const Hero: React.FC = () => {
  const handleGetStarted = () => {
    // Smooth scroll to the form section
    const formSection = document.querySelector('.doubt-solver-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLearnMore = () => {
    // Smooth scroll to the how it works section
    const howItWorksSection = document.querySelector('.how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4 sm:px-6 lg:px-8">
      {/* Background dots pattern - responsive density */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: 'clamp(16px, 2vw, 32px) clamp(16px, 2vw, 32px)'
        }}
      ></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[85rem] mx-auto text-center">
        {/* Gradient text - responsive sizing */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 animate-gradient leading-tight">
          Your Knowledge Hub
        </h1>

        {/* Subtitle - responsive sizing and width */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto px-4 leading-relaxed">
          Transform your learning experience with our intelligent doubt-solving platform
        </p>

        {/* CTA Buttons - responsive layout and sizing */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 rounded-lg bg-black text-white hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 text-base sm:text-lg h-auto"
          >
            Get Started
          </Button>
          <Button
            onClick={handleLearnMore}
            variant="outline"
            className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 transform hover:scale-105 text-base sm:text-lg h-auto"
          >
            Learn More →
          </Button>
        </div>

        {/* Feature tags - responsive layout and sizing */}
        <div className="mt-8 sm:mt-12 flex flex-wrap justify-center gap-2 sm:gap-3 px-4">
          {['AI-Powered', 'Real-time', 'Collaborative', 'Personalized'].map((tag) => (
            <span
              key={tag}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gray-100 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 transition-colors duration-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom wave decoration - responsive */}
      <div className="absolute bottom-0 w-full overflow-hidden">
        <svg
          className="w-full h-auto"
          viewBox="0 0 1440 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M1440 74V21.4627C1440 21.4627 1082.5 74 720 74C357.5 74 0 21.4627 0 21.4627V74H1440Z"
            fill="#f8fafc"
          />
        </svg>
      </div>
    </div>
  );
};

export default Hero; 