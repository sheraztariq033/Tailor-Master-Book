import functions, { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// --- Define Payload Types ---

export interface DataExportPayload {
  collectionName: string;
  format: 'json' | 'csv';
}

export interface DataImportPayload {
  collectionName: string; // e.g., 'customers', 'measurements'
  data: Array<object>;   // Array of records to import
}

// --- Firebase Cloud Functions for Data Management ---

export const callInitiateManualBackup = async (): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const initiateBackupCallable = functions().httpsCallable('initiateManualBackup');
    const result = await initiateBackupCallable();
    // Expected result.data: { success: true, backupPath: string, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callInitiateManualBackup:', error.code, error.message, error.details);
    throw error; // Re-throw to be caught by Redux thunk
  }
};

export const callInitiateDataExport = async (
  payload: DataExportPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const initiateExportCallable = functions().httpsCallable('initiateDataExport');
    const result = await initiateExportCallable(payload);
    // Expected result.data: { success: true, exportPath: string, message: string } or { success: true, message: "No data..." }
    return result;
  } catch (error: any) {
    console.error('Error in callInitiateDataExport:', error.code, error.message, error.details);
    throw error;
  }
};

export const callInitiateDataImport = async (
  payload: DataImportPayload
): Promise<FirebaseFunctionsTypes.HttpsCallableResult> => {
  try {
    const initiateImportCallable = functions().httpsCallable('initiateDataImport');
    const result = await initiateImportCallable(payload);
    // Expected result.data: { success: true, importedCount: number, message: string }
    return result;
  } catch (error: any) {
    console.error('Error in callInitiateDataImport:', error.code, error.message, error.details);
    throw error;
  }
};
