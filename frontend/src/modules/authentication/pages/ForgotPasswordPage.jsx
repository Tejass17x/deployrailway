import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Share2, Mail, ArrowLeft, Send } from 'lucide-react';
import authService from '../../../services/auth.service';
import { setOtpEmail } from '../../../redux/slices/authSlice';
import Input from '../../../components/common/inputs/Input';
import Button from '../../../components/common/buttons/Button';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      if (response.success) {
        if (response.data?.emailExists) {
          toast.success('Password reset OTP sent to your email.');
          dispatch(setOtpEmail(data.email));
          navigate('/reset-password');
        } else {
          toast.error('This email is not registered with us.');
        }
      }
    } catch (error) {
      console.error('Forgot password request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card w-full rounded-2xl p-8 shadow-xl border border-border bg-white bg-opacity-70 backdrop-blur-md"
    >
      <div className="flex flex-col items-center mb-6 text-center">
        <Link to="/" className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-lg bg-gradient-primary text-white flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </span>
          <span className="font-bold text-xl tracking-tight text-text-primary">
            Research<span className="text-primary">Connect</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Forgot Password?</h2>
        <p className="text-sm text-text-secondary mt-1">
          Enter your email address and we'll send you an OTP code to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@institution.edu"
          error={errors.email?.message}
          required
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
              message: 'Invalid email address'
            }
          })}
          icon={<Mail className="w-4 h-4 text-text-secondary" />}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 font-semibold text-sm shadow-md"
          loading={loading}
          icon={<Send className="w-4 h-4" />}
        >
          Send Reset OTP
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border flex items-center justify-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;