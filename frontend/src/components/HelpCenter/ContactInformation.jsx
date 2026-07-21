import React, { useState, useEffect } from 'react';
import { Mail, Clock, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from '../common/cards/Card';
import helpService from '../../services/help.service';
import Skeleton from '../common/loaders/Skeleton';

const ContactInformation = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await helpService.getContactInfo();
        if (response.success) {
          setContactInfo(response.data);
        }
      } catch (err) {
        setError('Failed to load contact information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-accent-red bg-red-50 bg-opacity-10">
        <AlertTriangle className="w-8 h-8 text-accent-red mb-3 animate-pulse" />
        <span className="text-sm font-semibold text-text-primary mb-1">Error Loading Support Details</span>
        <span className="text-xs text-text-secondary">{error}</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Important Notice Banner */}
      {contactInfo.importantNotice && (
        <Card className="border-amber-500 bg-amber-50 bg-opacity-5 p-5">
          <div className="flex gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-600 tracking-tight">Important Notice</h4>
              <p className="text-xs text-text-secondary mt-1 font-medium leading-relaxed">
                {contactInfo.importantNotice}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Support Emails */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">General Support</span>
              <a
                href={`mailto:${contactInfo.generalSupportEmail}`}
                className="text-sm font-bold text-primary hover:underline mt-0.5 break-all"
              >
                {contactInfo.generalSupportEmail}
              </a>
            </div>
          </div>
          <span className="text-xs text-text-secondary">For general inquiries, account assistance, or billing issues.</span>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-slate-800">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Technical Support</span>
              <a
                href={`mailto:${contactInfo.technicalSupportEmail}`}
                className="text-sm font-bold text-primary hover:underline mt-0.5 break-all"
              >
                {contactInfo.technicalSupportEmail}
              </a>
            </div>
          </div>
          <span className="text-xs text-text-secondary">For bugs, publication upload/download errors, or site speed issues.</span>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 text-accent-red dark:bg-slate-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Copyright & DMCA</span>
              <a
                href={`mailto:${contactInfo.copyrightEmail}`}
                className="text-sm font-bold text-accent-red hover:underline mt-0.5 break-all"
              >
                {contactInfo.copyrightEmail}
              </a>
            </div>
          </div>
          <span className="text-xs text-text-secondary">For plagiarism complaints, DMCA requests, and copyright disputes.</span>
        </Card>
      </div>

      {/* Support Hours & Response Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex items-start gap-4 p-5">
          <div className="p-2.5 rounded-xl bg-green-50 text-green-600 dark:bg-slate-800 mt-1">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary tracking-tight">Support Hours</h4>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              {contactInfo.workingHours}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Emails received outside support hours will be queued and reviewed on the next business day.
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-4 p-5">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-slate-800 mt-1">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary tracking-tight">Expected Response Time</h4>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              {contactInfo.expectedResponseTime}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              We review and prioritize all support tickets based on severity. Critical system bugs are addressed urgently.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactInformation;
