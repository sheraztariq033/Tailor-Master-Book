import functions, { FirebaseFunctionsTypes } from '@react-native-firebase/functions';
import { Invoice, LineItem } from '../store/slices/invoiceSlice'; // Will create this type

// Define payload types for clarity
export interface CreateInvoicePayload {
  orderId: string;
  invoiceData?: { // Optional initial data for the invoice beyond what's pulled from order
    items?: LineItem[];
    tax?: number;
    discount?: number;
    notes?: string;
    paidAmount?: number; // Can specify initial paid amount if different from order's
  };
}

export interface UpdateInvoicePayload {
  // All fields are optional for update
  items?: LineItem[];
  tax?: number;
  discount?: number;
  notes?: string;
  // paymentStatus and paidAmount are typically handled by updateInvoicePaymentStatus
}

export interface UpdatePaymentStatusPayload {
  invoiceId: string;
  paidAmount: number;
  paymentStatus: string; // e.g., "paid", "partially_paid", "unpaid"
  // You might also include paymentMethod, transactionId etc.
}

export interface ListInvoicesFilters {
  paymentStatus?: string;
  customerId?: string;
  dateRange?: { from: string; to: string }; // ISO strings
}

export interface FinancialReportPayload {
  dateRange: { from: string; to: string }; // ISO strings
  reportType: string; // e.g., 'revenue_summary', 'expenses_summary'
}

// --- Firebase Cloud Functions for Invoices ---

export const callCreateInvoice = async (
  payload: CreateInvoicePayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const createInvoiceCallable = functions().httpsCallable('createInvoice');
    const result = await createInvoiceCallable(payload);
    // Expected: { success: true, invoiceId: string }
    return result;
  } catch (error: any) {
    console.error('Error in callCreateInvoice:', error.code, error.message, error.details);
    throw error;
  }
};

export const callGetInvoice = async (
  invoiceId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getInvoiceCallable = functions().httpsCallable('getInvoice');
    const result = await getInvoiceCallable({ invoiceId });
    // Expected: { success: true, invoice: Invoice }
    return result;
  } catch (error: any) {
    console.error('Error in callGetInvoice:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateInvoice = async (
  invoiceId: string,
  dataToUpdate: UpdateInvoicePayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateInvoiceCallable = functions().httpsCallable('updateInvoice');
    const result = await updateInvoiceCallable({ invoiceId, updateData: dataToUpdate });
    // Expected: { success: true, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callUpdateInvoice:', error.code, error.message, error.details);
    throw error;
  }
};

export const callDeleteInvoice = async (
  invoiceId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const deleteInvoiceCallable = functions().httpsCallable('deleteInvoice');
    const result = await deleteInvoiceCallable({ invoiceId });
    // Expected: { success: true, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callDeleteInvoice:', error.code, error.message, error.details);
    throw error;
  }
};

export const callListInvoices = async (
  filters?: ListInvoicesFilters
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const listInvoicesCallable = functions().httpsCallable('listInvoices');
    const result = await listInvoicesCallable(filters || {});
    // Expected: { success: true, invoices: Invoice[] }
    return result;
  } catch (error: any) {
    console.error('Error in callListInvoices:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateInvoicePaymentStatus = async (
  payload: UpdatePaymentStatusPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updatePaymentCallable = functions().httpsCallable('updateInvoicePaymentStatus');
    const result = await updatePaymentCallable(payload);
    // Expected: { success: true, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callUpdateInvoicePaymentStatus:', error.code, error.message, error.details);
    throw error;
  }
};

export const callGenerateInvoiceReceiptData = async (
  invoiceId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const generateReceiptCallable = functions().httpsCallable('generateInvoiceReceiptData');
    const result = await generateReceiptCallable({ invoiceId });
    // Expected: { success: true, receiptData: object } (structure defined by your CF)
    return result;
  } catch (error: any) {
    console.error('Error in callGenerateInvoiceReceiptData:', error.code, error.message, error.details);
    throw error;
  }
};

export const callGetFinancialReportData = async (
  payload: FinancialReportPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getReportCallable = functions().httpsCallable('getFinancialReportData');
    const result = await getReportCallable(payload);
    // Expected: { success: true, report: object } (structure defined by your CF)
    return result;
  } catch (error: any) {
    console.error('Error in callGetFinancialReportData:', error.code, error.message, error.details);
    throw error;
  }
};
