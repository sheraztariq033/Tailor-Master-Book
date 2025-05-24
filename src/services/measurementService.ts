import functions, { FirebaseFunctionsTypes } from '@react-native-firebase/functions';
import { Measurement, MeasurementValues } from '../store/slices/measurementSlice'; // Will create this type

// Define payload types for clarity
export interface CreateMeasurementPayload {
  customerId: string;
  outfitType: string;
  measurementValues: MeasurementValues; // e.g., { chest: 40, waist: 32 }
  notes?: string;
  // tailorId is added by the Cloud Function based on the authenticated user
}

export interface UpdateMeasurementPayload {
  outfitType?: string;
  measurementValues?: MeasurementValues;
  notes?: string;
  // customerId and tailorId should generally not be updatable directly through this
}

// --- Firebase Cloud Functions for Measurements ---

export const callCreateMeasurement = async (
  measurementData: CreateMeasurementPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const createMeasurementCallable = functions().httpsCallable('createMeasurement');
    const result = await createMeasurementCallable(measurementData);
    // Expected result.data: { success: true, measurementId: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callCreateMeasurement:', error.code, error.message, error.details);
    throw error; // Re-throw to be caught by Redux thunk
  }
};

export const callGetMeasurementsForCustomer = async (
  customerId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const getMeasurementsCallable = functions().httpsCallable('getMeasurementsForCustomer');
    const result = await getMeasurementsCallable({ customerId });
    // Expected result.data: { success: true, measurements: Measurement[] } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callGetMeasurementsForCustomer:', error.code, error.message, error.details);
    throw error;
  }
};

// --- Firebase Cloud Functions for Measurement Templates ---

export interface ListMeasurementTemplatesFilters {
    isSystem?: boolean;
    // userId?: string; // Cloud function will use authenticated user's ID for custom templates
}

// Omit types are for payload, MeasurementTemplate is for return type
export type CreateMeasurementTemplatePayload = Omit<import('../store/slices/measurementSlice').MeasurementTemplate, 'id' | 'userId' | 'isSystem' | 'createdAt' | 'updatedAt'>;
export type UpdateMeasurementTemplatePayload = Partial<Omit<import('../store/slices/measurementSlice').MeasurementTemplate, 'id' | 'userId' | 'isSystem' | 'createdAt' | 'updatedAt'>>;


export const callListMeasurementTemplates = async (
  filters?: ListMeasurementTemplatesFilters
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const listTemplatesCallable = functions().httpsCallable('listMeasurementTemplates');
    const result = await listTemplatesCallable(filters || {});
    // Expected: { success: true, templates: MeasurementTemplate[] }
    return result;
  } catch (error: any) {
    console.error('Error in callListMeasurementTemplates:', error.code, error.message, error.details);
    throw error;
  }
};

export const callCreateMeasurementTemplate = async (
  templateData: CreateMeasurementTemplatePayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const createTemplateCallable = functions().httpsCallable('createMeasurementTemplate');
    const result = await createTemplateCallable(templateData);
    // Expected: { success: true, templateId: string }
    return result;
  } catch (error: any) {
    console.error('Error in callCreateMeasurementTemplate:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateMeasurementTemplate = async (
  templateId: string,
  dataToUpdate: UpdateMeasurementTemplatePayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateTemplateCallable = functions().httpsCallable('updateMeasurementTemplate');
    const result = await updateTemplateCallable({ templateId, updateData: dataToUpdate });
    // Expected: { success: true, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callUpdateMeasurementTemplate:', error.code, error.message, error.details);
    throw error;
  }
};

export const callDeleteMeasurementTemplate = async (
  templateId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const deleteTemplateCallable = functions().httpsCallable('deleteMeasurementTemplate');
    const result = await deleteTemplateCallable({ templateId });
    // Expected: { success: true, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callDeleteMeasurementTemplate:', error.code, error.message, error.details);
    throw error;
  }
};

export const callUpdateMeasurement = async (
  measurementId: string,
  dataToUpdate: UpdateMeasurementPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const updateMeasurementCallable = functions().httpsCallable('updateMeasurement');
    const result = await updateMeasurementCallable({ measurementId, updateData: dataToUpdate });
    // Expected result.data: { success: true, message: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callUpdateMeasurement:', error.code, error.message, error.details);
    throw error;
  }
};

export const callDeleteMeasurement = async (
  measurementId: string
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const deleteMeasurementCallable = functions().httpsCallable('deleteMeasurement');
    const result = await deleteMeasurementCallable({ measurementId });
    // Expected result.data: { success: true, message: string } or { success: false, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callDeleteMeasurement:', error.code, error.message, error.details);
    throw error;
  }
};
