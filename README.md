# Darzi Book - Firebase Backend Setup (darzi-book-mobile-app)

This document outlines the setup of the core Firebase backend for the Darzi Book React Native application. Since direct Firebase console access is not available in this environment, the setup is simulated through configuration files and this documentation.

## 1. Firebase Project Setup

*   **Project Name:** `darzi-book-mobile-app` (Simulated)
*   **Region:** `us-central` (Assumed)
*   **Confirmation:** Project creation is simulated. The details are noted in `firebase-config.json`.

## 2. Enable & Configure Firestore

*   **Status:** Enabled in Native Mode (Simulated).
*   **Collections & Placeholder Documents:**
    *   `users`: Placeholder document in `users-placeholder.json`.
    *   `customers`: Placeholder document in `customers-placeholder.json`.
    *   `measurements`: Placeholder document in `measurements-placeholder.json`.
    *   `measurementTemplates`:
        *   System template placeholder in `measurementTemplates-system-placeholder.json`.
        *   Custom template placeholder in `measurementTemplates-custom-placeholder.json`.
    *   `orders`: Placeholder document in `orders-placeholder.json`.
    *   `invoices`: Placeholder document in `invoices-placeholder.json`.
    *   The structure of these placeholders aligns with the specified interface fields.
    *   These collections are also listed in `firebase-config.json` under the `firestore.collections` key.

## 3. Enable & Configure Firebase Authentication

*   **Email/Password Sign-in Provider:** Enabled (Simulated).
*   **Phone Number Sign-in Provider:** Enabled (Simulated).
*   **Confirmation:** These settings are noted as `true` in `firebase-config.json` under the `auth` key.

## 4. Enable Firebase Storage

*   **Status:** Enabled (Simulated).
*   **Folder Structure (Defined):**
    *   `/user_uploads/{userId}/order_images/`
    *   `/data_exports/{userId}/`
*   **Confirmation:** This is noted in `firebase-config.json` under the `storage` key.

## 5. Firestore Security Rules

*   The Firestore security rules have been defined and saved in the `firestore.rules` file. The content is as follows:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Tailor can CRUD their own associated data
    function isOwner(tailorId) {
      return request.auth != null && request.auth.uid == tailorId;
    }

    match /customers/{customerId} {
      allow read, write, delete: if isOwner(resource.data.tailorId);
      allow create: if isOwner(request.resource.data.tailorId); // Check on create
    }
    match /measurements/{measurementId} {
      allow read, write, delete: if isOwner(resource.data.tailorId);
      allow create: if isOwner(request.resource.data.tailorId);
    }
    match /orders/{orderId} {
      allow read, write, delete: if isOwner(resource.data.tailorId);
      allow create: if isOwner(request.resource.data.tailorId);
    }
    match /invoices/{invoiceId} {
      allow read, write, delete: if isOwner(resource.data.tailorId);
      allow create: if isOwner(request.resource.data.tailorId);
    }

    // Measurement Templates: System templates are readable by any authenticated user.
    // Custom templates are CRUD by owner.
    match /measurementTemplates/{templateId} {
      allow read: if request.auth != null && (resource.data.isSystem == true || isOwner(resource.data.userId));
      allow create: if request.auth != null && request.resource.data.isSystem == false && isOwner(request.resource.data.userId);
      allow update, delete: if request.auth != null && resource.data.isSystem == false && isOwner(resource.data.userId);
    }

    // (Placeholder for Customer Portal access if implemented)
    // match /orders/{orderId} {
    //   allow get: if request.auth != null && request.auth.token.isCustomer == true && resource.data.customerId == request.auth.token.customerId;
    // }

    // Default deny all other access - BE CAREFUL WITH THIS IN DEVELOPMENT if collections are not perfectly secured above
    // match /{document=**} {
    //  allow read, write: if false;
    // }
  }
}
```

## 6. Firebase Storage Security Rules

*   The Firebase Storage security rules have been defined and saved in the `storage.rules` file. The content is as follows:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to R/W to their own 'user_uploads' folder.
    match /user_uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Allow users to R/W to their own 'data_exports' folder.
    match /data_exports/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Deny all other access by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 7. Project ID and Configuration Details

*   **Firebase Project ID:** `darzi-book-mobile-app`
*   **Web App Configuration (Mock - from `firebase-config.json`):**
    ```json
    {
      "apiKey": "AIzaSyYOUR_API_KEY",
      "authDomain": "darzi-book-mobile-app.firebaseapp.com",
      "projectId": "darzi-book-mobile-app",
      "storageBucket": "darzi-book-mobile-app.appspot.com",
      "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
      "appId": "YOUR_APP_ID",
      "measurementId": "YOUR_MEASUREMENT_ID"
    }
    ```
*   All configuration details are stored in `firebase-config.json`.

This setup provides the foundational backend structure for the Darzi Book application. Next steps would involve integrating a Firebase SDK into the application code to interact with these services. The `tailorId` and `userId` fields mentioned in the security rules and placeholder documents will need to be programmatically added when creating documents in these collections to ensure the rules work as intended.
The commented-out default deny rule in `firestore.rules` (`// match /{document=**}`) is a safety measure. It's recommended to uncomment it once all collection-specific rules are thoroughly tested to prevent unintended data access.
The write rule for system `measurementTemplates` is effectively `false` as `isSystem` cannot be true and `userId` must be the owner for creation/updates, which is suitable for system-managed templates.
```
