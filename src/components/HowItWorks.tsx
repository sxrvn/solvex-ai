import { FC } from 'react';

const HowItWorks: FC = () => {
  const steps = [
    {
      id: 1,
      title: 'Upload Your Homework',
      description: 'Enter your question or upload a picture of your assignment for Solvex AI Helper to analyze.',
      image: '/1.png'
    },
    {
      id: 2,
      title: 'Click Generate',
      description: 'Click the Generate button and wait for Solvex AI to process your request and prepare the solution.',
      image: '/2.png'
    },
    {
      id: 3,
      title: 'Receive Help and Explanation',
      description: 'Solvex AI will solve your doubts and provide a detailed explanation to help you understand the solution.',
      image: '/3.png'
    }
  ];

  return (
    <section className="w-full py-20 relative bg-[#F9FAFB]">
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(209 213 219 / 0.3) 3px, transparent 0)`,
          backgroundSize: 'clamp(16px, 2vw, 24px) clamp(16px, 2vw, 24px)',
          opacity: '1',
          pointerEvents: 'none'
        }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">Follow these 3 simple steps to get accurate homework solutions with Solvex AI Helper.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step) => (
            <div key={step.id} className="relative pt-16 group">
              {/* Image container positioned above the card */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 z-10 transition-transform group-hover:-translate-y-2">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Card content */}
              <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <div className="absolute -top-4 left-8 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold">
                  {step.id}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-8">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;