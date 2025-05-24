import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import * as measurementService from '../../services/measurementService';
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// Define Measurement interfaces
export interface MeasurementValues {
  [key: string]: number | string; // e.g., { chest: 40, waist: 32, notes_on_chest: "loose fit" }
}

export interface Measurement {
  id: string; // Document ID
  customerId: string;
  tailorId: string;
  outfitType: string;
  measurementValues: MeasurementValues;
  notes?: string | null;
  takenDate: string | { _seconds: number, _nanoseconds: number }; // Firestore timestamp
  updatedAt?: string | { _seconds: number, _nanoseconds: number };
}

export interface MeasurementState {
  measurementsByCustomerId: { [customerId: string]: Measurement[] };
  isLoading: boolean;
  error: string | null | unknown;
  
  // For Measurement Templates
  customMeasurementTemplates: MeasurementTemplate[];
  isLoadingTemplates: boolean;
  templateError: string | null | unknown;
}

// Define MeasurementTemplate interface (similar to Measurement but for templates)
export interface MeasurementTemplate {
  id: string; // Document ID
  userId: string; // UID of the tailor/user who owns this template
  name: string;
  outfitType: string;
  defaultValues: MeasurementValues; // Re-use MeasurementValues
  isSystem: boolean; // System templates vs user-created
  createdAt?: string | { _seconds: number, _nanoseconds: number };
  updatedAt?: string | { _seconds: number, _nanoseconds: number };
}


const initialState: MeasurementState = {
  measurementsByCustomerId: {},
  isLoading: false,
  error: null,
  customMeasurementTemplates: [],
  isLoadingTemplates: false,
  templateError: null,
};

// Async Thunks for Instance Measurements
export const fetchMeasurementsForCustomer = createAsyncThunk(
  'measurement/fetchMeasurementsForCustomer',
  async (customerId: string, {rejectWithValue}) => {
    try {
      const result = await measurementService.callGetMeasurementsForCustomer(customerId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        return { customerId, measurements: (result.data as any).measurements as Measurement[] };
      }
      throw new Error((result.data as any).message || 'Failed to fetch measurements.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching measurements');
    }
  }
);

export const addNewMeasurement = createAsyncThunk(
  'measurement/addNewMeasurement',
  async (payload: { measurementData: measurementService.CreateMeasurementPayload }, {dispatch, rejectWithValue}) => {
    const { measurementData } = payload;
    try {
      const result = await measurementService.callCreateMeasurement(measurementData) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // After adding, refresh measurements for the customer
        dispatch(fetchMeasurementsForCustomer(measurementData.customerId));
        return { measurementId: (result.data as any).measurementId as string, customerId: measurementData.customerId };
      }
      throw new Error((result.data as any).message || 'Failed to add measurement.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error adding measurement');
    }
  }
);

export const updateExistingMeasurement = createAsyncThunk(
  'measurement/updateExistingMeasurement',
  async (payload: {measurementId: string, customerId: string, dataToUpdate: measurementService.UpdateMeasurementPayload }, {dispatch, rejectWithValue}) => {
    const { measurementId, customerId, dataToUpdate } = payload;
    try {
      const result = await measurementService.callUpdateMeasurement(measurementId, dataToUpdate) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // After updating, refresh measurements for the customer
        dispatch(fetchMeasurementsForCustomer(customerId));
        return { measurementId, customerId, dataToUpdate };
      }
      throw new Error((result.data as any).message || 'Failed to update measurement.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating measurement');
    }
  }
);

export const removeMeasurement = createAsyncThunk(
  'measurement/removeMeasurement',
  async (payload: {measurementId: string, customerId: string}, {dispatch, rejectWithValue}) => {
    const { measurementId, customerId } = payload;
    try {
      const result = await measurementService.callDeleteMeasurement(measurementId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        // After deleting, refresh measurements for the customer
        dispatch(fetchMeasurementsForCustomer(customerId));
        return { measurementId, customerId }; // Return IDs for potential direct state update if needed elsewhere
      }
      throw new Error((result.data as any).message || 'Failed to delete measurement.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error deleting measurement');
    }
  }
);

// Slice
const measurementSlice = createSlice({
  name: 'measurement',
  initialState,
  reducers: {
    clearMeasurementError: (state) => {
      state.error = null;
    },
    clearCustomerMeasurements: (state, action: PayloadAction<string>) => {
      const customerId = action.payload;
      if (state.measurementsByCustomerId[customerId]) {
        delete state.measurementsByCustomerId[customerId];
      }
    },
    clearAllMeasurements: (state) => { 
        state.measurementsByCustomerId = {};
        state.isLoading = false;
        state.error = null;
    },
    // Reducers for templates
    clearTemplateError: (state) => {
        state.templateError = null;
    },
    clearAllCustomTemplates: (state) => {
        state.customMeasurementTemplates = [];
        state.isLoadingTemplates = false;
        state.templateError = null;
    }
  },
  extraReducers: (builder) => {
    // fetchMeasurementsForCustomer
    builder.addCase(fetchMeasurementsForCustomer.pending, (state) => {
      state.isLoading = true; // This is for instance measurements
      state.error = null;
    });
    builder.addCase(fetchMeasurementsForCustomer.fulfilled, (state, action: PayloadAction<{ customerId: string; measurements: Measurement[] }>) => {
      state.isLoading = false;
      state.measurementsByCustomerId[action.payload.customerId] = action.payload.measurements;
    });
    builder.addCase(fetchMeasurementsForCustomer.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // addNewMeasurement
    builder.addCase(addNewMeasurement.pending, (state) => {
      state.isLoading = true; 
      state.error = null;
    });
    builder.addCase(addNewMeasurement.fulfilled, (state) => {
      state.isLoading = false; 
    });
    builder.addCase(addNewMeasurement.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // updateExistingMeasurement
    builder.addCase(updateExistingMeasurement.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateExistingMeasurement.fulfilled, (state) => {
      state.isLoading = false; 
    });
    builder.addCase(updateExistingMeasurement.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // removeMeasurement
    builder.addCase(removeMeasurement.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeMeasurement.fulfilled, (state) => {
      state.isLoading = false; 
    });
    builder.addCase(removeMeasurement.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Thunks for Measurement Templates
    builder.addCase(fetchCustomMeasurementTemplates.pending, (state) => {
        state.isLoadingTemplates = true;
        state.templateError = null;
    });
    builder.addCase(fetchCustomMeasurementTemplates.fulfilled, (state, action: PayloadAction<MeasurementTemplate[]>) => {
        state.isLoadingTemplates = false;
        state.customMeasurementTemplates = action.payload;
    });
    builder.addCase(fetchCustomMeasurementTemplates.rejected, (state, action) => {
        state.isLoadingTemplates = false;
        state.templateError = action.payload;
    });

    builder.addCase(addNewCustomMeasurementTemplate.pending, (state) => {
        state.isLoadingTemplates = true;
        state.templateError = null;
    });
    builder.addCase(addNewCustomMeasurementTemplate.fulfilled, (state) => {
        state.isLoadingTemplates = false; // List is refetched by thunk
    });
    builder.addCase(addNewCustomMeasurementTemplate.rejected, (state, action) => {
        state.isLoadingTemplates = false;
        state.templateError = action.payload;
    });

    builder.addCase(updateExistingCustomMeasurementTemplate.pending, (state) => {
        state.isLoadingTemplates = true;
        state.templateError = null;
    });
    builder.addCase(updateExistingCustomMeasurementTemplate.fulfilled, (state) => {
        state.isLoadingTemplates = false; // List is refetched by thunk
    });
    builder.addCase(updateExistingCustomMeasurementTemplate.rejected, (state, action) => {
        state.isLoadingTemplates = false;
        state.templateError = action.payload;
    });
    
    builder.addCase(removeCustomMeasurementTemplate.pending, (state) => {
        state.isLoadingTemplates = true;
        state.templateError = null;
    });
    builder.addCase(removeCustomMeasurementTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoadingTemplates = false; // List is refetched by thunk, or update locally:
        // state.customMeasurementTemplates = state.customMeasurementTemplates.filter(t => t.id !== action.payload);
    });
    builder.addCase(removeCustomMeasurementTemplate.rejected, (state, action) => {
        state.isLoadingTemplates = false;
        state.templateError = action.payload;
    });
  },
});

export const { 
    clearMeasurementError, 
    clearCustomerMeasurements, 
    clearAllMeasurements,
    clearTemplateError,
    clearAllCustomTemplates 
} = measurementSlice.actions;
export default measurementSlice.reducer;


// --- Async Thunks for Measurement Templates ---
// (These should be defined above the slice, but placed here for tool diff visibility)

export const fetchCustomMeasurementTemplates = createAsyncThunk(
  'measurement/fetchCustomMeasurementTemplates',
  async (_, {rejectWithValue}) => {
    try {
      // Assuming measurementService.callListMeasurementTemplates can be filtered for custom (non-system)
      // or that the cloud function returns all and we filter client-side if needed.
      // For now, assume it returns custom ones, or all and we filter by `isSystem === false`.
      const result = await measurementService.callListMeasurementTemplates({}) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        const templates = (result.data as any).templates as MeasurementTemplate[];
        // Filter for custom templates if the backend returns all
        return templates.filter(template => !template.isSystem);
      }
      throw new Error((result.data as any).message || 'Failed to fetch measurement templates.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error fetching templates');
    }
  }
);

export const addNewCustomMeasurementTemplate = createAsyncThunk(
  'measurement/addNewCustomMeasurementTemplate',
  async (templateData: Omit<MeasurementTemplate, 'id' | 'userId' | 'isSystem' | 'createdAt' | 'updatedAt'>, {dispatch, rejectWithValue}) => {
    try {
      // callCreateMeasurementTemplate in service should set userId, isSystem=false, and timestamps
      const result = await measurementService.callCreateMeasurementTemplate(templateData) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchCustomMeasurementTemplates()); // Refresh list
        return (result.data as any).templateId as string;
      }
      throw new Error((result.data as any).message || 'Failed to add custom template.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error adding template');
    }
  }
);

export const updateExistingCustomMeasurementTemplate = createAsyncThunk(
  'measurement/updateExistingCustomMeasurementTemplate',
  async (payload: {templateId: string, dataToUpdate: Partial<Omit<MeasurementTemplate, 'id' | 'userId' | 'isSystem' | 'createdAt' | 'updatedAt'>>}, {dispatch, rejectWithValue}) => {
    const {templateId, dataToUpdate} = payload;
    try {
      const result = await measurementService.callUpdateMeasurementTemplate(templateId, dataToUpdate) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchCustomMeasurementTemplates()); // Refresh list
        return { templateId, ...dataToUpdate };
      }
      throw new Error((result.data as any).message || 'Failed to update custom template.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error updating template');
    }
  }
);

export const removeCustomMeasurementTemplate = createAsyncThunk(
  'measurement/removeCustomMeasurementTemplate',
  async (templateId: string, {dispatch, rejectWithValue}) => {
    try {
      const result = await measurementService.callDeleteMeasurementTemplate(templateId) as FirebaseFunctionsTypes.HttpsCallableResult;
      if (result.data && (result.data as any).success) {
        dispatch(fetchCustomMeasurementTemplates()); // Refresh list
        return templateId;
      }
      throw new Error((result.data as any).message || 'Failed to delete custom template.');
    } catch (error: any) {
      return rejectWithValue(error.data?.message || error.message || error.code || 'Error deleting template');
    }
  }
);
