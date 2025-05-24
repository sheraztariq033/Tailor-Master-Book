import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import * as dataService from '../../services/dataService';
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

export interface DataState {
  isLoadingBackup: boolean;
  backupError: string | null | unknown;
  backupSuccessMessage: string | null;
  
  isLoadingExport: boolean;
  exportError: string | null | unknown;
  exportSuccessMessage: string | null;
  exportFilePath: string | null; // To store the path of the exported file

  isLoadingImport: boolean;
  importError: string | null | unknown;
  importSuccessMessage: string | null;
  importedCount: number | null;
}

const initialState: DataState = {
  isLoadingBackup: false,
  backupError: null,
  backupSuccessMessage: null,

  isLoadingExport: false,
  exportError: null,
  exportSuccessMessage: null,
  exportFilePath: null,

  isLoadingImport: false,
  importError: null,
  importSuccessMessage: null,
  importedCount: null,
};

// Async Thunks
export const triggerManualBackup = createAsyncThunk(
  'data/triggerManualBackup',
  async (_, {rejectWithValue}) => {
    try {
      const result = await dataService.callInitiateManualBackup() as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return { message: (result.data as any).message, path: (result.data as any).backupPath };
      }
      throw new Error((result.data as any).message || 'Manual backup failed.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error initiating backup');
    }
  }
);

export const triggerDataExport = createAsyncThunk(
  'data/triggerDataExport',
  async (payload: dataService.DataExportPayload, {rejectWithValue}) => {
    try {
      const result = await dataService.callInitiateDataExport(payload) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return { message: (result.data as any).message, path: (result.data as any).exportPath };
      }
      throw new Error((result.data as any).message || 'Data export failed.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error initiating export');
    }
  }
);

export const triggerDataImport = createAsyncThunk(
  'data/triggerDataImport',
  async (payload: dataService.DataImportPayload, {rejectWithValue}) => {
    try {
      const result = await dataService.callInitiateDataImport(payload) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return { message: (result.data as any).message, count: (result.data as any).importedCount };
      }
      throw new Error((result.data as any).message || 'Data import failed.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error initiating import');
    }
  }
);


// Slice
const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearBackupStatus: (state) => {
      state.isLoadingBackup = false;
      state.backupError = null;
      state.backupSuccessMessage = null;
    },
    clearExportStatus: (state) => {
      state.isLoadingExport = false;
      state.exportError = null;
      state.exportSuccessMessage = null;
      state.exportFilePath = null;
    },
    clearImportStatus: (state) => {
      state.isLoadingImport = false;
      state.importError = null;
      state.importSuccessMessage = null;
      state.importedCount = null;
    },
    clearAllDataManagementStatus: (state) => { // For general clearing or on logout
        Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    // Manual Backup
    builder.addCase(triggerManualBackup.pending, (state) => {
      state.isLoadingBackup = true;
      state.backupError = null;
      state.backupSuccessMessage = null;
    });
    builder.addCase(triggerManualBackup.fulfilled, (state, action: PayloadAction<{message: string, path: string}>) => {
      state.isLoadingBackup = false;
      state.backupSuccessMessage = `${action.payload.message} Path: ${action.payload.path || 'N/A'}`;
    });
    builder.addCase(triggerManualBackup.rejected, (state, action) => {
      state.isLoadingBackup = false;
      state.backupError = action.payload;
    });

    // Data Export
    builder.addCase(triggerDataExport.pending, (state) => {
      state.isLoadingExport = true;
      state.exportError = null;
      state.exportSuccessMessage = null;
      state.exportFilePath = null;
    });
    builder.addCase(triggerDataExport.fulfilled, (state, action: PayloadAction<{message: string, path: string | null}>) => {
      state.isLoadingExport = false;
      state.exportSuccessMessage = action.payload.path 
        ? `${action.payload.message} Path: ${action.payload.path}` 
        : action.payload.message; // Handle "No data to export" message
      state.exportFilePath = action.payload.path;
    });
    builder.addCase(triggerDataExport.rejected, (state, action) => {
      state.isLoadingExport = false;
      state.exportError = action.payload;
    });

    // Data Import
    builder.addCase(triggerDataImport.pending, (state) => {
      state.isLoadingImport = true;
      state.importError = null;
      state.importSuccessMessage = null;
      state.importedCount = null;
    });
    builder.addCase(triggerDataImport.fulfilled, (state, action: PayloadAction<{message: string, count: number | null}>) => {
      state.isLoadingImport = false;
      state.importSuccessMessage = action.payload.message;
      state.importedCount = action.payload.count;
    });
    builder.addCase(triggerDataImport.rejected, (state, action) => {
      state.isLoadingImport = false;
      state.importError = action.payload;
    });
  },
});

export const { 
    clearBackupStatus, 
    clearExportStatus, 
    clearImportStatus,
    clearAllDataManagementStatus
} = dataSlice.actions;
export default dataSlice.reducer;
