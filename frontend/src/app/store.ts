import { configureStore } from '@reduxjs/toolkit';
import { useSelector, type TypedUseSelectorHook } from 'react-redux';
import authReducer from '../features/auth/authSlice'; 
import hotelReducer from '../features/hotel/hotelSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer, 
      hotel: hotelReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
