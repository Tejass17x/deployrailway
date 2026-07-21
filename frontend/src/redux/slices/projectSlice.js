import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentProject: null,
  activeSection: 'overview', // overview, tasks, milestones, files, chat, announcements, members, settings
  filters: {
    search: '',
    status: '',
    researchDomain: '',
    category: '',
  },
  taskFilters: {
    assignee: 'all',
    priority: 'all',
    search: '',
  },
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    setActiveSection: (state, action) => {
      state.activeSection = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setTaskFilters: (state, action) => {
      state.taskFilters = { ...state.taskFilters, ...action.payload };
    },
    resetTaskFilters: (state) => {
      state.taskFilters = initialState.taskFilters;
    },
    clearProjectState: (state) => {
      return initialState;
    },
  },
});

export const {
  setCurrentProject,
  setActiveSection,
  setFilters,
  resetFilters,
  setTaskFilters,
  resetTaskFilters,
  clearProjectState,
} = projectSlice.actions;

export default projectSlice.reducer;
