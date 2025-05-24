import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import * as customerService from '../../services/customerService';
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// Define Customer interface
export interface Customer {
  id: string; // Document ID
  tailorId: string; // UID of the tailor/user who owns this customer
  name: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  createdAt: string | { _seconds: number, _nanoseconds: number }; // Firestore timestamp
  updatedAt: string | { _seconds: number, _nanoseconds: number };
  // Add any other fields like lastVisit, lifetimeValue if they are part of your Firestore structure
}

export interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null | unknown;
}

const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchCustomers = createAsyncThunk(
  'customer/fetchCustomers',
  async (filters?: customerService.ListCustomersFilters, {rejectWithValue}) => {
    try {
      const result = await customerService.callListCustomers(filters) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return (result.data as any).customers as Customer[];
      }
      throw new Error((result.data as any).message || 'Failed to fetch customers.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching customers');
    }
  }
);

export const fetchCustomerDetails = createAsyncThunk(
  'customer/fetchCustomerDetails',
  async (customerId: string, {rejectWithValue}) => {
    try {
      const result = await customerService.callGetCustomer(customerId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // The Cloud Function returns the customer object with its ID already part of the object.
        // If not, you might need to combine customerId with result.data.customer if it's nested.
        // Assuming the cloud function nests it under 'customer' key and includes 'id' in that object.
        const customerData = (result.data as any).customer;
        if (!customerData.id && customerId) { // Ensure id is present
            customerData.id = customerId;
        }
        return customerData as Customer;
      }
      throw new Error((result.data as any).message || 'Failed to fetch customer details.');
    } catch (error: any)      {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching customer details');
    }
  }
);

export const addNewCustomer = createAsyncThunk(
  'customer/addNewCustomer',
  async (customerData: customerService.CreateCustomerPayload, {dispatch, rejectWithValue}) => {
    try {
      const result = await customerService.callCreateCustomer(customerData) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // After adding, you might want to refresh the list or add the new customer to the state directly.
        // Refreshing the list is simpler for now.
        dispatch(fetchCustomers()); // Refresh customer list
        return (result.data as any).customerId as string; // Return new customerId
      }
      throw new Error((result.data as any).message || 'Failed to add customer.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error adding customer');
    }
  }
);

export const updateExistingCustomer = createAsyncThunk(
  'customer/updateExistingCustomer',
  async ({customerId, dataToUpdate}: {customerId: string, dataToUpdate: customerService.UpdateCustomerPayload }, {dispatch, rejectWithValue}) => {
    try {
      const result = await customerService.callUpdateCustomer(customerId, dataToUpdate) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchCustomers()); // Or update specific customer in state
        // Optionally, if you need to update selectedCustomer:
        // dispatch(fetchCustomerDetails(customerId));
        return { customerId, ...dataToUpdate }; // Return updated data for potential direct state update
      }
      throw new Error((result.data as any).message || 'Failed to update customer.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating customer');
    }
  }
);

export const removeCustomer = createAsyncThunk(
  'customer/removeCustomer',
  async (customerId: string, {dispatch, rejectWithValue}) => {
    try {
      const result = await customerService.callDeleteCustomer(customerId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // After deleting, refresh the list or remove the customer from the state directly.
        dispatch(fetchCustomers()); // Easiest way to update list
        return customerId; // Return deleted customerId for direct state update if needed
      }
      throw new Error((result.data as any).message || 'Failed to delete customer.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error deleting customer');
    }
  }
);

// Slice
const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    }
  },
  extraReducers: (builder) => {
    // fetchCustomers
    builder.addCase(fetchCustomers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<Customer[]>) => {
      state.isLoading = false;
      state.customers = action.payload;
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // fetchCustomerDetails
    builder.addCase(fetchCustomerDetails.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomerDetails.fulfilled, (state, action: PayloadAction<Customer>) => {
      state.isLoading = false;
      state.selectedCustomer = action.payload;
    });
    builder.addCase(fetchCustomerDetails.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.selectedCustomer = null;
    });

    // addNewCustomer
    builder.addCase(addNewCustomer.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addNewCustomer.fulfilled, (state, action) => { // Payload is customerId string
      state.isLoading = false;
      // Customer list is refetched by the thunk, no direct state update here unless desired
    });
    builder.addCase(addNewCustomer.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // updateExistingCustomer
    builder.addCase(updateExistingCustomer.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateExistingCustomer.fulfilled, (state, action) => { // Payload is { customerId, ...dataToUpdate }
      state.isLoading = false;
      // Customer list is refetched by the thunk.
      // If selectedCustomer was updated, it will also be refetched or can be updated here.
      if (state.selectedCustomer && state.selectedCustomer.id === action.payload.customerId) {
        // state.selectedCustomer = { ...state.selectedCustomer, ...action.payload }; // This might not have all fields
        // Better to set selectedCustomer to null and let UI refetch or rely on list update
        state.selectedCustomer = null; 
      }
    });
    builder.addCase(updateExistingCustomer.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // removeCustomer
    builder.addCase(removeCustomer.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeCustomer.fulfilled, (state, action: PayloadAction<string>) => { // Payload is customerId
      state.isLoading = false;
      // Customer list is refetched by the thunk.
      if (state.selectedCustomer && state.selectedCustomer.id === action.payload) {
        state.selectedCustomer = null; // Clear selected if it was the one deleted
      }
    });
    builder.addCase(removeCustomer.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const { clearCustomerError, clearSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
