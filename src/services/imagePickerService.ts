import {
  launchCamera as RNCamera,
  launchImageLibrary as RNLibraray,
  ImagePickerResponse,
  Asset,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import {PermissionsAndroid, Platform} from 'react-native';
import {t} from 'i18next'; // For permission messages

// Define a consistent response type
export interface PickerResponse {
  didCancel: boolean;
  assets?: Asset[];
  errorCode?: string;
  errorMessage?: string;
}

// --- Android Permission Handling ---
const requestCameraPermissionAndroid = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: t('permissions.camera.title', 'Camera Permission'),
          message: t('permissions.camera.message', 'Darzi Book needs access to your camera to take photos for orders.'),
          buttonNeutral: t('permissions.askMeLater', 'Ask Me Later'),
          buttonNegative: t('common.cancel', 'Cancel'),
          buttonPositive: t('common.ok', 'OK'),
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }
  return true; // For iOS, permission handled by Info.plist or at time of use
};

const requestStoragePermissionAndroid = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      // For Android 10 (API 29) and above, WRITE_EXTERNAL_STORAGE is not needed for app-specific storage.
      // For older versions, it might be required for gallery access.
      // react-native-image-picker might handle this internally based on SDK version.
      // Here, we request READ_EXTERNAL_STORAGE for broader compatibility if needed.
      // For Android 13+, READ_MEDIA_IMAGES is the new permission.
      // This example shows basic CAMERA permission, a full app would need more granular storage permission logic.
      // For simplicity, assuming image picker handles most of this or focusing on camera.
      // If targeting older Android or specific gallery needs, add READ_EXTERNAL_STORAGE request.
      return true; // Placeholder, as modern Android handles scoped storage well for pickers
    } catch (err) {
      console.warn('Storage permission error (Android):', err);
      return false;
    }
  }
  return true; // For iOS, permission handled by Info.plist
};


// --- Service Functions ---

const defaultCameraOptions: CameraOptions = {
  mediaType: 'photo',
  quality: 0.8, // Reduce image size
  saveToPhotos: false, // Useful if you want to save to gallery, otherwise app handles file
  // includeBase64: false, // Set to true if you need base64 for direct upload (not recommended for large images)
};

const defaultLibraryOptions: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 0.8,
  selectionLimit: 5, // Allow multiple selections, adjust as needed
  // includeBase64: false,
};


export const launchAppCamera = async (options: CameraOptions = {}): Promise<PickerResponse> => {
  const hasPermission = await requestCameraPermissionAndroid();
  if (!hasPermission) {
    return {
      didCancel: false, // Not cancelled by user, but by permission denial
      errorCode: 'permission_denied',
      errorMessage: t('permissions.camera.denied', 'Camera permission was denied.'),
    };
  }

  return new Promise(resolve => {
    RNCamera({...defaultCameraOptions, ...options}, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        resolve({didCancel: true});
      } else if (response.errorCode || response.errorMessage) {
        resolve({
          didCancel: false,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage,
        });
      } else {
        resolve({didCancel: false, assets: response.assets});
      }
    });
  });
};

export const launchAppImageLibrary = async (options: ImageLibraryOptions = {}): Promise<PickerResponse> => {
  // Storage permission for gallery access might be needed for older Android.
  // react-native-image-picker usually handles this, or you can request it explicitly.
  // For iOS, ensure NSCameraUsageDescription and NSPhotoLibraryUsageDescription are in Info.plist.
  
  // const hasStoragePerm = await requestStoragePermissionAndroid(); // Optional explicit check
  // if (!hasStoragePerm) {
  //   return { didCancel: false, errorCode: 'permission_denied', errorMessage: 'Storage permission denied.' };
  // }

  return new Promise(resolve => {
    RNLibraray({...defaultLibraryOptions, ...options}, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        resolve({didCancel: true});
      } else if (response.errorCode || response.errorMessage) {
        resolve({
          didCancel: false,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage,
        });
      } else {
        resolve({didCancel: false, assets: response.assets});
      }
    });
  });
};
