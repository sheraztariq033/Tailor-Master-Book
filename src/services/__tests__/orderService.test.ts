// __tests__/orderService.test.ts

// Mock Firebase modules
jest.mock('@react-native-firebase/functions', () => () => ({
  httpsCallable: jest.fn(() => jest.fn()), // Mock httpsCallable to return a mock function
}));

jest.mock('@react-native-firebase/storage', () => {
  const mockStorage = () => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(() => ({
        on: jest.fn((event, progressCb, errorCb, successCb) => {
          // Simulate success for testing
          if (event === 'state_changed' && successCb) {
            // @ts-ignore
            successCb({ state: 'success', bytesTransferred: 100, totalBytes: 100 });
          }
          return jest.fn(); // Unsubscribe function for .on()
        }),
        then: jest.fn(cb => cb()), // Simulate promise resolution for await task
        catch: jest.fn(),
      })),
      bucket: 'mock-bucket',
      fullPath: 'mock/path/image.jpg',
    })),
  });
  return mockStorage;
});


import * as orderService from '../orderService'; // Adjust path as necessary

describe('OrderService', () => {
  describe('callCreateOrder', () => {
    it('should call createOrder cloud function with order data and return result', async () => {
      const mockOrderData: orderService.CreateOrderPayload = {
        customerId: 'cust123',
        outfitType: 'Suit',
        measurementId: 'meas123',
        orderDate: new Date().toISOString(),
        deadlineDate: new Date().toISOString(),
        features: { fabric: 'Wool' },
        totalAmount: 5000,
        paidAmount: 1000,
      };
      const mockResponse = { success: true, orderId: 'order456' };
      const functionsMock = require('@react-native-firebase/functions');
      const mockCallable = jest.fn().mockResolvedValueOnce({ data: mockResponse });
      functionsMock().httpsCallable.mockReturnValueOnce(mockCallable);

      const result = await orderService.callCreateOrder(mockOrderData);
      expect(functionsMock().httpsCallable).toHaveBeenCalledWith('createOrder');
      expect(mockCallable).toHaveBeenCalledWith(mockOrderData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when calling createOrder', async () => {
      const functionsMock = require('@react-native-firebase/functions');
      const mockCallable = jest.fn().mockRejectedValueOnce(new Error('Create order failed'));
      functionsMock().httpsCallable.mockReturnValueOnce(mockCallable);

      await expect(orderService.callCreateOrder({} as any)).rejects.toThrow('Create order failed');
    });
  });

  describe('callListOrders', () => {
    it('should call listOrders cloud function and return orders', async () => {
      const mockOrders = [{ id: 'order1', outfitType: 'Shirt' }];
      const mockResponse = { success: true, orders: mockOrders };
      const functionsMock = require('@react-native-firebase/functions');
      const mockCallable = jest.fn().mockResolvedValueOnce({ data: mockResponse });
      functionsMock().httpsCallable.mockReturnValueOnce(mockCallable);

      const result = await orderService.callListOrders();
      expect(functionsMock().httpsCallable).toHaveBeenCalledWith('listOrders');
      expect(mockCallable).toHaveBeenCalledWith({}); // Called with empty filter
      expect(result.data).toEqual(mockResponse);
    });
  });
  
  describe('uploadOrderImage', () => {
    const storageMock = require('@react-native-firebase/storage');
    
    beforeEach(() => {
        // Reset mocks for each test if needed, though Jest usually does this for jest.fn()
        jest.clearAllMocks();
    });

    it('should upload an image and return its gs:// path', async () => {
      const putFileMock = jest.fn(() => ({
        on: jest.fn((event, progressCb, errorCb, successCb) => {
          if (event === 'state_changed' && successCb) {
            // @ts-ignore
            successCb({ state: 'success', bytesTransferred: 100, totalBytes: 100 });
          }
          return jest.fn(); 
        }),
        then: jest.fn(cb => cb()), 
        catch: jest.fn(),
      }));
      storageMock().ref.mockReturnValue({
        putFile: putFileMock,
        bucket: 'test-bucket',
        fullPath: 'user_uploads/uid1/order1/image.jpg',
      });
      
      const gsPath = await orderService.uploadOrderImage('uid1', 'order1', 'file:///local/image.jpg', 'image.jpg');
      expect(storageMock().ref).toHaveBeenCalledWith('user_uploads/uid1/order1/image.jpg');
      expect(putFileMock).toHaveBeenCalledWith('file:///local/image.jpg');
      expect(gsPath).toBe('gs://test-bucket/user_uploads/uid1/order1/image.jpg');
    });

    it('should throw an error if image URI is not a local file path', async () => {
        await expect(orderService.uploadOrderImage('uid1', 'order1', 'http://example.com/image.jpg', 'image.jpg'))
            .rejects.toThrow("Image URI must be a local file path (e.g., starts with 'file://').");
    });
  });

  // Add similar describe/it blocks for:
  // - callGetOrder
  // - callUpdateOrder
  // - callDeleteOrder
  // - callUpdateOrderStatus
  // - callGenerateShareableOrderToken
  // - callGetPublicOrderStatusByToken
});
