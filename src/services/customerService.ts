import functions, { FirebaseFunctionsTypes } from '@react-native-firebase/functions';
import { Customer } from '../store/slices/customerSlice'; // Will create this type

// Define payload types for clarity
export interface CreateCustomerPayload {
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateCustomerPayload {
  // All fields from Customer are optional for update, except tailorId and createdAt
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  tags?: string[];
  notes?: string;
}

export interface ListCustomersFilters {
  // Define any filters your Cloud Function might support
  // For P0, this might be empty or very simple
  status?: string; // Example filter
}

// --- Firebase Cloud Functions for Customers ---

export const callCreateCustomer = async (
  customerData: CreateCustomerPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const createCustomerCallable = functions().httpsCallable('createCustomer');
    const result = await createCustomerCallable(customerData);
    // Expected result.data: { success: true, customerId: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callCreateCustomer:', error.code, error.message, error.details);
    throw error; // Re-throw to be caught by Redux thunk
  }
};

export const callGetCustomer = async (
  customerId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getCustomerCallable = functions().httpsCallable('getCustomer');
    const result = await getCustomerCallable({ customerId });
    // Expected result.data: { success: true, customer: Customer } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callGetCustomer:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateCustomer = async (
  customerId: string,
  dataToUpdate: UpdateCustomerPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateCustomerCallable = functions().httpsCallable('updateCustomer');
    const result = await updateCustomerCallable({ customerId, updateData: dataToUpdate });
    // Expected result.data: { success: true, message: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callUpdateCustomer:', error.code, error.message, error.details);
    throw error;
  }
};

export const callDeleteCustomer = async (
  customerId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const deleteCustomerCallable = functions().httpsCallable('deleteCustomer');
    const result = await deleteCustomerCallable({ customerId });
    // Expected result.data: { success: true, message: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callDeleteCustomer:', error.code, error.message, error.details);
    throw error;
  }
};

export const callListCustomers = async (
  filters?: ListCustomersFilters // Optional filters
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const listCustomersCallable = functions().httpsCallable('listCustomers');
    const result = await listCustomersCallable(filters || {}); // Pass empty object if no filters
    // Expected result.data: { success: true, customers: Customer[] } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callListCustomers:', error.code, error.message, error.details);
    throw error;
  }
};
