import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import Button from '../common/buttons/Button';

const ComingSoon = ({ title = 'Feature Coming Soon' }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-bg-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center bg-bg-card border border-border p-8 rounded-2xl shadow-sm"
      >
        <div className="w-16 h-16 bg-light-blue text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          We are currently working hard to deliver this module. The architecture and schemas have been successfully created. Stay tuned for details in the next phase!
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
