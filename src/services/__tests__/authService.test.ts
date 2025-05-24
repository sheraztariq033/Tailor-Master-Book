// __tests__/authService.test.ts

// Mock Firebase modules
jest.mock('@react-native-firebase/auth', () => {
  const mockAuth = () => ({
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    currentUser: null, // Default, can be overridden in tests
  });
  // @ts-ignore
  mockAuth.FirebaseAuthTypes = {
    UserCredential: jest.fn(), // If you need to mock this type
  };
  return mockAuth;
});

jest.mock('@react-native-firebase/functions', () => () => ({
  httpsCallable: jest.fn(() => jest.fn()), // Mock httpsCallable to return a mock function
}));

import * as authService from '../authService'; // Adjust path as necessary

describe('AuthService', () => {
  describe('signInWithEmail', () => {
    it('should sign in with correct credentials and return user object', async () => {
      // Mock implementation for successful sign-in
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const authMock = require('@react-native-firebase/auth');
      authMock().signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const user = await authService.signInWithEmail('test@example.com', 'password123');
      expect(user).toEqual(mockUser);
      expect(authMock().signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should fail with incorrect credentials and throw error', async () => {
      const authMock = require('@react-native-firebase/auth');
      authMock().signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(authService.signInWithEmail('wrong@example.com', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('createUserWithEmail', () => {
    it('should create a user with email and password and return user object', async () => {
        const mockUser = { uid: 'new-uid', email: 'new@example.com' };
        const authMock = require('@react-native-firebase/auth');
        authMock().createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

        const user = await authService.createUserWithEmail('new@example.com', 'newpassword123');
        expect(user).toEqual(mockUser);
        expect(authMock().createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'newpassword123');
    });

    it('should fail if email is already in use and throw error', async () => {
        const authMock = require('@react-native-firebase/auth');
        authMock().createUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
        
        await expect(authService.createUserWithEmail('test@example.com', 'password123')).rejects.toMatchObject({
            code: 'auth/email-already-in-use'
        });
    });
  });

  describe('signOutUser', () => {
    it('should sign out the current user', async () => {
        const authMock = require('@react-native-firebase/auth');
        authMock().signOut.mockResolvedValueOnce(undefined); // signOut resolves to void/undefined

        await authService.signOutUser();
        expect(authMock().signOut).toHaveBeenCalled();
    });

    it('should handle errors during sign out', async () => {
        const authMock = require('@react-native-firebase/auth');
        authMock().signOut.mockRejectedValueOnce(new Error('Sign out failed'));

        await expect(authService.signOutUser()).rejects.toThrow('Sign out failed');
    });
  });

  describe('sendFirebasePasswordResetEmail', () => {
    it('should send a password reset email', async () => {
        const authMock = require('@react-native-firebase/auth');
        authMock().sendPasswordResetEmail.mockResolvedValueOnce(undefined);

        await authService.sendFirebasePasswordResetEmail('test@example.com');
        expect(authMock().sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
    });

     it('should fail if email is not found and throw error', async () => {
        const authMock = require('@react-native-firebase/auth');
        authMock().sendPasswordResetEmail.mockRejectedValueOnce({ code: 'auth/user-not-found' });
        
        await expect(authService.sendFirebasePasswordResetEmail('nonexistent@example.com')).rejects.toMatchObject({
            code: 'auth/user-not-found'
        });
    });
  });

  describe('callGetUserProfile (Cloud Function)', () => {
    it('should call getUserProfile cloud function and return profile data', async () => {
        const mockProfile = { uid: 'test-uid', name: 'Test User', businessName: 'Test Business' };
        const functionsMock = require('@react-native-firebase/functions');
        const mockCallable = jest.fn().mockResolvedValueOnce({ data: { success: true, profile: mockProfile } });
        functionsMock().httpsCallable.mockReturnValueOnce(mockCallable);

        const result = await authService.callGetUserProfile();
        expect(functionsMock().httpsCallable).toHaveBeenCalledWith('getUserProfile');
        expect(mockCallable).toHaveBeenCalled();
        expect(result.data).toEqual({ success: true, profile: mockProfile });
    });

    it('should handle errors when calling getUserProfile cloud function', async () => {
        const functionsMock = require('@react-native-firebase/functions');
        const mockCallable = jest.fn().mockRejectedValueOnce(new Error('Cloud function error'));
        functionsMock().httpsCallable.mockReturnValueOnce(mockCallable);

        await expect(authService.callGetUserProfile()).rejects.toThrow('Cloud function error');
    });
  });
  
  // Add similar describe/it blocks for:
  // - onFirebaseAuthStateChanged (more complex to test, might involve mocking its callback behavior)
  // - getCurrentFirebaseUser
  // - callUpdateUserProfile
});
