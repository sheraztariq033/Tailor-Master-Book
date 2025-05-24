import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OrdersStackParamList} from './navigationTypes';

// Placeholder Screens - these would be in src/screens/Orders/
import OrderListScreen from '../screens/Orders/OrderListScreen';
import OrderDetailScreen from '../screens/Orders/OrderDetailScreen';
import AddEditOrderScreen from '../screens/Orders/AddEditOrderScreen';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

const OrdersNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="OrderList" screenOptions={{headerShown: true}}>
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{title: 'Orders'}}/>
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{title: 'Order Details'}}/>
      <Stack.Screen name="AddEditOrder" component={AddEditOrderScreen} options={{title: 'Add/Edit Order'}}/>
    </Stack.Navigator>
  );
};

export default OrdersNavigator;
