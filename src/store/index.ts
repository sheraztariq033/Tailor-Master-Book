import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import customerReducer from './slices/customerSlice';
import measurementReducer from './slices/measurementSlice';
import orderReducer from './slices/orderSlice';
import invoiceReducer from './slices/invoiceSlice';
import dataReducer from './slices/dataSlice'; // Import dataReducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customer: customerReducer,
    measurement: measurementReducer,
    order: orderReducer,
    invoice: invoiceReducer,
    data: dataReducer, // Add dataReducer
    // Add other reducers here as your app grows
  },
  // Optional: Add middleware, e.g., for logging in development
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Optional: Export hooks for typed useSelector and useDispatch
import { TypedUseSelectorHook, useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';
export const useAppDispatch = () => useReduxDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
