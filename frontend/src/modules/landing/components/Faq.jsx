import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Is Research Connect free to use?',
    a: 'Research Connect offers a robust free tier that includes profile creation, networking, publication indexing, and basic collaboration tools. We also offer premium plans for labs and universities.'
  },
  {
    q: 'Can I import my Google Scholar profile?',
    a: 'Yes, you can easily sync your Google Scholar, ORCID, and ResearchGate profiles with a single click to import all your past publications and metrics.'
  },
  {
    q: 'How secure are the private workspaces?',
    a: 'All data in workspaces is end-to-end encrypted. We comply with GDPR and leading institutional security standards to ensure your unpublished research remains entirely confidential.'
  }
];

const FAQ = () => {
  const [openId, setOpenId] = useState(0);

  return (
    <section id="faq" className="py-24 bg-slate-50 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-600">Everything you need to know about the platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openId === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <motion.button
                  onClick={() => setOpenId(isOpen ? null : i)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-lg">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
