import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Send, Upload } from 'lucide-react';
import Input from '../common/inputs/Input';
import Select from '../common/inputs/Select';
import Button from '../common/buttons/Button';
import Card from '../common/cards/Card';
import helpService from '../../services/help.service';

const ContactSupportForm = ({ defaultUser }) => {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName}` : '',
      email: defaultUser ? defaultUser.email : '',
      category: '',
      subject: '',
      message: '',
      attachment: ''
    }
  });

  const categories = [
    { value: 'General Inquiry', label: 'General Inquiry' },
    { value: 'Technical Support', label: 'Technical Support' },
    { value: 'Account Issue', label: 'Account Issue' },
    { value: 'Upload Issue', label: 'Upload Issue' },
    { value: 'Download Issue', label: 'Download Issue' },
    { value: 'Other', label: 'Other' }
  ];

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await helpService.submitContactRequest(data);
      if (response.success) {
        toast.success(response.message || 'Support ticket submitted successfully!');
        reset({
          name: defaultUser ? `${defaultUser.firstName} ${defaultUser.lastName}` : '',
          email: defaultUser ? defaultUser.email : '',
          category: '',
          subject: '',
          message: '',
          attachment: ''
        });
      }
    } catch (error) {
      const errMsg = error.message || 'Failed to submit support ticket. Please try again.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <h3 className="text-lg font-bold text-text-primary tracking-tight mb-2">Contact Support</h3>
      <p className="text-sm text-text-secondary mb-6">
        Fill out the form below and our support team will get back to you shortly.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="John Doe"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="john.doe@institution.edu"
            required
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: 'Please enter a valid email address'
              }
            })}
          />
        </div>

        <Select
          label="Category"
          name="category"
          placeholder="Select support category"
          required
          options={categories}
          error={errors.category?.message}
          {...register('category', { required: 'Please select a category' })}
        />

        <Input
          label="Subject"
          name="subject"
          placeholder="Brief summary of the issue"
          required
          error={errors.subject?.message}
          {...register('subject', {
            required: 'Subject is required',
            minLength: { value: 3, message: 'Subject must be at least 3 characters' },
            maxLength: { value: 200, message: 'Subject cannot exceed 200 characters' }
          })}
        />

        <div className="flex flex-col w-full space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
            Message
            <span className="text-accent-red font-bold">*</span>
          </label>
          <textarea
            name="message"
            rows="6"
            placeholder="Describe your issue in detail..."
            className={`w-full px-4 py-2 text-sm bg-bg-card border ${
              errors.message ? 'border-accent-red focus:ring-accent-red' : 'border-border focus:ring-primary'
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-colors`}
            {...register('message', {
              required: 'Message is required',
              minLength: { value: 10, message: 'Message must be at least 10 characters' },
              maxLength: { value: 5000, message: 'Message cannot exceed 5000 characters' }
            })}
          />
          {errors.message && (
            <span className="text-xs font-medium text-accent-red">
              {errors.message.message}
            </span>
          )}
        </div>

        <Input
          label="Attachment URL (Optional)"
          name="attachment"
          placeholder="https://example.com/screenshot.png"
          error={errors.attachment?.message}
          {...register('attachment')}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={<Send className="w-4 h-4" />}
            className="w-full md:w-auto"
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ContactSupportForm;
