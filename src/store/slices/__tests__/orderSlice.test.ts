// __tests__/orderSlice.test.ts
import orderReducer, {
  initialState,
  fetchOrders,
  addNewOrder,
  fetchOrderDetails,
  Order,
  OrderState,
  PublicOrderDetails,
} from '../orderSlice'; // Adjust path as necessary
import * as orderService from '../../../services/orderService'; // To mock service calls

// Mock orderService
jest.mock('../../../services/orderService');
const mockedOrderService = orderService as jest.Mocked<typeof orderService>;

describe('OrderSlice', () => {
  describe('initialState', () => {
    it('should have the correct initial state', () => {
      expect(orderReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    // Example for a simple reducer, if you add more
    it('should handle clearOrderError', () => {
      const previousState: OrderState = { ...initialState, error: 'Some error' };
      expect(orderReducer(previousState, {type: 'order/clearOrderError'}).error).toBeNull();
    });
    it('should handle clearShareableToken', () => {
        const previousState: OrderState = { ...initialState, shareableOrderToken: 'test-token', isLoadingShareToken: true };
        const nextState = orderReducer(previousState, {type: 'order/clearShareableToken'});
        expect(nextState.shareableOrderToken).toBeNull();
        expect(nextState.isLoadingShareToken).toBe(false);
        expect(nextState.shareError).toBeNull();
    });
  });

  describe('async thunks', () => {
    describe('fetchOrders', () => {
      it('should handle pending state', () => {
        const action = { type: fetchOrders.pending.type };
        const state = orderReducer(initialState, action);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fulfilled state', () => {
        const mockOrders: Order[] = [
          { id: '1', customerId: 'c1', tailorId: 't1', outfitType: 'Suit', measurementId: 'm1', orderDate: new Date().toISOString(), deadlineDate: new Date().toISOString(), status: 'received', features: {}, totalAmount: 100, paidAmount: 0, createdAt: new Date().toISOString() },
        ];
        const action = { type: fetchOrders.fulfilled.type, payload: mockOrders };
        const state = orderReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.orders).toEqual(mockOrders);
      });

      it('should handle rejected state', () => {
        const action = { type: fetchOrders.rejected.type, payload: 'Fetch orders failed' };
        const state = orderReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Fetch orders failed');
      });
    });

    describe('addNewOrder', () => {
      // Test pending, fulfilled, rejected for addNewOrder
      // Remember addNewOrder thunk dispatches fetchOrders on success, so test the final state accordingly
      // or mock the dispatch of fetchOrders if testing in isolation.
      it('should set isLoading to true on pending', () => {
        const action = { type: addNewOrder.pending.type };
        const state = orderReducer(initialState, action);
        expect(state.isLoading).toBe(true); // general isLoading
        expect(state.isUploadingImages).toBe(true); // Specific to this thunk
        expect(state.error).toBeNull();
      });
      
       it('should set isLoading to false on fulfilled (list is refetched)', () => {
        const action = { type: addNewOrder.fulfilled.type, payload: 'newOrderId' }; // Payload is orderId
        const state = orderReducer(initialState, action);
        expect(state.isLoading).toBe(false);
        // The actual list update happens via fetchOrders thunk, not directly here
      });
    });
    
    describe('fetchOrderDetails', () => {
        it('should set selectedOrder on fulfilled', () => {
            const mockOrder: Order = { id: '1', customerId: 'c1', tailorId: 't1', outfitType: 'Suit', measurementId: 'm1', orderDate: new Date().toISOString(), deadlineDate: new Date().toISOString(), status: 'received', features: {}, totalAmount: 100, paidAmount: 0, createdAt: new Date().toISOString() };
            const action = { type: fetchOrderDetails.fulfilled.type, payload: mockOrder };
            const state = orderReducer(initialState, action);
            expect(state.isLoading).toBe(false);
            expect(state.selectedOrder).toEqual(mockOrder);
            // Also check if it updates the list
            expect(state.orders.find(o => o.id === mockOrder.id)).toEqual(mockOrder);
        });
    });

    describe('generateTokenForOrder', () => {
        it('should set shareableOrderToken on fulfilled', () => {
            const mockToken = 'xyz123abc';
            const action = { type: 'order/generateTokenForOrder/fulfilled', payload: mockToken };
            const state = orderReducer(initialState, action);
            expect(state.isLoadingShareToken).toBe(false);
            expect(state.shareableOrderToken).toBe(mockToken);
        });
         it('should set shareError on rejected', () => {
            const action = { type: 'order/generateTokenForOrder/rejected', payload: 'Token generation failed' };
            const state = orderReducer(initialState, action);
            expect(state.isLoadingShareToken).toBe(false);
            expect(state.shareError).toBe('Token generation failed');
        });
    });

    describe('fetchPublicOrder', () => {
        it('should set publicOrderStatus on fulfilled', () => {
            const mockPublicOrder: PublicOrderDetails = { orderId: 'maskedId', outfitType: 'Test', status: 'ready', deadlineDate: new Date().toISOString(), orderDate: new Date().toISOString() };
            const action = { type: 'order/fetchPublicOrder/fulfilled', payload: mockPublicOrder };
            const state = orderReducer(initialState, action);
            expect(state.isLoadingPublicOrder).toBe(false);
            expect(state.publicOrderStatus).toEqual(mockPublicOrder);
        });
    });


    // Add placeholder tests for:
    // - updateExistingOrder
    // - removeOrder
    // - changeOrderStatus
  });
});
