// Defines the types for route params for each navigator.

// For the Auth stack
export type AuthStackParamList = {
  Login: undefined; // No params for LoginScreen
  Register: undefined;
  ForgotPassword: undefined;
};

// For the Onboarding stack
export type OnboardingStackParamList = {
  ProfileSetup: undefined;
  BusinessType: undefined;
  TemplateSelection: undefined;
};

// For the Main App Bottom Tab Navigator
export type MainAppTabParamList = {
  DashboardTab: undefined; // Or specific params if DashboardScreen takes them
  CustomersTab: {screen: 'CustomerList'; params?: {refresh?: boolean}}; // Example of nesting a stack and passing params
  OrdersTab: {screen: 'OrderList'; params?: {filter?: string; refresh?: boolean}}; // Added refresh
  InvoicesTab: {screen: 'InvoiceList'; params?: {refresh?: boolean}}; // Added refresh
  SettingsTab: {screen: 'SettingsHome'}; // Point to the entry screen of SettingsNavigator
};

// For Settings Stack (nested in MainAppTabParamList)
export type SettingsStackParamList = {
  SettingsHome: undefined; // The main SettingsScreen.tsx
  ManageMeasurementTemplates: {refresh?: boolean} | undefined;
  AddEditMeasurementTemplate: { templateId?: string };
  // Add other settings-related screens here, e.g., ProfileEdit, AccountSettings
};

// For the Customers stack (nested in MainAppTabParamList)
export type CustomersStackParamList = {
  CustomerList: {refresh?: boolean} | undefined;
  CustomerDetail: {customerId: string};
  AddEditCustomer: {customerId?: string}; // Optional customerId for editing
  AddEditMeasurement: {
    customerId: string;
    measurementId?: string; // For editing existing measurement
    // measurementData?: Partial<import('../store/slices/measurementSlice').Measurement>; // Could pass initial data for edit
  };
};

// For the Orders stack (nested in MainAppTabParamList)
export type OrdersStackParamList = {
  OrderList: {filter?: string; refresh?: boolean} | undefined; // Added refresh
  OrderDetail: {orderId: string};
  AddEditOrder: {
    orderId?: string; // For editing existing order
    customerId?: string; // For pre-selecting customer in "Add" mode if coming from customer detail
  };
};

// For the Invoices stack (nested in MainAppTabParamList)
export type InvoicesStackParamList = {
  InvoiceList: {refresh?: boolean} | undefined; // Added refresh from a previous similar task
  InvoiceDetail: {invoiceId: string};
  ReceiptView: {receiptData: import('../store/slices/invoiceSlice').ReceiptData}; // Added from a previous similar task
  FinancialReport: undefined; // Added for Financial Report screen
  // AddEditInvoice might not be common, usually generated from orders
};

// For the Root Stack (combining Auth, Onboarding, and Main App)
export type RootStackParamList = {
  Auth: undefined; // Points to the AuthStack
  Onboarding: undefined; // Points to the OnboardingStack
  MainApp: undefined; // Points to the MainAppTabNavigator
  PublicOrderTrackingModal: undefined; // New modal stack for public tracking
};

// For Public Order Tracking Stack
export type PublicOrderTrackingStackParamList = {
  EnterOrderToken: undefined;
  PublicOrderDetail: { token: string }; // Pass token to fetch details or display
};


// Props for screen components to get navigation and route
// You can use these with useNavigation and useRoute hooks from @react-navigation/native
// Example for a screen in AuthStack:
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
// const LoginScreen: React.FC<Props> = ({ navigation, route }) => { ... };

// Example for a screen in CustomersStack:
// import { CompositeScreenProps } from '@react-navigation/native';
// import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
//
// type Props = CompositeScreenProps<
//   NativeStackScreenProps<CustomersStackParamList, 'CustomerDetail'>,
//   CompositeScreenProps<
//     BottomTabScreenProps<MainAppTabParamList, 'CustomersTab'>,
//     NativeStackScreenProps<RootStackParamList>
//   >
// >;
// const CustomerDetailScreen: React.FC<Props> = ({ navigation, route }) => { ... };
