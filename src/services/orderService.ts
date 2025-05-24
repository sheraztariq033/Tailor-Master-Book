import functions, { FirebaseFunctionsTypes } from '@react-native-firebase/functions';
import storage, { FirebaseStorageTypes } from '@react-native-firebase/storage';
import { Order } from '../store/slices/orderSlice'; // Will create this type

// Define payload types for clarity
export interface CreateOrderPayload {
  customerId: string;
  outfitType: string;
  measurementId: string; // ID of the selected measurement document
  orderDate: string; // ISO string or server timestamp placeholder
  deadlineDate: string; // ISO string
  features: Record<string, string | boolean | number>; // e.g., { fabric: "Cotton", lining: true, buttons: 6 }
  images?: string[]; // Array of gs:// paths or HTTPS URLs from Firebase Storage
  notes?: string;
  totalAmount: number;
  paidAmount: number;
  // status is set by backend on creation (e.g., 'received')
  // tailorId is added by the Cloud Function
}

export interface UpdateOrderPayload {
  // All fields are optional for update
  outfitType?: string;
  measurementId?: string;
  orderDate?: string;
  deadlineDate?: string;
  features?: Record<string, string | boolean | number>;
  images?: string[]; // Can include new and existing image paths/URLs
  notes?: string;
  totalAmount?: number;
  paidAmount?: number;
  status?: string; // Status can be updated separately or as part of general update
}

export interface ListOrdersFilters {
  status?: string;
  customerId?: string;
  dateRange?: { from: string; to: string }; // ISO strings
}

// --- Firebase Cloud Functions for Orders ---

export const callCreateOrder = async (
  orderData: CreateOrderPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const createOrderCallable = functions().httpsCallable('createOrder');
    const result = await createOrderCallable(orderData);
    return result; // Expected: { success: true, orderId: string }
  } catch (error: any) {
    console.error('Error in callCreateOrder:', error.code, error.message, error.details);
    throw error;
  }
};

// --- Shareable Order Token Functions ---

export const callGenerateShareableOrderToken = async (
  orderId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const generateTokenCallable = functions().httpsCallable('generateShareableOrderToken');
    const result = await generateTokenCallable({ orderId });
    // Expected: { success: true, token: string }
    return result;
  } catch (error: any) {
    console.error('Error in callGenerateShareableOrderToken:', error.code, error.message, error.details);
    throw error;
  }
};

export const callGetPublicOrderStatusByToken = async (
  token: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getStatusCallable = functions().httpsCallable('getPublicOrderStatusByToken');
    const result = await getStatusCallable({ token });
    // Expected: { success: true, order: PublicOrderDetails }
    return result;
  } catch (error: any) {
    console.error('Error in callGetPublicOrderStatusByToken:', error.code, error.message, error.details);
    throw error;
  }
};

export const callGetOrder = async (
  orderId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getOrderCallable = functions().httpsCallable('getOrder');
    const result = await getOrderCallable({ orderId });
    return result; // Expected: { success: true, order: Order }
  } catch (error: any) {
    console.error('Error in callGetOrder:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateOrder = async (
  orderId: string,
  dataToUpdate: UpdateOrderPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateOrderCallable = functions().httpsCallable('updateOrder');
    const result = await updateOrderCallable({ orderId, updateData: dataToUpdate });
    return result; // Expected: { success: true, message: string }
  } catch (error: any) {
    console.error('Error in callUpdateOrder:', error.code, error.message, error.details);
    throw error;
  }
};

export const callDeleteOrder = async (
  orderId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const deleteOrderCallable = functions().httpsCallable('deleteOrder');
    const result = await deleteOrderCallable({ orderId });
    return result; // Expected: { success: true, message: string }
  } catch (error: any) {
    console.error('Error in callDeleteOrder:', error.code, error.message, error.details);
    throw error;
  }
};

export const callListOrders = async (
  filters?: ListOrdersFilters
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const listOrdersCallable = functions().httpsCallable('listOrders');
    const result = await listOrdersCallable(filters || {});
    return result; // Expected: { success: true, orders: Order[] }
  } catch (error: any) {
    console.error('Error in callListOrders:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateOrderStatus = async (
  orderId: string,
  newStatus: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateOrderStatusCallable = functions().httpsCallable('updateOrderStatus');
    const result = await updateOrderStatusCallable({ orderId, newStatus });
    return result; // Expected: { success: true, message: string }
  } catch (error: any) {
    console.error('Error in callUpdateOrderStatus:', error.code, error.message, error.details);
    throw error;
  }
};

// --- Firebase Storage for Order Images ---

/**
 * Uploads an image for an order to Firebase Storage.
 * @param userId UID of the user (tailor)
 * @param orderId ID of the order (can be a temporary ID if order not yet created)
 * @param imageUri Local URI of the image (e.g., from image picker, 'file:///...')
 * @param imageName A unique name for the image (e.g., timestamp or UUID with extension)
 * @returns Promise resolving with the gs:// path of the uploaded image.
 */
export const uploadOrderImage = async (
  userId: string,
  orderId: string, // Could be a temp ID client-side before order creation
  imageUri: string,
  imageName: string
): Promise<string> => {
  if (!userId || !orderId || !imageUri || !imageName) {
    throw new Error("Missing required parameters for image upload.");
  }
  // Ensure imageUri is a local file path
  if (!imageUri.startsWith('file://')) {
    throw new Error("Image URI must be a local file path (e.g., starts with 'file://').");
  }

  const storagePath = `user_uploads/${userId}/order_images/${orderId}/${imageName}`;
  const reference = storage().ref(storagePath);

  try {
    // Upload file
    const task = reference.putFile(imageUri);

    // Optional: Monitor upload progress
    task.on('state_changed', (snapshot: FirebaseStorageTypes.TaskSnapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log(`Upload is ${progress}% done`);
    });

    await task; // Wait for upload to complete

    console.log('Image uploaded successfully to:', storagePath);
    // Return the gs:// path, as this is often more useful internally with Firebase services
    // than a download URL which can expire or have complex tokens.
    // The Cloud Functions can convert gs:// paths to download URLs if needed for client display.
    return `gs://${reference.bucket}/${reference.fullPath}`;
  } catch (error: any) {
    console.error('Error uploading order image to Firebase Storage:', storagePath, error);
    // Check for specific storage errors if needed
    // e.g., error.code === 'storage/unauthorized' or 'storage/canceled'
    throw error;
  }
};
