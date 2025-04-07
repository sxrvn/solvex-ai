import { FC, useRef } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Balloons } from '@/components/ui/balloons';

const DeveloperProfile: FC = () => {
  const balloonsRef = useRef<{ launchAnimation: () => void } | null>(null);

  const handleLaunch = () => {
    if (balloonsRef.current) {
      balloonsRef.current.launchAnimation();
    }
  };

  const socialLinks = [
    {
      id: 1,
      icon: Github,
      href: 'https://github.com/sxrvn',
      label: 'GitHub'
    },
    {
      id: 2,
      icon: Linkedin,
      href: 'https://www.linkedin.com/in/shravan-kondekar/',
      label: 'LinkedIn'
    },
    {
      id: 3,
      icon: Mail,
      href: 'mailto:kondekarshravan@gmail.com',
      label: 'Email'
    }
  ];

  const expertise = ['React', 'Node.js', 'Tailwind CSS', 'TypeScript'];

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
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            {/* Card content */}
            <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                {/* Profile Image container */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-64 flex-shrink-0">
                    <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                      <img 
                        src="https://i.ibb.co/Mx8ftqgV/4.jpg" 
                        alt="Shravan Kondekar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleLaunch}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Launch Balloons! 🎈
                  </Button>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">Shravan Kondekar</h2>
                  <p className="text-lg text-gray-600 mt-1">Full Stack Developer</p>
                  
                  <p className="text-gray-600 mt-4">
                  Focused on developing AI-driven solutions with security and usability at the core. Leading the development of Solvix with a focus on delivering a seamless, student-friendly experience powered by cutting-edge AI.                  </p>

                  {/* Expertise Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {expertise.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
                    <p className="text-gray-600">Building Scalable Web & Mobile Solutions :)</p>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex justify-center md:justify-start gap-6 mt-6">
                    {socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label={link.label}
                      >
                        <link.icon className="w-6 h-6" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Balloons ref={balloonsRef} type="default" />
    </section>
  );
};

export default DeveloperProfile; 