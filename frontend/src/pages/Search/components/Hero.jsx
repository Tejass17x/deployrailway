import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search } from 'lucide-react';
import { fadeUp, fadeIn } from './animations';

const PHRASES = [
  "MILLIONS OF PUBLICATIONS",
  "TOP GLOBAL RESEARCHERS",
  "INNOVATIVE PROJECTS",
  "YOUR NEXT COLLABORATION",
  "GROUNDBREAKING RESEARCH"
];

const Hero = ({ children }) => {
  const reduce = useReducedMotion();
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reduce) {
      setText(PHRASES[0]);
      return;
    }

    const currentPhrase = PHRASES[phraseIndex];
    let timeout;

    if (isDeleting) {
      timeout = setTimeout(() => {
        setText(currentPhrase.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        }
      }, 40); // Deleting speed
    } else {
      timeout = setTimeout(() => {
        setText(currentPhrase.substring(0, text.length + 1));
        if (text.length === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 2500); // Pause before deleting
        }
      }, 70); // Typing speed
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, reduce]);

  return (
    <div className="pt-4 pb-0 max-w-[1400px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-2 sm:gap-3 xl:gap-4">
        <motion.div
          variants={fadeIn(reduce, 0.1)}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-slate-900"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="bg-blue-600 p-2 sm:p-3 xl:p-4 rounded-lg sm:rounded-2xl text-white shadow-lg shadow-blue-600/20">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 xl:w-8 xl:h-8" />
              </div>
            </motion.div>

            <h1 className="text-[22px] leading-none sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-slate-900 tracking-tight flex-1">
              DISCOVER
            </h1>
          </div>
        </motion.div>

        <motion.div
          variants={fadeIn(reduce, 0.2)}
          initial="hidden"
          animate="show"
          className="h-6 sm:h-9 md:h-10 lg:h-9 xl:h-10 2xl:h-[48px] flex items-center"
        >
          <h2 className="text-[16px] sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-tight text-blue-600 uppercase relative whitespace-nowrap" aria-live="polite">
            {text}
            <span
              className="absolute -right-2 sm:-right-3 top-0.5 sm:top-1.5 bottom-0.5 sm:bottom-1.5 w-[2px] sm:w-[3px] xl:w-[4px] bg-blue-600 rounded-full"
              style={{ animation: 'gs-blink 1s step-start infinite' }}
              aria-hidden="true"
            />
          </h2>
        </motion.div>
      </div>

      <div className="mt-4 sm:mt-6">{children}</div>
    </div>
  );
};

export default Hero;
