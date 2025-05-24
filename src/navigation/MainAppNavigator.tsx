import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainAppTabParamList} from './navigationTypes';

// Navigators for each tab
import CustomersNavigator from './CustomersNavigator';
import OrdersNavigator from './OrdersNavigator';
import InvoicesNavigator from './InvoicesNavigator';

// Navigators for each tab
import CustomersNavigator from './CustomersNavigator';
import OrdersNavigator from './OrdersNavigator';
import InvoicesNavigator from './InvoicesNavigator';
import SettingsNavigator from './SettingsNavigator'; // Import SettingsNavigator

// Placeholder Screens
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
// SettingsScreen is now the root of SettingsNavigator

// Import an icon library if available, or use Text for placeholders
// For example, using simple text as icons:
// const Icon = ({name, focused, color, size}: {name: string, focused: boolean, color: string, size: number}) => (
//   <Text style={{color: focused ? color : '#888', fontSize: 10}}>{name.substring(0,3).toUpperCase()}</Text>
// );

const Tab = createBottomTabNavigator<MainAppTabParamList>();

const MainAppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false, // Headers are handled by individual stack navigators
        // tabBarIcon: ({focused, color, size}) => {
        //   let iconName = 'ICON';
        //   if (route.name === 'DashboardTab') iconName = 'DASH';
        //   else if (route.name === 'CustomersTab') iconName = 'CUST';
        //   else if (route.name === 'OrdersTab') iconName = 'ORDR';
        //   else if (route.name === 'InvoicesTab') iconName = 'INV';
        //   else if (route.name === 'SettingsTab') iconName = 'SET';
        //   return <Icon name={iconName} focused={focused} color={color} size={size} />;
        // },
        tabBarActiveTintColor: '#007bff', // Example active color
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {paddingTop: 5, height: 60, paddingBottom:5}, // Basic styling
        tabBarLabelStyle: {fontSize: 12},
      })}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{title: 'Dashboard'}}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersNavigator}
        options={{title: 'Customers'}}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersNavigator}
        options={{title: 'Orders'}}
      />
      <Tab.Screen
        name="InvoicesTab"
        component={InvoicesNavigator}
        options={{title: 'Invoices'}}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator} // Use SettingsNavigator here
        options={{title: 'Settings'}} // Title can be translated if needed
      />
    </Tab.Navigator>
  );
};

export default MainAppNavigator;
