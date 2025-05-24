import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import * as invoiceService from '../../services/invoiceService';
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// Define Interfaces
export interface LineItem {
  id: string; // Can be a unique ID or product/service code
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number; // quantity * unitPrice
}

export interface Invoice {
  id: string; // Document ID
  orderId: string;
  customerId: string;
  tailorId: string;
  generatedDate: string | { _seconds: number, _nanoseconds: number }; // Firestore timestamp or ISO string
  items: LineItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string; // e.g., "paid", "partially_paid", "unpaid", "overdue", "refunded"
  notes?: string | null;
  updatedAt?: string | { _seconds: number, _nanoseconds: number };
}

export interface ReceiptData {
  // Define based on what your generateInvoiceReceiptData Cloud Function returns
  invoice: Invoice; // Example: includes the full invoice
  customer: { name: string; phoneNumber?: string; email?: string; address?: string };
  tailorBusinessInfo: { businessName?: string; name?: string; email?: string; phoneNumber?: string};
  generatedAt: string; // ISO string
  // ... other fields specific to your receipt data structure
}

export interface FinancialReport {
    // Define based on what your getFinancialReportData Cloud Function returns
    reportType: string;
    dateRange: { from: string; to: string };
    totalInvoiced: number;
    totalPaid: number;
    invoiceCount: number;
    // ... other report specific fields
}


export interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  receiptData: ReceiptData | null;
  reportData: FinancialReport | null;
  isLoading: boolean;
  error: string | null | unknown;
}

const initialState: InvoiceState = {
  invoices: [],
  selectedInvoice: null,
  receiptData: null,
  reportData: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async (filters?: invoiceService.ListInvoicesFilters, {rejectWithValue}) => {
    try {
      const result = await invoiceService.callListInvoices(filters) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return (result.data as any).invoices as Invoice[];
      }
      throw new Error((result.data as any).message || 'Failed to fetch invoices.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching invoices');
    }
  }
);

export const fetchInvoiceDetails = createAsyncThunk(
  'invoice/fetchInvoiceDetails',
  async (invoiceId: string, {rejectWithValue}) => {
    try {
      const result = await invoiceService.callGetInvoice(invoiceId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        const invoiceData = (result.data as any).invoice;
        if (!invoiceData.id && invoiceId) invoiceData.id = invoiceId;
        return invoiceData as Invoice;
      }
      throw new Error((result.data as any).message || 'Failed to fetch invoice details.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching invoice details');
    }
  }
);

export const addNewInvoice = createAsyncThunk(
  'invoice/addNewInvoice',
  async (payload: invoiceService.CreateInvoicePayload, {dispatch, rejectWithValue}) => {
    try {
      const result = await invoiceService.callCreateInvoice(payload) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchInvoices()); // Refresh invoice list
        return (result.data as any).invoiceId as string; // Return new invoiceId
      }
      throw new Error((result.data as any).message || 'Failed to add invoice.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error adding invoice');
    }
  }
);

export const updateExistingInvoice = createAsyncThunk(
  'invoice/updateExistingInvoice',
  async (payload: {invoiceId: string, dataToUpdate: invoiceService.UpdateInvoicePayload }, {dispatch, rejectWithValue}) => {
    const {invoiceId, dataToUpdate} = payload;
    try {
      const result = await invoiceService.callUpdateInvoice(invoiceId, dataToUpdate) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchInvoices()); // Refresh list
        dispatch(fetchInvoiceDetails(invoiceId)); // Refresh selected invoice if it's the one being viewed
        return { invoiceId, ...dataToUpdate };
      }
      throw new Error((result.data as any).message || 'Failed to update invoice.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating invoice');
    }
  }
);

export const removeInvoice = createAsyncThunk(
  'invoice/removeInvoice',
  async (invoiceId: string, {dispatch, rejectWithValue}) => {
    try {
      const result = await invoiceService.callDeleteInvoice(invoiceId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchInvoices()); // Refresh list
        return invoiceId;
      }
      throw new Error((result.data as any).message || 'Failed to delete invoice.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error deleting invoice');
    }
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'invoice/updatePaymentStatus',
  async (payload: invoiceService.UpdatePaymentStatusPayload, {dispatch, rejectWithValue}) => {
    try {
      const result = await invoiceService.callUpdateInvoicePaymentStatus(payload) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchInvoices()); // Refresh list
        dispatch(fetchInvoiceDetails(payload.invoiceId)); // Refresh selected invoice
        return { invoiceId: payload.invoiceId, paidAmount: payload.paidAmount, paymentStatus: payload.paymentStatus };
      }
      throw new Error((result.data as any).message || 'Failed to update payment status.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating payment status');
    }
  }
);

export const fetchReceiptData = createAsyncThunk(
  'invoice/fetchReceiptData',
  async (invoiceId: string, {rejectWithValue}) => {
    try {
      const result = await invoiceService.callGenerateInvoiceReceiptData(invoiceId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return (result.data as any).receiptData as ReceiptData;
      }
      throw new Error((result.data as any).message || 'Failed to fetch receipt data.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching receipt data');
    }
  }
);

export const fetchFinancialReport = createAsyncThunk(
  'invoice/fetchFinancialReport',
  async (payload: invoiceService.FinancialReportPayload, {rejectWithValue}) => {
    try {
      const result = await invoiceService.callGetFinancialReportData(payload) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return (result.data as any).report as FinancialReport;
      }
      throw new Error((result.data as any).message || 'Failed to fetch financial report.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching financial report');
    }
  }
);


// Slice
const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    clearInvoiceError: (state) => { state.error = null; },
    clearSelectedInvoice: (state) => { state.selectedInvoice = null; },
    clearReceiptData: (state) => { state.receiptData = null; },
    clearReportData: (state) => { state.reportData = null; },
    clearAllInvoices: (state) => { // Useful on logout
        state.invoices = [];
        state.selectedInvoice = null;
        state.receiptData = null;
        state.reportData = null;
        state.isLoading = false;
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    const setPending = (state: InvoiceState) => { state.isLoading = true; state.error = null; };
    const setRejected = (state: InvoiceState, action: PayloadAction<any>) => { state.isLoading = false; state.error = action.payload; };

    builder.addCase(fetchInvoices.pending, setPending);
    builder.addCase(fetchInvoices.fulfilled, (state, action: PayloadAction<Invoice[]>) => {
      state.isLoading = false;
      state.invoices = action.payload;
    });
    builder.addCase(fetchInvoices.rejected, setRejected);

    builder.addCase(fetchInvoiceDetails.pending, setPending);
    builder.addCase(fetchInvoiceDetails.fulfilled, (state, action: PayloadAction<Invoice>) => {
      state.isLoading = false;
      state.selectedInvoice = action.payload;
      // Update invoice in the list as well
      const index = state.invoices.findIndex(inv => inv.id === action.payload.id);
      if (index !== -1) state.invoices[index] = action.payload;
      else state.invoices.push(action.payload);
    });
    builder.addCase(fetchInvoiceDetails.rejected, (state, action) => {
        setRejected(state, action);
        state.selectedInvoice = null;
    });

    builder.addCase(addNewInvoice.pending, setPending);
    builder.addCase(addNewInvoice.fulfilled, (state) => { state.isLoading = false; /* List refetched */ });
    builder.addCase(addNewInvoice.rejected, setRejected);

    builder.addCase(updateExistingInvoice.pending, setPending);
    builder.addCase(updateExistingInvoice.fulfilled, (state) => { state.isLoading = false; /* List & details refetched */ });
    builder.addCase(updateExistingInvoice.rejected, setRejected);

    builder.addCase(removeInvoice.pending, setPending);
    builder.addCase(removeInvoice.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.invoices = state.invoices.filter(inv => inv.id !== action.payload);
      if (state.selectedInvoice && state.selectedInvoice.id === action.payload) {
        state.selectedInvoice = null;
      }
    });
    builder.addCase(removeInvoice.rejected, setRejected);

    builder.addCase(updatePaymentStatus.pending, setPending);
    builder.addCase(updatePaymentStatus.fulfilled, (state) => { state.isLoading = false; /* List & details refetched */ });
    builder.addCase(updatePaymentStatus.rejected, setRejected);

    builder.addCase(fetchReceiptData.pending, setPending);
    builder.addCase(fetchReceiptData.fulfilled, (state, action: PayloadAction<ReceiptData>) => {
      state.isLoading = false;
      state.receiptData = action.payload;
    });
    builder.addCase(fetchReceiptData.rejected, (state, action) => {
        setRejected(state, action);
        state.receiptData = null;
    });

    builder.addCase(fetchFinancialReport.pending, setPending);
    builder.addCase(fetchFinancialReport.fulfilled, (state, action: PayloadAction<FinancialReport>) => {
      state.isLoading = false;
      state.reportData = action.payload;
    });
    builder.addCase(fetchFinancialReport.rejected, (state, action) => {
        setRejected(state, action);
        state.reportData = null;
    });
  },
});

export const { 
    clearInvoiceError, 
    clearSelectedInvoice, 
    clearReceiptData, 
    clearReportData,
    clearAllInvoices
} = invoiceSlice.actions;
export default invoiceSlice.reducer;
