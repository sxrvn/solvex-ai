import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Solvix'd", "clear", "instant", "effortless", "smarter"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const handleTryNow = () => {
    // Smooth scroll to the form section
    const formSection = document.querySelector('.doubt-solver-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHowItWorks = () => {
    // Smooth scroll to the how it works section
    const howItWorksSection = document.querySelector('.how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(209 213 219 / 0.3) 3px, transparent 0)`,
          backgroundSize: 'clamp(16px, 2vw, 24px) clamp(16px, 2vw, 24px)',
          opacity: '1',
          pointerEvents: 'none'
        }}
      />
      
      <div className="container mx-auto relative z-10 px-4 sm:px-6">
        <div className="flex gap-6 sm:gap-8 py-12 sm:py-20 lg:py-32 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-2 sm:gap-4 text-xs sm:text-sm whitespace-nowrap">
              Built by a student, for students <MoveRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <div className="flex gap-3 sm:gap-4 flex-col">
            <h1 className="text-3xl sm:text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">Solving doubts just got</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center px-4">
              Studying can be overwhelming. Solvix makes it easier by giving you instant, accurate answers—anytime you're stuck. Say goodbye to endless searching & hello to smarter learning.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4">
            <Button 
              size="lg" 
              className="gap-4 w-full sm:w-auto" 
              variant="outline"
              onClick={handleHowItWorks}
            >
              See how it works <Play className="w-4 h-4" />
            </Button>
            <Button 
              size="lg" 
              className="gap-4 w-full sm:w-auto"
              onClick={handleTryNow}
            >
              Try Solvex now <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero }; 