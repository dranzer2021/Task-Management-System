import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import taskReducer from '../features/tasks/taskSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['tasks/downloadAttachment/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.attachments'],
        // Ignore these paths in the state
        ignoredPaths: ['tasks.currentTask.attachments']
      }
    })
});

export type AppDispatch = typeof store.dispatch; 