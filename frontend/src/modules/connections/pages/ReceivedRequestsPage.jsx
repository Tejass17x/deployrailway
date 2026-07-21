import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { MailOpen, AlertCircle } from 'lucide-react';
import connectionsService from '../services/connections.service';
import InvitationCard from '../components/InvitationCard';

const ReceivedRequestsPage = () => {
  const currentUser = useSelector((state) => state.auth.user);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['connectionRequests', 'received'],
    queryFn: async () => {
      const res = await connectionsService.getReceivedRequests();
      return res.data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 h-44 animate-pulse space-y-4">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-8 bg-slate-100 rounded-xl w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((request) => (
            <InvitationCard
              key={request._id}
              request={request}
              type="received"
              currentUserId={currentUser?._id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <MailOpen className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h4 className="text-sm font-black text-slate-900 uppercase">No Received Invitations</h4>
          <p className="text-xs text-[#475569] max-w-xs mx-auto font-semibold text-center">
            You don't have any pending connection requests at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReceivedRequestsPage;
