import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import HomeFeed from '../modules/home/pages/HomeFeed';
import MessagesView from '../modules/message/components/MessagesView';
import { setChatOpen } from '../redux/slices/messageSlice';

const MessagesRoute = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setChatOpen(true));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary">
      <HomeFeed />
      <MessagesView />
    </div>
  );
};

export default MessagesRoute;
