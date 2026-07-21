import React from 'react';
import { Mail, ShieldAlert, Heart, Info } from 'lucide-react';

const HelpSidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    {
      id: 'contact',
      label: 'Contact Support',
      icon: Mail,
      description: 'Submit a technical or account support ticket'
    },
    {
      id: 'grievance',
      label: 'Report a Problem / Grievance',
      icon: ShieldAlert,
      description: 'Submit Plagiarism, DMCA, or DMCA complaints'
    },
    {
      id: 'feedback',
      label: 'Share Feedback',
      icon: Heart,
      description: 'Help us improve Research Connect'
    },
    {
      id: 'info',
      label: 'Contact Information',
      icon: Info,
      description: 'Support emails, working hours, and response time'
    }
  ];

  return (
    <aside className="w-full md:w-80 bg-bg-card rounded-2xl border border-border p-3 md:p-4 shadow-sm h-fit">
      <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 md:gap-0 md:space-y-1 no-scrollbar scroll-smooth">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex-shrink-0 flex items-center md:items-start gap-2 md:gap-4 p-3 md:p-3.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-bg-page text-text-primary bg-bg-page/50 md:bg-transparent border border-border/50 md:border-transparent'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-text-secondary'}`} />
              <div className="text-left">
                <span className="block text-xs md:text-sm font-semibold tracking-tight whitespace-nowrap">{item.label}</span>
                <span
                  className={`hidden md:block text-xs mt-0.5 ${
                    isActive ? 'text-white/80' : 'text-text-secondary'
                  }`}
                >
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default HelpSidebar;
