// __tests__/authSlice.test.ts
import authReducer, {
  initialState,
  loginUser,
  registerUser,
  fetchAndSetUserProfile,
  logoutUser,
  clearError,
  User,
  AuthState,
} from '../authSlice'; // Adjust path as necessary
import * as authService from '../../../services/authService'; // To mock service calls
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Mock authService
jest.mock('../../../services/authService');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthSlice', () => {
  describe('initialState', () => {
    it('should have the correct initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      const previousState: AuthState = { ...initialState, error: 'Some error' };
      expect(authReducer(previousState, clearError()).error).toBeNull();
    });
    // Add tests for setUserManually, setFirebaseUserManually if needed
  });

  describe('async thunks', () => {
    describe('loginUser', () => {
      it('should handle pending state', () => {
        const action = { type: loginUser.pending.type };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fulfilled state (without profile fetch yet)', () => {
        const mockFirebaseUser = { uid: 'test-uid' } as FirebaseAuthTypes.User;
        const action = { type: loginUser.fulfilled.type, payload: mockFirebaseUser };
        // Note: loginUser.fulfilled itself doesn't set isAuthenticated or user.
        // It dispatches fetchAndSetUserProfile which does that.
        // So, we test the direct effect of loginUser.fulfilled.
        const state = authReducer(initialState, action);
        expect(state.firebaseUser).toEqual(mockFirebaseUser);
        // isLoading might still be true if fetchAndSetUserProfile is pending, or false if it's synchronous for this test.
        // For this isolated test of loginUser, isLoading might be set to false if not for chained thunks.
        // However, the actual logic sets isLoading=true and relies on fetchAndSetUserProfile to set it to false.
        // For simplicity, we'll assume here it's just about setting firebaseUser.
      });

      it('should handle rejected state', () => {
        const action = { type: loginUser.rejected.type, payload: 'Login failed error' };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Login failed error');
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
      });
    });

    describe('registerUser', () => {
        it('should handle pending state', () => {
            const action = { type: registerUser.pending.type };
            const state = authReducer(initialState, action);
            expect(state.isLoading).toBe(true);
            expect(state.error).toBeNull();
        });
        // Similar tests for fulfilled and rejected as loginUser
    });

    describe('fetchAndSetUserProfile', () => {
      it('should handle pending state', () => {
        const action = { type: fetchAndSetUserProfile.pending.type };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fulfilled state with a complete profile', () => {
        const mockUserProfile: User = {
          id: 'test-uid',
          name: 'Test User',
          email: 'test@example.com',
          businessName: 'Test Biz',
          suitTypes: ['Mens Suit'], // Example of a field that makes profile "complete"
        };
        const action = { type: fetchAndSetUserProfile.fulfilled.type, payload: mockUserProfile };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.user).toEqual(mockUserProfile);
        expect(state.isAuthenticated).toBe(true);
        expect(state.isProfileComplete).toBe(true);
      });
      
      it('should handle fulfilled state with an incomplete profile', () => {
        const mockUserProfile: User = {
          id: 'test-uid',
          name: 'Test User', // Missing businessName and suitTypes for completeness
          email: 'test@example.com',
        };
        const action = { type: fetchAndSetUserProfile.fulfilled.type, payload: mockUserProfile };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.user).toEqual(mockUserProfile);
        expect(state.isAuthenticated).toBe(true); // Authenticated by Firebase, but profile not complete
        expect(state.isProfileComplete).toBe(false);
      });

      it('should handle rejected state', () => {
        const action = { type: fetchAndSetUserProfile.rejected.type, payload: 'Fetch profile failed' };
        const state = authReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Fetch profile failed');
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false); // If profile fetch fails, treat as not fully authenticated
        expect(state.isProfileComplete).toBe(false);
      });
    });
    
    describe('logoutUser', () => {
        it('should reset state on fulfilled logout', () => {
            const loggedInState: AuthState = {
                ...initialState,
                user: {id: 'test-uid', name: 'Test'},
                firebaseUser: {uid: 'test-uid'} as FirebaseAuthTypes.User,
                isAuthenticated: true,
                isProfileComplete: true,
            };
            const action = { type: logoutUser.fulfilled.type };
            const state = authReducer(loggedInState, action);
            expect(state).toEqual(initialState); // Should reset to initial state
        });
    });

    // Add placeholder tests for:
    // - sendPasswordResetEmail
    // - checkAuthState
    // - completeOnboarding (if this thunk has its own distinct state changes beyond calling updateUserProfile)
  });
});
