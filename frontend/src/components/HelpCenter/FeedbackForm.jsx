import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Star, Send } from 'lucide-react';
import Input from '../common/inputs/Input';
import Select from '../common/inputs/Select';
import Button from '../common/buttons/Button';
import Card from '../common/cards/Card';
import helpService from '../../services/help.service';

const FeedbackForm = ({ defaultUser }) => {
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName}` : '',
      email: defaultUser ? defaultUser.email : '',
      rating: 5,
      category: '',
      comment: ''
    }
  });

  const categories = [
    { value: 'UI / UX', label: 'UI / UX' },
    { value: 'Search', label: 'Search' },
    { value: 'Upload', label: 'Upload' },
    { value: 'Download', label: 'Download' },
    { value: 'Performance', label: 'Performance' },
    { value: 'Feature Request', label: 'Feature Request' },
    { value: 'General', label: 'General' }
  ];

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await helpService.submitFeedback(data);
      if (response.success) {
        toast.success(response.message || 'Feedback submitted successfully!');
        reset({
          name: defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName}` : '',
          email: defaultUser ? defaultUser.email : '',
          rating: 5,
          category: '',
          comment: ''
        });
      }
    } catch (error) {
      const errMsg = error.message || 'Failed to submit feedback. Please try again.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <h3 className="text-lg font-bold text-text-primary tracking-tight mb-2">Share Feedback</h3>
      <p className="text-sm text-text-secondary mb-6">
        Let us know how we can make Research Connect better for you.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name (Optional)"
            name="name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email Address (Optional)"
            name="email"
            type="email"
            placeholder="john.doe@institution.edu"
            error={errors.email?.message}
            {...register('email', {
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: 'Please enter a valid email address'
              }
            })}
          />
        </div>

        <div className="flex flex-col w-full space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
            Rating
            <span className="text-accent-red font-bold">*</span>
          </label>
          <Controller
            name="rating"
            control={control}
            rules={{ required: 'Rating is required' }}
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || value)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-border fill-transparent'
                      } transition-all`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm font-semibold text-text-secondary">
                  {hoverRating || value} Star{ (hoverRating || value) !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          />
          {errors.rating && (
            <span className="text-xs font-medium text-accent-red">
              {errors.rating.message}
            </span>
          )}
        </div>

        <Select
          label="Feedback Category"
          name="category"
          placeholder="Select feedback category"
          required
          options={categories}
          error={errors.category?.message}
          {...register('category', { required: 'Please select a category' })}
        />

        <div className="flex flex-col w-full space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
            Comment
            <span className="text-accent-red font-bold">*</span>
          </label>
          <textarea
            name="comment"
            rows="5"
            placeholder="Share your thoughts, suggestions, or ideas..."
            className={`w-full px-4 py-2 text-sm bg-bg-card border ${
              errors.comment ? 'border-accent-red focus:ring-accent-red' : 'border-border focus:ring-primary'
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-colors`}
            {...register('comment', {
              required: 'Comment is required',
              minLength: { value: 3, message: 'Comment must be at least 3 characters' },
              maxLength: { value: 2000, message: 'Comment cannot exceed 2000 characters' }
            })}
          />
          {errors.comment && (
            <span className="text-xs font-medium text-accent-red">
              {errors.comment.message}
            </span>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={<Send className="w-4 h-4" />}
            className="w-full md:w-auto"
          >
            Submit Feedback
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default FeedbackForm;
