import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WarningState {
  isOpen: boolean;
  title: string;
  message: string;
}

interface UiState {
  sidebarOpen: boolean;
  isDarkMode: boolean;
  warning: WarningState;
}

const initialState: UiState = {
  sidebarOpen: true,
  isDarkMode: false,
  warning: {
    isOpen: false,
    title: '',
    message: '',
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
    showWarning(state, action: PayloadAction<{ title?: string; message: string }>) {
      state.warning.isOpen = true;
      state.warning.title = action.payload.title || 'Warning';
      state.warning.message = action.payload.message;
    },
    hideWarning(state) {
      state.warning.isOpen = false;
    }
  },
});

export const { toggleSidebar, setSidebarOpen, toggleDarkMode, showWarning, hideWarning } = uiSlice.actions;
export default uiSlice.reducer;
