import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import MessagesView from '../../message/components/MessagesView';
import { setChatOpen } from '../../../redux/slices/messageSlice';

const Messages = () => {
  const { profile } = useOutletContext();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setChatOpen(true));
  }, [dispatch]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm relative min-h-[400px]">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-2">
          Chat with {profile?.displayName || 'Researcher'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          The chat panel has been opened on the right. You can select threads or start a direct message with this researcher.
        </p>
      </div>
      <MessagesView />
    </div>
  );
};

export default Messages;
