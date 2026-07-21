import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import HelpSidebar from '../../components/HelpCenter/HelpSidebar';
import ContactSupportForm from '../../components/HelpCenter/ContactSupportForm';
import GrievanceForm from '../../components/HelpCenter/GrievanceForm';
import FeedbackForm from '../../components/HelpCenter/FeedbackForm';
import ContactInformation from '../../components/HelpCenter/ContactInformation';

const HelpCenterPage = () => {
  const [activeSection, setActiveSection] = useState('contact');
  const { user } = useSelector((state) => state.auth);

  // Motion variants for smooth section transition
  const sectionVariants = {
    hidden: { opacity: 0, x: 15 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -15 }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'contact':
        return <ContactSupportForm defaultUser={user} />;
      case 'grievance':
        return <GrievanceForm defaultUser={user} />;
      case 'feedback':
        return <FeedbackForm defaultUser={user} />;
      case 'info':
        return <ContactInformation />;
      default:
        return <ContactSupportForm defaultUser={user} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Help Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl dark:bg-slate-800">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Help Center</h1>
            <p className="text-sm text-text-secondary mt-1">
              Need help? Select a section to submit a ticket, report a compliance problem, or share your feedback with us.
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <HelpSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={sectionVariants}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default HelpCenterPage;
