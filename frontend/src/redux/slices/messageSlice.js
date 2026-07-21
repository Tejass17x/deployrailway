import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import messageService from '../../modules/messaging/services/messages.service';

const initialState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  chatOpen: false,
  meetingActive: false,
  meetingRoomId: '',
  loading: false,
  sending: false,
  error: null
};

export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageService.getConversations();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createConversation = createAsyncThunk(
  'message/createConversation',
  async (participantId, { rejectWithValue }) => {
    try {
      const response = await messageService.createConversation(participantId);
      return response.data || null;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await messageService.getMessages(conversationId);
      return { conversationId, messages: response.data || [] };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const sendMessageToConversation = createAsyncThunk(
  'message/sendMessageToConversation',
  async ({ conversationId, content, attachments = [] }, { rejectWithValue }) => {
    try {
      const response = await messageService.sendMessage(conversationId, content, attachments);
      return { conversationId, message: response.data || null };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const markConversationRead = createAsyncThunk(
  'message/markConversationRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await messageService.markConversationRead(conversationId);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setActiveConversationId(state, action) {
      state.activeConversationId = action.payload;
    },
    setChatOpen(state, action) {
      state.chatOpen = action.payload;
    },
    toggleMeeting(state, action) {
      state.meetingActive = action.payload;
    },
    setMeetingRoomId(state, action) {
      state.meetingRoomId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        const payload = action.payload;
        state.conversations = Array.isArray(payload)
          ? payload
          : payload?.docs || [];
        state.loading = false;
        if (!state.activeConversationId && state.conversations.length) {
          state.activeConversationId = state.conversations[0]._id || state.conversations[0].id;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load conversations';
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        const conversation = action.payload;
        if (conversation) {
          state.conversations = [conversation, ...state.conversations.filter((item) => (item._id || item.id) !== (conversation._id || conversation.id))];
          state.activeConversationId = conversation._id || conversation.id;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        const normalizedMessages = Array.isArray(messages) ? messages : messages?.docs || [];
        state.messagesByConversation[conversationId] = normalizedMessages;
      })
      .addCase(sendMessageToConversation.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendMessageToConversation.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (message) {
          const currentMessages = state.messagesByConversation[conversationId] || [];
          state.messagesByConversation[conversationId] = [...currentMessages, message];
        }
        state.sending = false;
      })
      .addCase(sendMessageToConversation.rejected, (state) => {
        state.sending = false;
        state.error = 'Failed to send message';
      })
      .addCase(markConversationRead.fulfilled, (state) => {
        state.error = null;
      });
  }
});

export const {
  setActiveConversationId,
  setChatOpen,
  toggleMeeting,
  setMeetingRoomId
} = messageSlice.actions;

export default messageSlice.reducer;
