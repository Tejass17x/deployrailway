import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const AccordionItem = ({ title, children, isOpen, onClick }) => {
  return (
    <div className="border border-border rounded-lg mb-3 overflow-hidden bg-bg-card">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 text-left font-medium text-text-primary hover:bg-slate-50 transition-colors focus:outline-none"
      >
        <span>{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-4 border-t border-border text-sm text-text-secondary leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Accordion = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          title={item.title}
          isOpen={openIndex === idx}
          onClick={() => handleToggle(idx)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;
