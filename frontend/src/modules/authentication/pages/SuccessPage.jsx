import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../../../components/common/buttons/Button';

const SuccessPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Auto redirect to research identity setup if verified and authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        navigate('/research-identity', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card w-full rounded-2xl p-8 shadow-xl border border-border bg-white bg-opacity-70 backdrop-blur-md text-center"
    >
      <div className="flex flex-col items-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="text-accent-green mb-4"
        >
          <CheckCircle2 className="w-20 h-20" />
        </motion.div>
        
        {isAuthenticated ? (
          <>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Account Verified!</h2>
            <p className="text-sm text-text-secondary mt-2">
              Your email has been successfully verified. Welcome to Research Connect!
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Redirecting to research identity setup...
              </div>
              <Link to="/research-identity" className="text-xs font-bold text-primary hover:underline mt-2">
                Click here if you are not redirected
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Password Reset Successful!</h2>
            <p className="text-sm text-text-secondary mt-2">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <div className="mt-8 w-full">
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Login
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SuccessPage;
