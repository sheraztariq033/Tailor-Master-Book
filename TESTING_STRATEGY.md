# Darzi Book App - Testing Strategy

## 1. Introduction

This document outlines the testing strategy for the Darzi Book mobile application. The primary goal of testing is to ensure the application is reliable, functional, and provides a good user experience. This strategy covers various types of testing, tools to be used, and key areas of focus.

**Tools:**
*   **Jest:** For unit and integration testing of JavaScript code (services, Redux slices, utility functions, components).
*   **React Native Testing Library (`@testing-library/react-native`):** For component and integration testing, focusing on user interactions and rendered output.
*   **Detox (Conceptual):** For End-to-End (E2E) testing, simulating real user scenarios on actual devices or emulators/simulators.
*   **Platform-Specific Profilers:** Xcode Instruments and Android Profiler for performance testing.
*   **Manual Testing:** For exploratory testing and verifying user flows that are complex to automate.

## 2. Types of Testing

### 2.1. Unit Testing

*   **Scope:** Individual functions, utility modules, Redux reducers, actions, thunks, and service methods. The smallest testable parts of the application.
*   **Tools:** Jest.
*   **Focus:**
    *   Isolate units of code by mocking dependencies (e.g., Firebase SDK calls, other services).
    *   Test business logic, different code paths, return values, and error handling.
    *   Verify edge cases and boundary conditions.
*   **Examples:**
    *   `src/utils/dateUtils.ts`: Test date formatting functions with various inputs.
    *   `src/utils/currencyUtils.ts`: Test currency formatting.
    *   `src/utils/validationUtils.ts`: Test validation functions (email, phone, required fields).
    *   `src/services/authService.ts`: Mock Firebase Auth/Functions to test login, registration, profile fetching logic.
    *   `src/store/slices/authSlice.ts`: Test reducers for correct state changes based on actions. Test async thunks by mocking service calls and verifying dispatched actions and resulting state (pending, fulfilled, rejected).
    *   Similar tests for `customerSlice.ts`, `orderSlice.ts`, `measurementSlice.ts`, `invoiceSlice.ts`, `dataSlice.ts` and their corresponding services.

### 2.2. Component Testing

*   **Scope:** Individual React Native components in isolation or with minimal, controlled props.
*   **Tools:** Jest with React Native Testing Library (`@testing-library/react-native`).
*   **Focus:**
    *   Render components with various props.
    *   Simulate user interactions (e.g., pressing buttons, typing into inputs).
    *   Assert that the component renders correctly based on props and state.
    *   Check that callbacks are invoked as expected.
    *   Test accessibility props (e.g., `accessibilityLabel`).
*   **Examples:**
    *   `src/components/ui/Button.tsx`: Test rendering with different variants, disabled state, onPress callback.
    *   `src/components/ui/Input.tsx`: Test value changes, error display, label rendering.
    *   `src/components/specific/customers/CustomerListItem.tsx`: Test rendering with different customer data.
    *   `src/components/specific/orders/OrderForm.tsx`: Test form field rendering, basic input changes (more complex validation tested at integration level).

### 2.3. Integration Testing

*   **Scope:** Testing the interaction between multiple components, screens, Redux store, and services (with mocked backend calls).
*   **Tools:** Jest with React Native Testing Library.
*   **Focus:**
    *   Verify user flows within a portion of the app.
    *   Ensure components correctly interact with the Redux store (dispatching actions, selecting state).
    *   Test navigation between related screens.
    *   Mock service calls to simulate backend responses and test how the UI reacts.
*   **Examples:**
    *   **Login Flow:**
        1.  Render `LoginScreen`.
        2.  User types credentials into `Input` components.
        3.  User presses the "Login" `Button`.
        4.  Verify `loginUser` thunk is dispatched.
        5.  Mock successful/failed login response from `authService`.
        6.  Check if Redux state (`authSlice`) is updated correctly (e.g., `isAuthenticated`, `user`, `error`).
        7.  Verify navigation to `DashboardScreen` or `OnboardingScreen` on success, or error display on failure.
    *   **Add Customer Flow:**
        1.  Render `CustomerListScreen`, press "Add Customer" FAB.
        2.  Verify navigation to `AddEditCustomerScreen`.
        3.  Fill `CustomerForm` inputs.
        4.  Press "Save Customer" button.
        5.  Verify `addNewCustomer` thunk is dispatched.
        6.  Mock successful response.
        7.  Verify Redux state update and navigation back to `CustomerListScreen` (with refresh).
    *   Similar integration tests for other CRUD operations (Orders, Measurements, Invoices, Templates).

### 2.4. End-to-End (E2E) Testing (Conceptual)

*   **Scope:** Testing the entire application flow from a user's perspective, ideally against a staging or test backend.
*   **Tools:** Detox (a common choice for React Native E2E testing).
*   **Focus:**
    *   Simulate real user scenarios across multiple screens and features.
    *   Verify data consistency and flow through the application.
    *   Test critical paths and core functionalities.
*   **Examples:**
    1.  Complete User Registration -> Onboarding -> Add a Customer -> Create an Order -> Generate an Invoice.
    2.  Login -> View Dashboard -> Navigate to Orders -> Filter Orders -> View Order Detail -> Change Order Status.
    3.  Login -> Settings -> Update Profile -> Manage Measurement Templates (CRUD).
    4.  Login -> Order Detail -> Generate Shareable Token -> (Simulate opening link) -> Enter Token -> View Public Order Status.

## 3. Key User Flows for Manual Testing

While automation is key, manual testing remains crucial for exploratory testing and verifying complex user flows. Critical paths include:

1.  **User Authentication & Onboarding:**
    *   Registration (Email/Password) -> Onboarding (Profile, Business Type, Template Selection) -> Main App.
    *   Login (Email/Password) -> Main App / Onboarding (if incomplete).
    *   Password Reset flow.
2.  **Dashboard Navigation:**
    *   View Dashboard stats -> Navigate to Recent Orders/Upcoming Deadlines details.
    *   Navigate to different tabs (Customers, Orders, Invoices, Settings).
3.  **Customer Management (CRUD):**
    *   Add a new customer.
    *   View customer list (with search/filter if implemented).
    *   View customer details.
    *   Edit an existing customer.
    *   Delete a customer (with confirmation).
4.  **Measurement Management (CRUD - via Customer Detail):**
    *   Add new measurements for a customer.
    *   View existing measurements.
    *   Edit existing measurements.
    *   Delete measurements.
5.  **Order Management (CRUD):**
    *   Add a new order (selecting customer, measurements, adding images, details).
    *   View order list (with status filters).
    *   View order details (including images, customer/measurement links).
    *   Change order status.
    *   Edit an existing order.
    *   Delete an order (with confirmation).
6.  **Invoice Management:**
    *   Generate an invoice from an order (conceptual, assuming UI will be built).
    *   View invoice list (with status filters).
    *   View invoice details.
    *   Update payment status for an invoice.
    *   View/Share invoice receipt.
7.  **Settings & Profile Management:**
    *   Update user profile information (name, business name, phone).
    *   Change app language and theme.
    *   Manage custom Measurement Templates (CRUD).
    *   Data Management:
        *   Initiate and verify manual backup.
        *   Export data (e.g., customers to CSV/JSON).
        *   Import data (e.g., customers from JSON - with mocked file).
    *   Logout.
8.  **Public Order Tracking:**
    *   Tailor: Generate a shareable token/link from `OrderDetailScreen`. Copy/Share functionality.
    *   Customer: Access "Track Order" from `LoginScreen`. Enter token on `EnterOrderTokenScreen`. View order status on `PublicOrderDetailScreen`. Test invalid/expired tokens.

## 4. Performance Testing

*   **Focus Areas:**
    *   **List Rendering:** Performance of `FlatList` components with a large number of items (Customers, Orders, Invoices, Templates). Check for smooth scrolling and quick rendering.
    *   **App Startup Time:** Time taken for the app to launch and become interactive.
    *   **Screen Navigation Speed:** Responsiveness when navigating between different screens.
    *   **Image Loading:** Performance of loading and displaying images (especially in lists and detail views).
    *   **Data Fetching:** Time taken to load data from the backend (simulated or real).
*   **Tools:**
    *   React Native Perf Monitor (`react-native-performance-monitor`).
    *   Flipper (React Native's default debugger) for performance inspection.
    *   Platform-specific profilers: Xcode Instruments (for iOS), Android Profiler (for Android).
    *   Manual observation on various devices.

## 5. Accessibility Testing (Conceptual)

*   **Focus Areas:**
    *   Ensure the app is usable by people with disabilities.
    *   Screen reader compatibility (VoiceOver on iOS, TalkBack on Android): Check for proper labeling of UI elements, logical navigation order.
    *   Sufficient color contrast for text and UI elements.
    *   Adequate touch target sizes.
    *   Keyboard accessibility (if applicable, e.g., for forms on devices with physical keyboards or accessibility services).
*   **Tools:**
    *   Platform accessibility inspectors (Accessibility Inspector in Xcode, Accessibility Scanner for Android).
    *   Manual testing with VoiceOver/TalkBack enabled.
    *   Color contrast checking tools.

## 6. Cross-Platform & Device Testing

*   Test the application on a range of physical devices and emulators/simulators for both iOS and Android.
*   Cover different screen sizes, resolutions, and OS versions.
*   Check for platform-specific UI inconsistencies or bugs.

## 7. Test Environment & Data

*   **Development:** Use mocked data and services for unit and component tests.
*   **Integration/E2E:** Ideally, use a dedicated test/staging Firebase backend with pre-populated test data to ensure consistency and avoid polluting production data.
*   Ensure test data covers various scenarios (empty states, large data sets, edge cases).

This testing strategy aims to build a high-quality, robust, and user-friendly Darzi Book application. It will be an iterative process, with test cases and focus areas evolving alongside application development.
