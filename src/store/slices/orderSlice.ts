import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import * as orderService from '../../services/orderService';
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';
import { FirebaseAuthTypes } from '@react-native-firebase/auth'; // For user UID
import auth from '@react-native-firebase/auth'; // To get current user

// Define Order interface
export interface Order {
  id: string; // Document ID
  customerId: string;
  tailorId: string;
  outfitType: string;
  measurementId: string;
  orderDate: string | { _seconds: number, _nanoseconds: number }; // Firestore timestamp or ISO string
  deadlineDate: string | { _seconds: number, _nanoseconds: number };
  status: string; // e.g., 'received', 'designing', 'stitching', 'trial', 'ready', 'picked_up', 'cancelled'
  features: Record<string, string | boolean | number>;
  images?: string[]; // Array of gs:// paths or HTTPS URLs
  notes?: string | null;
  totalAmount: number;
  paidAmount: number;
  createdAt: string | { _seconds: number, _nanoseconds: number };
  updatedAt?: string | { _seconds: number, _nanoseconds: number };
}

export interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  error: string | null | unknown;
  isUploadingImages: boolean;

  // For Shareable Order Status
  shareableOrderToken: string | null;
  publicOrderStatus: PublicOrderDetails | null; 
  isLoadingShareToken: boolean;
  isLoadingPublicOrder: boolean;
  shareError: string | null | unknown; // Error for token generation
  publicOrderError: string | null | unknown; // Error for fetching public order
}

// Define PublicOrderDetails based on CF output for getPublicOrderStatusByToken
export interface PublicOrderDetails {
  orderId: string;
  outfitType: string;
  status: string;
  deadlineDate: string; // ISO string
  orderDate: string;    // ISO string
  features?: Record<string, any>; // Be specific if possible, e.g., { fabric?: string }
  images?: string[];
  tailorBusinessName?: string;
  customerFirstName?: string;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,
  isUploadingImages: false,
  shareableOrderToken: null,
  publicOrderStatus: null,
  isLoadingShareToken: false,
  isLoadingPublicOrder: false,
  shareError: null,
  publicOrderError: null,
};

// Helper to get current user UID
const getCurrentUserId = (): string | null => {
    return auth().currentUser?.uid || null;
}

// Async Thunks
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (filters?: orderService.ListOrdersFilters, {rejectWithValue}) => {
    try {
      const result = await orderService.callListOrders(filters) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return (result.data as any).orders as Order[];
      }
      throw new Error((result.data as any).message || 'Failed to fetch orders.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching orders');
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  'order/fetchOrderDetails',
  async (orderId: string, {rejectWithValue}) => {
    try {
      const result = await orderService.callGetOrder(orderId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        const orderData = (result.data as any).order;
        if (!orderData.id && orderId) orderData.id = orderId; // Ensure id is present
        return orderData as Order;
      }
      throw new Error((result.data as any).message || 'Failed to fetch order details.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching order details');
    }
  }
);

// Thunk for adding a new order, including image uploads
export const addNewOrder = createAsyncThunk(
  'order/addNewOrder',
  async (payload: { orderData: orderService.CreateOrderPayload, localImageUris?: {uri: string, name: string}[] }, {dispatch, rejectWithValue, getState}) => {
    const { orderData, localImageUris } = payload;
    const userId = getCurrentUserId();
    if (!userId) return rejectWithValue('User not authenticated for image upload/order creation.');

    try {
      dispatch(orderSlice.actions.setImageUploading(true));
      let uploadedImagePaths: string[] = [];

      if (localImageUris && localImageUris.length > 0) {
        // Using a temporary orderId for storage path if real orderId isn't known yet.
        // Or, create order first, get ID, then upload images.
        // For simplicity here, let's assume a temporary ID or that orderId can be generated client-side for path.
        // A more robust approach might be a multi-step process or a dedicated Cloud Function.
        // Using a simple timestamp for "tempOrderId" for storage path for now.
        const tempOrderIdForStorage = `temp_${Date.now()}`;
        
        uploadedImagePaths = await Promise.all(
          localImageUris.map(img => 
            orderService.uploadOrderImage(userId, tempOrderIdForStorage, img.uri, img.name)
          )
        );
      }
      dispatch(orderSlice.actions.setImageUploading(false));

      const finalOrderData = { ...orderData, images: [...(orderData.images || []), ...uploadedImagePaths] };
      
      const result = await orderService.callCreateOrder(finalOrderData) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchOrders()); // Refresh order list
        return (result.data as any).orderId as string; // Return new orderId
      }
      throw new Error((result.data as any).message || 'Failed to add order.');
    } catch (error: any) {
      dispatch(orderSlice.actions.setImageUploading(false));
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error adding order');
    }
  }
);

export const updateExistingOrder = createAsyncThunk(
  'order/updateExistingOrder',
  async (payload: { orderId: string, dataToUpdate: orderService.UpdateOrderPayload, newLocalImageUris?: {uri: string, name: string}[] }, {dispatch, rejectWithValue}) => {
    const { orderId, dataToUpdate, newLocalImageUris } = payload;
    const userId = getCurrentUserId();
    if (!userId) return rejectWithValue('User not authenticated for image upload/order update.');

    try {
        dispatch(orderSlice.actions.setImageUploading(true));
        let newUploadedImagePaths: string[] = [];

        if (newLocalImageUris && newLocalImageUris.length > 0) {
            newUploadedImagePaths = await Promise.all(
                newLocalImageUris.map(img => 
                    orderService.uploadOrderImage(userId, orderId, img.uri, img.name)
                )
            );
        }
        dispatch(orderSlice.actions.setImageUploading(false));
        
        // Combine existing images (if any in dataToUpdate.images) with newly uploaded ones
        const finalImages = [...(dataToUpdate.images || []), ...newUploadedImagePaths];
        const finalDataToUpdate = { ...dataToUpdate, images: finalImages };

        const result = await orderService.callUpdateOrder(orderId, finalDataToUpdate) as FirebaseFunctionsTypes.HttpsCallableResult;
        if (result.data && (result.data as any).success) {
            dispatch(fetchOrders()); // Refresh list
            dispatch(fetchOrderDetails(orderId)); // Refresh selected order if it's the one being viewed
            return { orderId, ...finalDataToUpdate };
        }
        throw new Error((result.data as any).message || 'Failed to update order.');
    } catch (error: any) {
        dispatch(orderSlice.actions.setImageUploading(false));
        return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating order');
    }
  }
);

export const removeOrder = createAsyncThunk(
  'order/removeOrder',
  async (orderId: string, {dispatch, rejectWithValue}) => {
    try {
      const result = await orderService.callDeleteOrder(orderId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchOrders()); // Refresh list
        return orderId;
      }
      throw new Error((result.data as any).message || 'Failed to delete order.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error deleting order');
    }
  }
);

export const changeOrderStatus = createAsyncThunk(
  'order/changeOrderStatus',
  async (payload: { orderId: string, newStatus: string }, {dispatch, rejectWithValue}) => {
    const {orderId, newStatus} = payload;
    try {
      const result = await orderService.callUpdateOrderStatus(orderId, newStatus) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // dispatch(fetchOrders()); // Refresh list is one option
        // Or update the status locally for faster UI update, then fetch details
        dispatch(fetchOrderDetails(orderId)); // Fetch details to get the updated order
        return { orderId, newStatus };
      }
      throw new Error((result.data as any).message || 'Failed to update order status.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating order status');
    }
  }
);


// Slice
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    setImageUploading: (state, action: PayloadAction<boolean>) => {
        state.isUploadingImages = action.payload;
    },
    clearAllOrders: (state) => { 
        state.orders = [];
        state.selectedOrder = null;
        state.isLoading = false;
        state.isUploadingImages = false;
        state.error = null;
        // Also clear shareable token states on logout/full clear
        state.shareableOrderToken = null;
        state.publicOrderStatus = null;
        state.isLoadingShareToken = false;
        state.isLoadingPublicOrder = false;
        state.shareError = null;
        state.publicOrderError = null;
    },
    // Specific clear actions for shareable feature
    clearShareableToken: (state) => {
        state.shareableOrderToken = null;
        state.isLoadingShareToken = false;
        state.shareError = null;
    },
    clearPublicOrderStatus: (state) => {
        state.publicOrderStatus = null;
        state.isLoadingPublicOrder = false;
        state.publicOrderError = null;
    }
  },
  extraReducers: (builder) => {
    // Shared pending state
    const setPending = (state: OrderState) => {
      state.isLoading = true;
      state.error = null;
    };
    const setRejected = (state: OrderState, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    };

    // fetchOrders
    builder.addCase(fetchOrders.pending, setPending);
    builder.addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
      state.isLoading = false;
      state.orders = action.payload;
    });
    builder.addCase(fetchOrders.rejected, setRejected);

    // fetchOrderDetails
    builder.addCase(fetchOrderDetails.pending, setPending);
    builder.addCase(fetchOrderDetails.fulfilled, (state, action: PayloadAction<Order>) => {
      state.isLoading = false;
      state.selectedOrder = action.payload;
      // Update order in the list as well
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) state.orders[index] = action.payload;
      else state.orders.push(action.payload); // Or add if not in list (e.g. deep link)
    });
    builder.addCase(fetchOrderDetails.rejected, (state, action) => {
        setRejected(state, action);
        state.selectedOrder = null;
    });

    // addNewOrder
    builder.addCase(addNewOrder.pending, (state) => { // Uses isUploadingImages for its own pending state
      state.isLoading = true; // General loading for the operation
      state.error = null;
    });
    builder.addCase(addNewOrder.fulfilled, (state) => {
      state.isLoading = false; // List is refetched
    });
    builder.addCase(addNewOrder.rejected, setRejected);

    // updateExistingOrder
    builder.addCase(updateExistingOrder.pending, (state) => {
      state.isLoading = true; // General loading
      state.error = null;
    });
    builder.addCase(updateExistingOrder.fulfilled, (state) => {
      state.isLoading = false; // List and details are refetched
    });
    builder.addCase(updateExistingOrder.rejected, setRejected);

    // removeOrder
    builder.addCase(removeOrder.pending, setPending);
    builder.addCase(removeOrder.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.orders = state.orders.filter(o => o.id !== action.payload);
      if (state.selectedOrder && state.selectedOrder.id === action.payload) {
        state.selectedOrder = null;
      }
    });
    builder.addCase(removeOrder.rejected, setRejected);

    // changeOrderStatus
    builder.addCase(changeOrderStatus.pending, setPending);
    builder.addCase(changeOrderStatus.fulfilled, (state, action: PayloadAction<{orderId: string, newStatus: string}>) => {
      state.isLoading = false;
      // Order details are refetched by the thunk, which updates selectedOrder and the list
    });
    builder.addCase(changeOrderStatus.rejected, setRejected);

    // generateTokenForOrder
    builder.addCase(generateTokenForOrder.pending, (state) => {
        state.isLoadingShareToken = true;
        state.shareError = null;
        state.shareableOrderToken = null;
    });
    builder.addCase(generateTokenForOrder.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoadingShareToken = false;
        state.shareableOrderToken = action.payload;
    });
    builder.addCase(generateTokenForOrder.rejected, (state, action) => {
        state.isLoadingShareToken = false;
        state.shareError = action.payload;
    });

    // fetchPublicOrder
    builder.addCase(fetchPublicOrder.pending, (state) => {
        state.isLoadingPublicOrder = true;
        state.publicOrderError = null;
        state.publicOrderStatus = null;
    });
    builder.addCase(fetchPublicOrder.fulfilled, (state, action: PayloadAction<PublicOrderDetails>) => {
        state.isLoadingPublicOrder = false;
        state.publicOrderStatus = action.payload;
    });
    builder.addCase(fetchPublicOrder.rejected, (state, action) => {
        state.isLoadingPublicOrder = false;
        state.publicOrderError = action.payload;
    });
  },
});

export const { 
    clearOrderError, 
    clearSelectedOrder, 
    setImageUploading, 
    clearAllOrders,
    clearShareableToken,
    clearPublicOrderStatus
} = orderSlice.actions;
export default orderSlice.reducer;


// --- Async Thunks for Shareable Order Status ---

export const generateTokenForOrder = createAsyncThunk(
  'order/generateTokenForOrder',
  async (orderId: string, {rejectWithValue}) => {
    try {
      const result = await orderService.callGenerateShareableOrderToken(orderId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success && (result.data as any).token) {
        return (result.data as any).token as string;
      }
      throw new Error((result.data as any).message || 'Failed to generate shareable token.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error generating token');
    }
  }
);

export const fetchPublicOrder = createAsyncThunk(
  'order/fetchPublicOrder',
  async (token: string, {rejectWithValue}) => {
    try {
      const result = await orderService.callGetPublicOrderStatusByToken(token) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success && (result.data as any).order) {
        return (result.data as any).order as PublicOrderDetails;
      }
      throw new Error((result.data as any).message || 'Failed to fetch public order status.');
    } catch (error: any) {
      // Handle specific errors like 'not-found' or 'permission-denied' from CF
      if (error.code === 'functions/not-found' || error.message === 'Invalid or expired token.') {
         return rejectWithValue('Invalid or expired token.'); // More user-friendly message
      }
      if (error.code === 'functions/permission-denied' || error.message === 'Token has expired.') {
          return rejectWithValue('Token has expired.');
      }
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching public order');
    }
  }
);
