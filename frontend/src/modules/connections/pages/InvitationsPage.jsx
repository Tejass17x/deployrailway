import React, { useState } from 'react';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReceivedRequestsPage from './ReceivedRequestsPage';
import SentRequestsPage from './SentRequestsPage';

const InvitationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received'); // received or sent

  return (
    <div className="space-y-6 text-left">
      
      {/* Header and navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/network')}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 text-slate-500"
            title="Back to Network"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-base font-black text-[#0F172A] tracking-tight uppercase">
              Connection Invitations
            </h3>
            <p className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mt-0.5">Manage your connection requests</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start sm:self-center shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#475569] hover:text-[#2563EB]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Received</span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#475569] hover:text-[#2563EB]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sent</span>
          </button>
        </div>
      </div>

      {/* Tab panel */}
      <div className="min-h-[350px]">
        {activeTab === 'received' ? <ReceivedRequestsPage /> : <SentRequestsPage />}
      </div>
    </div>
  );
};

export default InvitationsPage;
