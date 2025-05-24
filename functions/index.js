// Cloud Functions for Darzi Book Mobile App

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

// --- User Management Functions ---

/**
 * Triggered when a new Firebase Auth user is created.
 * Creates a corresponding user document in the 'users' Firestore collection.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  functions.logger.info(`New user created: UID: ${user.uid}, Email: ${user.email}`);
  try {
    const userRef = db.collection("users").doc(user.uid);
    const newUserDocument = {
      uid: user.uid,
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      name: "New User", // Default value
      businessName: "",
      suitTypes: [],
      language: "en",
      theme: "light",
      isPremium: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await userRef.set(newUserDocument);
    functions.logger.info(`User document created for UID: ${user.uid}`);
    return null;
  } catch (error) {
    functions.logger.error(`Error creating user document for UID: ${user.uid}`, error);
    // We don't re-throw as it might cause a loop or hide the auth error.
    // Log the error thoroughly.
    return null;
  }
});

// --- Measurement Template Management Functions ---

/**
 * HTTPS Callable: Creates a new measurement template for the authenticated user.
 * Input: data (object: { name, outfitType, defaultValues (object) })
 */
exports.createMeasurementTemplate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = context.auth.uid;
  const { name, outfitType, defaultValues } = data;

  if (!name || !outfitType || !defaultValues) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: name, outfitType, and defaultValues."
    );
  }

  const newTemplate = {
    userId: userId,
    name: name,
    outfitType: outfitType,
    defaultValues: defaultValues, // e.g., { chest: null, waist: 30 }
    isSystem: false, // User-created templates are not system templates
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const templateRef = await db.collection("measurementTemplates").add(newTemplate);
    functions.logger.info(`New measurement template created by UID: ${userId}, TemplateID: ${templateRef.id}`);
    return { success: true, templateId: templateRef.id };
  } catch (error) {
    functions.logger.error(`Error creating measurement template for UID: ${userId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to create measurement template.");
  }
});

/**
 * HTTPS Callable: Retrieves a specific measurement template.
 * Input: data (object: { templateId: string })
 */
exports.getMeasurementTemplate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = context.auth.uid;
  const templateId = data.templateId;

  if (!templateId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing templateId.");
  }

  try {
    const templateRef = db.collection("measurementTemplates").doc(templateId);
    const doc = await templateRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Measurement template not found.");
    }

    const templateData = doc.data();
    // Allow access if it's a system template OR if the user is the owner
    if (templateData.isSystem === true || templateData.userId === userId) {
      functions.logger.info(`Measurement template retrieved by UID: ${userId}, TemplateID: ${templateId}`);
      return { success: true, template: { id: doc.id, ...templateData } };
    } else {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to access this template."
      );
    }
  } catch (error) {
    functions.logger.error(`Error retrieving template ${templateId} for UID: ${userId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to retrieve measurement template.");
  }
});

/**
 * HTTPS Callable: Updates a specific custom measurement template.
 * Input: data (object: { templateId: string, updateData: object })
 */
exports.updateMeasurementTemplate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = context.auth.uid;
  const templateId = data.templateId;
  const templateUpdateData = data.updateData;

  if (!templateId || !templateUpdateData) {
    throw new functions.https.HttpsError("invalid-argument", "Missing templateId or updateData.");
  }

  // Prevent changing key identifiers or system status
  if (templateUpdateData.userId) delete templateUpdateData.userId;
  if (templateUpdateData.isSystem) delete templateUpdateData.isSystem;
  if (templateUpdateData.createdAt) delete templateUpdateData.createdAt;


  if (Object.keys(templateUpdateData).length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No valid fields to update.");
  }
  
  templateUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  try {
    const templateRef = db.collection("measurementTemplates").doc(templateId);
    const doc = await templateRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Measurement template not found.");
    }
    const templateData = doc.data();
    if (templateData.isSystem === true || templateData.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this template. It is a system template or not yours."
      );
    }

    await templateRef.update(templateUpdateData);
    functions.logger.info(`Measurement template updated by UID: ${userId}, TemplateID: ${templateId}`, templateUpdateData);
    return { success: true, message: "Measurement template updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating template ${templateId} for UID: ${userId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update measurement template.");
  }
});

/**
 * HTTPS Callable: Deletes a specific custom measurement template.
 * Input: data (object: { templateId: string })
 */
exports.deleteMeasurementTemplate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = context.auth.uid;
  const templateId = data.templateId;

  if (!templateId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing templateId.");
  }

  try {
    const templateRef = db.collection("measurementTemplates").doc(templateId);
    const doc = await templateRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Measurement template not found.");
    }
    const templateData = doc.data();
    if (templateData.isSystem === true || templateData.userId !== userId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to delete this template. It is a system template or not yours."
      );
    }

    await templateRef.delete();
    functions.logger.info(`Measurement template deleted by UID: ${userId}, TemplateID: ${templateId}`);
    return { success: true, message: "Measurement template deleted successfully." };
  } catch (error) {
    functions.logger.error(`Error deleting template ${templateId} for UID: ${userId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to delete measurement template.");
  }
});

/**
 * HTTPS Callable: Lists measurement templates (system + user's custom).
 * Input: data (object: optional { outfitType: string })
 */
exports.listMeasurementTemplates = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = context.auth.uid;
  const outfitTypeFilter = data ? data.outfitType : null;

  try {
    const templates = [];
    
    // Query for system templates
    let systemQuery = db.collection("measurementTemplates").where("isSystem", "==", true);
    if (outfitTypeFilter) {
      systemQuery = systemQuery.where("outfitType", "==", outfitTypeFilter);
    }
    const systemSnapshot = await systemQuery.get();
    systemSnapshot.forEach(doc => {
      templates.push({ id: doc.id, ...doc.data() });
    });

    // Query for user's custom templates
    let userQuery = db.collection("measurementTemplates")
      .where("userId", "==", userId)
      .where("isSystem", "==", false); // Explicitly state false
    if (outfitTypeFilter) {
      userQuery = userQuery.where("outfitType", "==", outfitTypeFilter);
    }
    const userSnapshot = await userQuery.orderBy("createdAt", "desc").get();
    userSnapshot.forEach(doc => {
      // Avoid adding duplicates if a user somehow had a system template ID as their own
      if (!templates.find(t => t.id === doc.id)) {
        templates.push({ id: doc.id, ...doc.data() });
      }
    });
    
    functions.logger.info(`Measurement templates listed for UID: ${userId}, Count: ${templates.length}`);
    return { success: true, templates: templates };
  } catch (error) {
    functions.logger.error(`Error listing measurement templates for UID: ${userId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to list measurement templates.");
  }
});

// --- Order Management Functions ---

/**
 * HTTPS Callable: Creates a new order for the authenticated tailor.
 * Input: data (object with Order fields: customerId, outfitType, measurementId, orderDate, deadlineDate, 
 *               features (object), notes?, totalAmount, paidAmount, images (array of strings)?)
 */
exports.createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { 
    customerId, outfitType, measurementId, orderDate, deadlineDate, 
    features, notes, totalAmount, paidAmount, images 
  } = data;

  if (!customerId || !outfitType || !measurementId || !orderDate || !deadlineDate || !features || totalAmount === undefined || paidAmount === undefined) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields for order creation."
    );
  }

  try {
    // Validate customerId
    const customerRef = db.collection("customers").doc(customerId);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Customer not found or does not belong to this tailor."
      );
    }

    // Validate measurementId
    const measurementRef = db.collection("measurements").doc(measurementId);
    const measurementDoc = await measurementRef.get();
    if (!measurementDoc.exists || measurementDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Measurement not found or does not belong to this tailor."
      );
    }
    // Further check if measurement customerId matches order customerId
    if (measurementDoc.data().customerId !== customerId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Measurement does not belong to the specified customer."
        );
    }


    const newOrder = {
      tailorId: tailorId,
      customerId: customerId,
      outfitType: outfitType,
      measurementId: measurementId,
      orderDate: new Date(orderDate), // Ensure it's a Date object
      deadlineDate: new Date(deadlineDate), // Ensure it's a Date object
      features: features, // e.g., { fabric: "Cotton", color: "Blue" }
      notes: notes || "",
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      images: images || [], // Array of gs:// paths or HTTPS URLs
      status: "received", // Initial status
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const orderRef = await db.collection("orders").add(newOrder);
    functions.logger.info(`New order created by UID: ${tailorId}, OrderID: ${orderRef.id}`);
    return { success: true, orderId: orderRef.id };
  } catch (error) {
    functions.logger.error(`Error creating order for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to create order.");
  }
});

/**
 * HTTPS Callable: Retrieves a specific order for the authenticated tailor.
 * Input: data (object: { orderId: string })
 */
exports.getOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const orderId = data.orderId;

  if (!orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing orderId.");
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to access this order."
      );
    }
    functions.logger.info(`Order retrieved by UID: ${tailorId}, OrderID: ${orderId}`);
    return { success: true, order: {id: doc.id, ...doc.data()} };
  } catch (error) {
    functions.logger.error(`Error retrieving order ${orderId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to retrieve order.");
  }
});

/**
 * HTTPS Callable: Updates a specific order for the authenticated tailor.
 * Input: data (object: { orderId: string, updateData: object })
 */
exports.updateOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const orderId = data.orderId;
  const orderUpdateData = data.updateData;

  if (!orderId || !orderUpdateData) {
    throw new functions.https.HttpsError("invalid-argument", "Missing orderId or updateData.");
  }

  // Prevent changing key identifiers
  if (orderUpdateData.tailorId) delete orderUpdateData.tailorId;
  if (orderUpdateData.customerId) delete orderUpdateData.customerId; // Customer change should be a new order
  if (orderUpdateData.createdAt) delete orderUpdateData.createdAt;
  
  // Validate status transitions if status is being updated
  if (orderUpdateData.status) {
    // Add specific status transition validation logic here if needed in P1/P2
    // For P0, direct update is allowed, but can be refined.
    // Example: if currentStatus is 'completed', cannot change to 'stitching'.
  }
  
  if (Object.keys(orderUpdateData).length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No valid fields to update.");
  }

  orderUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this order."
      );
    }

    await orderRef.update(orderUpdateData);
    functions.logger.info(`Order updated by UID: ${tailorId}, OrderID: ${orderId}`, orderUpdateData);
    return { success: true, message: "Order updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating order ${orderId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update order.");
  }
});

/**
 * HTTPS Callable: Deletes a specific order for the authenticated tailor.
 * Input: data (object: { orderId: string })
 * Note: For P0, does not delete associated images from Storage.
 */
exports.deleteOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const orderId = data.orderId;

  if (!orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing orderId.");
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to delete this order."
      );
    }
    
    // TODO P1/P2: Implement deletion of associated images from Firebase Storage if `doc.data().images` has entries.
    // This would involve parsing gs:// paths and using admin.storage().bucket().file(path).delete().

    await orderRef.delete();
    functions.logger.info(`Order deleted by UID: ${tailorId}, OrderID: ${orderId}`);
    return { success: true, message: "Order deleted successfully." };
  } catch (error) {
    functions.logger.error(`Error deleting order ${orderId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to delete order.");
  }
});

/**
 * HTTPS Callable: Lists orders for the authenticated tailor, with optional filters.
 * Input: data (object: optional { status?: string, customerId?: string, dateRange?: { from: string, to: string } })
 */
exports.listOrders = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const filters = data || {};

  try {
    let query = db.collection("orders").where("tailorId", "==", tailorId);

    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters.customerId) {
      query = query.where("customerId", "==", filters.customerId);
    }
    if (filters.dateRange && filters.dateRange.from) {
      query = query.where("orderDate", ">=", new Date(filters.dateRange.from));
    }
    if (filters.dateRange && filters.dateRange.to) {
      query = query.where("orderDate", "<=", new Date(filters.dateRange.to));
    }
    
    // Default sort, can be made configurable
    query = query.orderBy("orderDate", "desc"); 

    const ordersSnapshot = await query.get();
    const orders = [];
    ordersSnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    functions.logger.info(`Orders listed for UID: ${tailorId}, Count: ${orders.length}`, filters);
    return { success: true, orders: orders };
  } catch (error) {
    functions.logger.error(`Error listing orders for UID: ${tailorId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to list orders.");
  }
});

/**
 * HTTPS Callable: Updates the status of a specific order.
 * Input: data (object: { orderId: string, newStatus: string })
 */
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { orderId, newStatus } = data;

  if (!orderId || !newStatus) {
    throw new functions.https.HttpsError("invalid-argument", "Missing orderId or newStatus.");
  }

  // Define allowed statuses (can be extended)
  const allowedStatuses = ["received", "designing", "cutting", "stitching", "trial", "ready", "picked_up", "cancelled"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid status value.");
  }

  // TODO P1/P2: Implement more granular status transition validation if required.
  // E.g., can't go from 'picked_up' back to 'stitching'.
  // For now, any allowed status can be set.

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this order's status."
      );
    }

    await orderRef.update({ 
      status: newStatus, 
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    functions.logger.info(`Order status updated by UID: ${tailorId}, OrderID: ${orderId}, NewStatus: ${newStatus}`);
    return { success: true, message: "Order status updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating status for order ${orderId}, UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update order status.");
  }
});


// --- Conceptual Notes ---

/*
Image Handling for Orders:
- Client-side Upload: The React Native application should handle image uploads directly to Firebase Storage.
  This is generally preferred for performance and to avoid hitting Cloud Function memory/timeout limits.
- Upload Path: Images could be stored at a path like `/user_uploads/{userId}/order_images/{orderId}/{imageName}`.
  The `{orderId}` might not be known at initial upload if images are selected before `createOrder` is called.
  An alternative is `/user_uploads/{userId}/temp_order_images/{timestamp_or_uuid}/{imageName}`.
- Passing to Functions: Once uploaded, the client gets a `gs://` path or an HTTPS download URL.
  This string (or an array of these strings) is then passed in the `images` field to `createOrder` or `updateOrder`.
- Cloud Function Role: The Cloud Functions (`createOrder`, `updateOrder`) simply store these image paths/URLs
  in the Firestore `orders` document. They do not handle the byte stream of the upload.
- Security: Firebase Storage security rules must be configured to allow authenticated users to write to their
  designated paths (e.g., `/user_uploads/{userId}/...`).
*/

/*
Deadline Reminder Logic (Conceptual for a future scheduled function):
- Function Name: `checkOrderDeadlines`
- Trigger: Pub/Sub schedule (e.g., daily at a specific time like 8:00 AM).
- Logic:
  1. Query the `orders` collection:
     - `status` is not 'completed', 'picked_up', or 'cancelled'.
     - `deadlineDate` is within a defined upcoming window (e.g., <= today + 3 days and >= today).
  2. For each order found:
     - Determine if a reminder has already been sent for this specific deadline window to avoid spam.
       (Could involve checking a `lastReminderSent` field in the order or a separate `reminders` collection).
     - If a reminder is needed:
       - Send a notification. This could be:
         - Creating a document in a `notifications` collection (e.g., `/users/{tailorId}/notifications`).
           The app would listen to this collection for real-time updates.
         - Using Firebase Cloud Messaging (FCM) to send a push notification directly to the user's device.
           This requires managing FCM tokens for users.
       - Update the order document with `lastReminderSent: admin.firestore.FieldValue.serverTimestamp()` or similar.
- Considerations:
  - Timezones: Handle deadline dates and current time carefully with respect to timezones.
  - Scalability: For a very large number of orders, the query might need optimization or batching.
  - User Preferences: Allow users to configure reminder preferences.
*/

// --- Invoice Management Functions ---

/**
 * HTTPS Callable: Creates a new invoice for an order.
 * Input: data (object: { orderId: string, invoiceData?: object })
 * invoiceData can include custom line items, tax, discount if not purely from order.
 */
exports.createInvoice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { orderId, invoiceData = {} } = data;

  if (!orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required field: orderId.");
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Order not found or you do not have permission to access it."
      );
    }
    const orderData = orderDoc.data();

    const customerRef = db.collection("customers").doc(orderData.customerId);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists) { // tailorId check already done by order
        throw new functions.https.HttpsError("not-found", "Associated customer not found.");
    }
    // const customerData = customerDoc.data(); // Not strictly needed for P0 invoice creation

    // Construct invoice items - P0: defaults to order totalAmount as a single item.
    // P1/P2: Could parse order.features or allow invoiceData.items
    const items = invoiceData.items || [{
      id: "order_" + orderId,
      description: `Order for ${orderData.outfitType || 'custom outfit'}`,
      quantity: 1,
      unitPrice: orderData.totalAmount,
      amount: orderData.totalAmount,
    }];

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = invoiceData.tax || 0; // P0: simple tax
    const discount = invoiceData.discount || 0; // P0: simple discount
    const totalAmount = subtotal + tax - discount;
    const paidAmount = invoiceData.paidAmount !== undefined ? invoiceData.paidAmount : orderData.paidAmount; // Default to order's paid amount
    const remainingAmount = totalAmount - paidAmount;
    const paymentStatus = paidAmount >= totalAmount ? "paid" : (paidAmount > 0 ? "partially_paid" : "unpaid");

    const newInvoice = {
      tailorId: tailorId,
      orderId: orderId,
      customerId: orderData.customerId,
      generatedDate: admin.firestore.FieldValue.serverTimestamp(),
      items: items,
      subtotal: subtotal,
      tax: tax,
      discount: discount,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      paymentStatus: paymentStatus,
      notes: invoiceData.notes || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const invoiceRef = await db.collection("invoices").add(newInvoice);
    functions.logger.info(`New invoice created by UID: ${tailorId}, InvoiceID: ${invoiceRef.id} for OrderID: ${orderId}`);
    
    // P1: Optionally, update order status to 'invoiced' or similar.
    // await orderRef.update({ status: "invoiced", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    return { success: true, invoiceId: invoiceRef.id };
  } catch (error) {
    functions.logger.error(`Error creating invoice for UID: ${tailorId}, OrderID: ${orderId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to create invoice.");
  }
});

/**
 * HTTPS Callable: Retrieves a specific invoice.
 * Input: data (object: { invoiceId: string })
 */
exports.getInvoice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const invoiceId = data.invoiceId;

  if (!invoiceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invoiceId.");
  }

  try {
    const invoiceRef = db.collection("invoices").doc(invoiceId);
    const doc = await invoiceRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Invoice not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to access this invoice."
      );
    }
    functions.logger.info(`Invoice retrieved by UID: ${tailorId}, InvoiceID: ${invoiceId}`);
    return { success: true, invoice: {id: doc.id, ...doc.data()} };
  } catch (error) {
    functions.logger.error(`Error retrieving invoice ${invoiceId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to retrieve invoice.");
  }
});

/**
 * HTTPS Callable: Updates a specific invoice.
 * Input: data (object: { invoiceId: string, updateData: object })
 */
exports.updateInvoice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const invoiceId = data.invoiceId;
  const invoiceUpdateData = data.updateData;

  if (!invoiceId || !invoiceUpdateData) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invoiceId or updateData.");
  }

  // Prevent changing key identifiers
  if (invoiceUpdateData.tailorId) delete invoiceUpdateData.tailorId;
  if (invoiceUpdateData.orderId) delete invoiceUpdateData.orderId;
  if (invoiceUpdateData.customerId) delete invoiceUpdateData.customerId;
  if (invoiceUpdateData.generatedDate) delete invoiceUpdateData.generatedDate;
  
  // If items, tax, discount, or paidAmount are updated, totals might need recalculation
  // For P0, this function is mainly for notes or simple field changes.
  // `updateInvoicePaymentStatus` is preferred for payment changes.
  if (invoiceUpdateData.items || invoiceUpdateData.tax !== undefined || invoiceUpdateData.discount !== undefined || invoiceUpdateData.paidAmount !== undefined) {
      // P1/P2: Add logic to recalculate subtotal, totalAmount, remainingAmount, paymentStatus
      // For now, we'll assume these are updated correctly by the client or not part of this simple update.
      functions.logger.warn(`Invoice ${invoiceId} update includes financial fields. Consider using updateInvoicePaymentStatus for payments.`);
  }

  if (Object.keys(invoiceUpdateData).length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No valid fields to update.");
  }
  invoiceUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  try {
    const invoiceRef = db.collection("invoices").doc(invoiceId);
    const doc = await invoiceRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Invoice not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this invoice."
      );
    }

    await invoiceRef.update(invoiceUpdateData);
    functions.logger.info(`Invoice updated by UID: ${tailorId}, InvoiceID: ${invoiceId}`, invoiceUpdateData);
    return { success: true, message: "Invoice updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating invoice ${invoiceId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update invoice.");
  }
});

/**
 * HTTPS Callable: Deletes a specific invoice.
 * Input: data (object: { invoiceId: string })
 */
exports.deleteInvoice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const invoiceId = data.invoiceId;

  if (!invoiceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invoiceId.");
  }

  try {
    const invoiceRef = db.collection("invoices").doc(invoiceId);
    const doc = await invoiceRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Invoice not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to delete this invoice."
      );
    }

    await invoiceRef.delete();
    functions.logger.info(`Invoice deleted by UID: ${tailorId}, InvoiceID: ${invoiceId}`);
    return { success: true, message: "Invoice deleted successfully." };
  } catch (error) {
    functions.logger.error(`Error deleting invoice ${invoiceId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to delete invoice.");
  }
});

/**
 * HTTPS Callable: Lists invoices for the authenticated tailor.
 * Input: data (object: optional filters { paymentStatus?: string, customerId?: string, dateRange?: {from, to} })
 */
exports.listInvoices = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const filters = data || {};

  try {
    let query = db.collection("invoices").where("tailorId", "==", tailorId);

    if (filters.paymentStatus) {
      query = query.where("paymentStatus", "==", filters.paymentStatus);
    }
    if (filters.customerId) {
      query = query.where("customerId", "==", filters.customerId);
    }
    if (filters.dateRange && filters.dateRange.from) {
      query = query.where("generatedDate", ">=", new Date(filters.dateRange.from));
    }
    if (filters.dateRange && filters.dateRange.to) {
      query = query.where("generatedDate", "<=", new Date(filters.dateRange.to));
    }
    
    query = query.orderBy("generatedDate", "desc"); 

    const invoicesSnapshot = await query.get();
    const invoices = [];
    invoicesSnapshot.forEach(doc => {
      invoices.push({ id: doc.id, ...doc.data() });
    });
    
    functions.logger.info(`Invoices listed for UID: ${tailorId}, Count: ${invoices.length}`, filters);
    return { success: true, invoices: invoices };
  } catch (error) {
    functions.logger.error(`Error listing invoices for UID: ${tailorId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to list invoices.");
  }
});

/**
 * HTTPS Callable: Updates payment status and amounts for an invoice.
 * Input: data (object: { invoiceId: string, paidAmount: number, paymentStatus: string })
 */
exports.updateInvoicePaymentStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { invoiceId, paidAmount, paymentStatus } = data;

  if (!invoiceId || paidAmount === undefined || !paymentStatus) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invoiceId, paidAmount, or paymentStatus.");
  }

  const allowedStatuses = ["unpaid", "partially_paid", "paid", "overdue", "refunded"];
  if (!allowedStatuses.includes(paymentStatus)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid paymentStatus value.");
  }

  try {
    const invoiceRef = db.collection("invoices").doc(invoiceId);
    const doc = await invoiceRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Invoice not found.");
    }
    const invoiceData = doc.data();
    if (invoiceData.tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this invoice."
      );
    }

    const newPaidAmount = Number(paidAmount);
    const remainingAmount = invoiceData.totalAmount - newPaidAmount;
    
    // Basic validation for payment status based on amounts
    if (newPaidAmount >= invoiceData.totalAmount && paymentStatus !== 'paid' && paymentStatus !== 'refunded') {
        functions.logger.warn(`Payment status for Invoice ${invoiceId} might be inconsistent. Paid amount >= total, but status is ${paymentStatus}. Consider setting to 'paid'.`);
    } else if (newPaidAmount > 0 && newPaidAmount < invoiceData.totalAmount && paymentStatus !== 'partially_paid' && paymentStatus !== 'overdue') {
        functions.logger.warn(`Payment status for Invoice ${invoiceId} might be inconsistent. Paid amount is partial, but status is ${paymentStatus}. Consider setting to 'partially_paid'.`);
    } else if (newPaidAmount === 0 && paymentStatus !== 'unpaid' && paymentStatus !== 'overdue') {
         functions.logger.warn(`Payment status for Invoice ${invoiceId} might be inconsistent. Paid amount is zero, but status is ${paymentStatus}. Consider setting to 'unpaid'.`);
    }


    const updatePayload = {
      paidAmount: newPaidAmount,
      paymentStatus: paymentStatus,
      remainingAmount: remainingAmount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await invoiceRef.update(updatePayload);
    functions.logger.info(`Invoice payment status updated for UID: ${tailorId}, InvoiceID: ${invoiceId}`, updatePayload);
    return { success: true, message: "Invoice payment updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating payment for invoice ${invoiceId}, UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update invoice payment.");
  }
});

/**
 * HTTPS Callable: Generates data for an invoice receipt.
 * Input: data (object: { invoiceId: string })
 */
exports.generateInvoiceReceiptData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const invoiceId = data.invoiceId;

  if (!invoiceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing invoiceId.");
  }

  try {
    const invoiceRef = db.collection("invoices").doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists || invoiceDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError("not-found", "Invoice not found or permission denied.");
    }
    const invoiceData = invoiceDoc.data();

    // Fetch related data
    const customerRef = db.collection("customers").doc(invoiceData.customerId);
    const customerDoc = await customerRef.get();
    const customerData = customerDoc.exists ? customerDoc.data() : null;

    const orderRef = db.collection("orders").doc(invoiceData.orderId);
    const orderDoc = await orderRef.get();
    const orderData = orderDoc.exists ? orderDoc.data() : null;
    
    const userRef = db.collection("users").doc(tailorId); // Tailor's business details
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const receiptData = {
      invoice: {id: invoiceDoc.id, ...invoiceData},
      customer: customerData ? { name: customerData.name, phoneNumber: customerData.phoneNumber, email: customerData.email, address: customerData.address } : null,
      order: orderData ? { outfitType: orderData.outfitType, orderDate: orderData.orderDate, deadlineDate: orderData.deadlineDate } : null,
      tailorBusinessInfo: userData ? { businessName: userData.businessName, name: userData.name, email: userData.email, phoneNumber: userData.phoneNumber } : null,
      generatedAt: new Date().toISOString(),
    };
    
    functions.logger.info(`Receipt data generated for InvoiceID: ${invoiceId}, UID: ${tailorId}`);
    return { success: true, receiptData: receiptData };
  } catch (error) {
    functions.logger.error(`Error generating receipt data for InvoiceID: ${invoiceId}, UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to generate receipt data.");
  }
});

/**
 * HTTPS Callable: Gets basic financial report data (P2).
 * Input: data (object: { dateRange: { from, to }, reportType: 'revenue_summary' })
 */
exports.getFinancialReportData = functions.runWith({memory: '512MB', timeoutSeconds: 120}) // Increase resources if needed
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { dateRange, reportType } = data;

  if (!dateRange || !dateRange.from || !dateRange.to || !reportType) {
    throw new functions.https.HttpsError("invalid-argument", "Missing dateRange or reportType.");
  }
  if (reportType !== 'revenue_summary') {
    throw new functions.https.HttpsError("invalid-argument", "Unsupported reportType for P2.");
  }

  try {
    let query = db.collection("invoices")
      .where("tailorId", "==", tailorId)
      .where("generatedDate", ">=", new Date(dateRange.from))
      .where("generatedDate", "<=", new Date(dateRange.to));

    const invoicesSnapshot = await query.get();
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let paidInvoicesCount = 0;
    let unpaidInvoicesCount = 0;
    let partiallyPaidInvoicesCount = 0;

    invoicesSnapshot.forEach(doc => {
      const invoice = doc.data();
      totalInvoiced += invoice.totalAmount || 0;
      totalPaid += invoice.paidAmount || 0;
      totalRemaining += invoice.remainingAmount || 0;

      if (invoice.paymentStatus === 'paid') {
        paidInvoicesCount++;
      } else if (invoice.paymentStatus === 'unpaid' || invoice.paymentStatus === 'overdue') {
        unpaidInvoicesCount++;
      } else if (invoice.paymentStatus === 'partially_paid') {
        partiallyPaidInvoicesCount++;
      }
    });

    const report = {
      reportType: 'revenue_summary',
      dateRange: dateRange,
      totalInvoiced: totalInvoiced,
      totalPaid: totalPaid,
      totalRemaining: totalRemaining,
      invoiceCount: invoicesSnapshot.size,
      paidInvoicesCount: paidInvoicesCount,
      unpaidInvoicesCount: unpaidInvoicesCount,
      partiallyPaidInvoicesCount: partiallyPaidInvoicesCount,
    };
    
    functions.logger.info(`Financial report data generated for UID: ${tailorId}`, reportType, dateRange);
    return { success: true, report: report };
  } catch (error) {
    functions.logger.error(`Error generating financial report for UID: ${tailorId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to generate financial report.");
  }
});

// --- Shareable Order Status Functions ---

/**
 * HTTPS Callable: Generates a shareable, secure token for an order.
 * Input: data (object: { orderId: string })
 */
exports.generateShareableOrderToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to generate an order token.");
  }
  const tailorId = context.auth.uid;
  const orderId = data.orderId;

  if (!orderId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required field: orderId.");
  }

  try {
    // 1. Verify the order belongs to the tailor
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", `Order with ID ${orderId} not found.`);
    }
    if (orderDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError("permission-denied", "You do not have permission to generate a token for this order.");
    }
    
    const orderData = orderDoc.data();
    const customerId = orderData.customerId;

    // 2. Generate a unique token (using Firestore's auto-ID for simplicity and uniqueness)
    const tokenRef = db.collection("sharedOrderTokens").doc(); // Creates a new doc ref with auto-ID
    const token = tokenRef.id;

    // 3. Define token expiry (e.g., 14 days from now)
    const now = admin.firestore.Timestamp.now();
    const expiresAtSeconds = now.seconds + (14 * 24 * 60 * 60); // 14 days
    const expiresAt = new admin.firestore.Timestamp(expiresAtSeconds, now.nanoseconds);

    // 4. Create the token document
    const tokenDocument = {
      orderId: orderId,
      tailorId: tailorId,
      customerId: customerId,
      createdAt: now,
      expiresAt: expiresAt,
    };
    await tokenRef.set(tokenDocument);

    functions.logger.info(`Shareable token ${token} created for OrderID: ${orderId} by TailorID: ${tailorId}`);
    return { success: true, token: token };

  } catch (error) {
    functions.logger.error(`Error generating shareable token for OrderID: ${orderId}, TailorID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to generate shareable order token.", error.message);
  }
});


/**
 * HTTPS Callable: Retrieves limited order details using a shareable token.
 * This function is publicly callable (no auth context needed for the caller).
 * Input: data (object: { token: string })
 */
exports.getPublicOrderStatusByToken = functions.https.onCall(async (data, context) => {
  const tokenString = data.token;

  if (!tokenString) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required field: token.");
  }

  try {
    // 1. Read the token document
    const tokenRef = db.collection("sharedOrderTokens").doc(tokenString);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Invalid or expired token.");
    }
    const tokenData = tokenDoc.data();

    // 2. Check expiry
    const now = admin.firestore.Timestamp.now();
    if (tokenData.expiresAt.toMillis() < now.toMillis()) {
      functions.logger.warn(`Expired token used: ${tokenString}`);
      // Optionally delete the expired token
      // await tokenRef.delete();
      throw new functions.https.HttpsError("permission-denied", "Token has expired.");
    }

    // 3. Retrieve order, customer, and tailor data
    const orderId = tokenData.orderId;
    const tailorId = tokenData.tailorId;
    const customerId = tokenData.customerId;

    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      functions.logger.error(`Order ${orderId} linked by token ${tokenString} not found.`);
      throw new functions.https.HttpsError("internal", "Associated order not found.");
    }
    const orderData = orderDoc.data();

    const customerDoc = await db.collection("customers").doc(customerId).get();
    const customerData = customerDoc.exists ? customerDoc.data() : null;

    const tailorUserDoc = await db.collection("users").doc(tailorId).get();
    const tailorUserData = tailorUserDoc.exists ? tailorUserDoc.data() : null;

    // 4. Construct limited subset of data for public view
    // (Ensure server timestamps are converted to ISO strings or millis for client)
    const deadlineDate = orderData.deadlineDate.toDate ? orderData.deadlineDate.toDate().toISOString() : orderData.deadlineDate;
    const orderDate = orderData.orderDate.toDate ? orderData.orderDate.toDate().toISOString() : orderData.orderDate;
    
    const publicOrderData = {
      orderId: orderDoc.id.substring(0, 8) + "...", // Masked or formatted ID
      outfitType: orderData.outfitType,
      status: orderData.status,
      deadlineDate: deadlineDate, 
      orderDate: orderDate,
      // Key features - be selective. Example: only show fabric if it's a simple string.
      features: orderData.features ? { fabric: orderData.features.fabric } : {}, // Highly selective
      // Images - only if explicitly marked for public view or if all are safe
      images: orderData.images ? orderData.images.slice(0,1) : [], // Example: show only the first image
      tailorBusinessName: tailorUserData?.businessName || t("common.unknownTailor", "Tailor Shop"), // From users collection
      customerFirstName: customerData?.name ? customerData.name.split(" ")[0] : t("common.valuedCustomer", "Valued Customer"), // Only first name
      // DO NOT include: financial details, internal notes, full PII, internal IDs
    };

    return { success: true, order: publicOrderData };

  } catch (error) {
    functions.logger.error(`Error retrieving public order status for Token: ${tokenString}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to retrieve order status.", error.message);
  }
});


// --- Data Management Functions ---

/**
 * HTTPS Callable: Initiates a manual backup of key collections for the user.
 * Input: None
 */
exports.initiateManualBackup = functions.runWith({memory: '1GB', timeoutSeconds: 300}) // Increased resources
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const timestamp = new Date().toISOString().replace(/:/g, '-'); // File-safe timestamp
  const backupFileName = `backup-${timestamp}.json`;
  const backupPath = `data_exports/${tailorId}/backups/${backupFileName}`;

  try {
    const collectionsToBackup = {
      customers: await db.collection("customers").where("tailorId", "==", tailorId).get(),
      orders: await db.collection("orders").where("tailorId", "==", tailorId).get(),
      invoices: await db.collection("invoices").where("tailorId", "==", tailorId).get(),
      measurements: await db.collection("measurements").where("tailorId", "==", tailorId).get(),
      measurementTemplates: await db.collection("measurementTemplates").where("userId", "==", tailorId).where("isSystem", "==", false).get(),
      // users: await db.collection("users").doc(tailorId).get(), // Single doc
    };

    const backupData = {};

    for (const key in collectionsToBackup) {
      backupData[key] = [];
      // if (key === 'users' && collectionsToBackup[key].exists) { // Handle single doc
      //   backupData[key] = collectionsToBackup[key].data();
      // } else 
      if (collectionsToBackup[key].forEach) { // Handle query snapshot
        collectionsToBackup[key].forEach(doc => {
          backupData[key].push({ id: doc.id, ...doc.data() });
        });
      }
    }
    
    // Add user profile separately as it's a single document.
    const userDoc = await db.collection("users").doc(tailorId).get();
    if (userDoc.exists) {
        backupData.userProfile = userDoc.data();
    }


    const bucket = admin.storage().bucket(); // Default bucket
    const file = bucket.file(backupPath);
    await file.save(JSON.stringify(backupData, null, 2), { // Pretty print JSON
      contentType: 'application/json',
      metadata: {
        customMetadata: {
          'owner': tailorId,
          'backupType': 'manual'
        }
      }
    });
    
    functions.logger.info(`Manual backup created for UID: ${tailorId} at ${backupPath}`);
    return { success: true, backupPath: backupPath, message: "Backup completed successfully." };

  } catch (error) {
    functions.logger.error(`Error creating manual backup for UID: ${tailorId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to create manual backup.", error.message);
  }
});

/**
 * HTTPS Callable: Initiates data export for a specific collection.
 * Input: data (object: { collectionName: string, format: 'json' | 'csv' })
 */
exports.initiateDataExport = functions.runWith({memory: '512MB', timeoutSeconds: 180})
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { collectionName, format } = data;

  if (!collectionName || !format) {
    throw new functions.https.HttpsError("invalid-argument", "Missing collectionName or format.");
  }
  if (format !== 'json' && format !== 'csv') {
    throw new functions.https.HttpsError("invalid-argument", "Invalid format. Must be 'json' or 'csv'.");
  }

  const validCollections = ["customers", "orders", "invoices", "measurements", "measurementTemplates", "users"];
  if (!validCollections.includes(collectionName)) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid collection name. Allowed: ${validCollections.join(', ')}`);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const exportFileName = `${collectionName}-export-${timestamp}.${format}`;
  const exportPath = `data_exports/${tailorId}/exports/${exportFileName}`;

  try {
    let collectionData = [];
    let query;

    if (collectionName === "users") { // Special case for user's own profile
        const doc = await db.collection("users").doc(tailorId).get();
        if (doc.exists) collectionData.push({id: doc.id, ...doc.data()});
    } else if (collectionName === "measurementTemplates") { // Special case for templates (user-owned only)
        query = db.collection(collectionName).where("userId", "==", tailorId).where("isSystem", "==", false);
        const snapshot = await query.get();
        snapshot.forEach(doc => collectionData.push({ id: doc.id, ...doc.data() }));
    } else { // For other collections owned by tailorId
        query = db.collection(collectionName).where("tailorId", "==", tailorId);
        const snapshot = await query.get();
        snapshot.forEach(doc => collectionData.push({ id: doc.id, ...doc.data() }));
    }


    if (collectionData.length === 0) {
        return { success: true, exportPath: null, message: "No data found to export." };
    }

    let fileContent;
    let contentType;

    if (format === 'json') {
      fileContent = JSON.stringify(collectionData, null, 2);
      contentType = 'application/json';
    } else { // format === 'csv'
      if (collectionData.length > 0) {
        const headers = Object.keys(collectionData[0]).join(',');
        const rows = collectionData.map(obj => {
          return Object.values(obj).map(val => {
            if (typeof val === 'object' && val !== null) return JSON.stringify(val); // Stringify nested objects/arrays
            return String(val).includes(',') ? `"${val}"` : val; // Handle commas in values
          }).join(',');
        });
        fileContent = `${headers}\n${rows.join('\n')}`;
      } else {
        fileContent = ""; // Empty CSV for no data
      }
      contentType = 'text/csv';
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(exportPath);
    await file.save(fileContent, { contentType: contentType, metadata: { customMetadata: { 'owner': tailorId } } });
    
    functions.logger.info(`Data export created for UID: ${tailorId}, Collection: ${collectionName} at ${exportPath}`);
    return { success: true, exportPath: exportPath, message: "Data export completed successfully." };

  } catch (error) {
    functions.logger.error(`Error exporting data for UID: ${tailorId}, Collection: ${collectionName}`, error);
    throw new functions.https.HttpsError("internal", "Failed to export data.", error.message);
  }
});

/**
 * HTTPS Callable: Initiates a simple data import (P1 - Placeholder).
 * Input: data (object: { collectionName: string, data: Array<object> })
 */
exports.initiateDataImport = functions.runWith({memory: '1GB', timeoutSeconds: 300})
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { collectionName, data: recordsToImport } = data;

  if (!collectionName || !recordsToImport || !Array.isArray(recordsToImport)) {
    throw new functions.https.HttpsError("invalid-argument", "Missing collectionName or data (must be an array).");
  }

  // P1: Simple validation - allow import only to 'customers' or 'measurements' for now.
  // More robust validation, field mapping, and duplicate handling are P2/P3.
  const allowedCollectionsForImport = ["customers", "measurements"]; 
  if (!allowedCollectionsForImport.includes(collectionName)) {
      throw new functions.https.HttpsError("invalid-argument", `Import currently only supported for: ${allowedCollectionsForImport.join(', ')}.`);
  }
  
  if (recordsToImport.length === 0) {
      return { success: true, importedCount: 0, message: "No records provided for import." };
  }
  if (recordsToImport.length > 500) { // Firestore batch limit
      throw new functions.https.HttpsError("invalid-argument", "Too many records. Max 500 per batch for this P1 version.");
  }


  try {
    const batch = db.batch();
    let importedCount = 0;

    recordsToImport.forEach(record => {
      const docRef = db.collection(collectionName).doc(); // Auto-generate ID
      let newRecord = { ...record };
      
      // Ensure tailorId is set for ownership, and createdAt/updatedAt
      newRecord.tailorId = tailorId; 
      newRecord.createdAt = admin.firestore.FieldValue.serverTimestamp();
      newRecord.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      // Simple validation for P1: 'customers' need 'name' and 'phoneNumber'
      if (collectionName === "customers" && (!newRecord.name || !newRecord.phoneNumber)) {
          functions.logger.warn("Skipping customer record due to missing name or phoneNumber", newRecord);
          return; // Skip this record
      }
      // 'measurements' need 'customerId', 'outfitType', 'measurementValues'
      if (collectionName === "measurements" && (!newRecord.customerId || !newRecord.outfitType || !newRecord.measurementValues)) {
          functions.logger.warn("Skipping measurement record due to missing fields", newRecord);
          return; // Skip this record
      }
      // TODO P2: Validate customerId for measurements exists and belongs to tailorId

      batch.set(docRef, newRecord);
      importedCount++;
    });

    await batch.commit();
    
    functions.logger.info(`Data import completed for UID: ${tailorId}, Collection: ${collectionName}, Count: ${importedCount}`);
    return { success: true, importedCount: importedCount, message: `${importedCount} records imported successfully.` };

  } catch (error) {
    functions.logger.error(`Error importing data for UID: ${tailorId}, Collection: ${collectionName}`, error);
    throw new functions.https.HttpsError("internal", "Failed to import data.", error.message);
  }
});

/**
 * HTTPS Callable: Updates the calling user's profile in the 'users' collection.
 * Input: data (object containing fields to update, e.g., name, businessName, suitTypes, language, theme)
 */
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = context.auth.uid;
  const userRef = db.collection("users").doc(uid);

  // Validate input data (basic validation)
  const allowedFields = ["name", "businessName", "suitTypes", "language", "theme"];
  const updateData = {};
  for (const key in data) {
    if (allowedFields.includes(key)) {
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No valid fields provided for update."
    );
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  try {
    await userRef.update(updateData);
    functions.logger.info(`User profile updated for UID: ${uid}`, updateData);
    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating user profile for UID: ${uid}`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update user profile."
    );
  }
});

/**
 * HTTPS Callable: Retrieves the calling user's profile from the 'users' collection.
 * Input: None (uses context.auth.uid)
 */
exports.getUserProfile = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = context.auth.uid;
  const userRef = db.collection("users").doc(uid);

  try {
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User profile not found. It might not have been created yet."
      );
    }
    functions.logger.info(`User profile retrieved for UID: ${uid}`);
    return { success: true, profile: doc.data() };
  } catch (error) {
    functions.logger.error(`Error retrieving user profile for UID: ${uid}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError(
      "internal",
      "Failed to retrieve user profile."
    );
  }
});

// --- Customer Management Functions ---

/**
 * HTTPS Callable: Creates a new customer for the authenticated tailor.
 * Input: data (object: { name, phoneNumber, email?, address?, tags?, notes? })
 */
exports.createCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;

  // Basic validation
  if (!data.name || !data.phoneNumber) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: name and phoneNumber."
    );
  }

  const newCustomer = {
    tailorId: tailorId,
    name: data.name,
    phoneNumber: data.phoneNumber,
    email: data.email || null,
    address: data.address || null,
    tags: data.tags || [],
    notes: data.notes || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const customerRef = await db.collection("customers").add(newCustomer);
    functions.logger.info(`New customer created by UID: ${tailorId}, CustomerID: ${customerRef.id}`);
    return { success: true, customerId: customerRef.id };
  } catch (error) {
    functions.logger.error(`Error creating customer for UID: ${tailorId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to create customer.");
  }
});

/**
 * HTTPS Callable: Retrieves a specific customer for the authenticated tailor.
 * Input: data (object: { customerId: string })
 */
exports.getCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const customerId = data.customerId;

  if (!customerId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing customerId.");
  }

  try {
    const customerRef = db.collection("customers").doc(customerId);
    const doc = await customerRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Customer not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to access this customer."
      );
    }
    functions.logger.info(`Customer retrieved by UID: ${tailorId}, CustomerID: ${customerId}`);
    return { success: true, customer: doc.data() };
  } catch (error) {
    functions.logger.error(`Error retrieving customer ${customerId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to retrieve customer.");
  }
});

/**
 * HTTPS Callable: Updates a specific customer for the authenticated tailor.
 * Input: data (object: { customerId: string, updateData: object })
 */
exports.updateCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const customerId = data.customerId;
  const customerUpdateData = data.updateData;

  if (!customerId || !customerUpdateData) {
    throw new functions.https.HttpsError("invalid-argument", "Missing customerId or updateData.");
  }

  // Prevent tailorId from being changed
  if (customerUpdateData.tailorId) {
    delete customerUpdateData.tailorId;
  }
  // Prevent createdAt from being changed
  if (customerUpdateData.createdAt) {
    delete customerUpdateData.createdAt;
  }

  if (Object.keys(customerUpdateData).length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No valid fields to update.");
  }
  
  customerUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  try {
    const customerRef = db.collection("customers").doc(customerId);
    const doc = await customerRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Customer not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this customer."
      );
    }

    await customerRef.update(customerUpdateData);
    functions.logger.info(`Customer updated by UID: ${tailorId}, CustomerID: ${customerId}`, customerUpdateData);
    return { success: true, message: "Customer updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating customer ${customerId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update customer.");
  }
});

/**
 * HTTPS Callable: Deletes a specific customer for the authenticated tailor.
 * Input: data (object: { customerId: string })
 */
exports.deleteCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const customerId = data.customerId;

  if (!customerId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing customerId.");
  }

  try {
    const customerRef = db.collection("customers").doc(customerId);
    const doc = await customerRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Customer not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to delete this customer."
      );
    }
    // TODO (P1/P2): Handle deletion of associated measurements/orders. For now, simple delete.
    await customerRef.delete();
    functions.logger.info(`Customer deleted by UID: ${tailorId}, CustomerID: ${customerId}`);
    return { success: true, message: "Customer deleted successfully." };
  } catch (error) {
    functions.logger.error(`Error deleting customer ${customerId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to delete customer.");
  }
});

/**
 * HTTPS Callable: Lists all customers for the authenticated tailor.
 * Input: data (object: optional filters - P0: no filters)
 */
exports.listCustomers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;

  try {
    const customersSnapshot = await db.collection("customers")
      .where("tailorId", "==", tailorId)
      .orderBy("createdAt", "desc") // Default sort by creation date
      .get();

    const customers = [];
    customersSnapshot.forEach(doc => {
      customers.push({ id: doc.id, ...doc.data() });
    });
    
    functions.logger.info(`Customers listed for UID: ${tailorId}, Count: ${customers.length}`);
    return { success: true, customers: customers };
  } catch (error) {
    functions.logger.error(`Error listing customers for UID: ${tailorId}`, error);
    throw new functions.https.HttpsError("internal", "Failed to list customers.");
  }
});

// --- Measurement Management Functions ---

/**
 * HTTPS Callable: Creates a new measurement for a customer of the authenticated tailor.
 * Input: data (object: { customerId, outfitType, measurementValues, notes? })
 */
exports.createMeasurement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const { customerId, outfitType, measurementValues, notes } = data;

  if (!customerId || !outfitType || !measurementValues) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: customerId, outfitType, and measurementValues."
    );
  }

  try {
    // Verify customer belongs to the tailor
    const customerRef = db.collection("customers").doc(customerId);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Customer not found or does not belong to this tailor."
      );
    }

    const newMeasurement = {
      tailorId: tailorId,
      customerId: customerId,
      outfitType: outfitType,
      measurementValues: measurementValues, // Should be an object e.g., {chest: 40, waist: 32, ...}
      notes: notes || "",
      takenDate: admin.firestore.FieldValue.serverTimestamp(), // P0: Using server timestamp as takenDate
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const measurementRef = await db.collection("measurements").add(newMeasurement);
    functions.logger.info(
      `New measurement created by UID: ${tailorId}, CustomerID: ${customerId}, MeasurementID: ${measurementRef.id}`
    );
    return { success: true, measurementId: measurementRef.id };
  } catch (error) {
    functions.logger.error(`Error creating measurement for UID: ${tailorId}, CustomerID: ${customerId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to create measurement.");
  }
});

/**
 * HTTPS Callable: Retrieves all measurements for a given customer of the authenticated tailor.
 * Input: data (object: { customerId: string })
 */
exports.getMeasurementsForCustomer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const customerId = data.customerId;

  if (!customerId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing customerId.");
  }

  try {
    // Verify customer belongs to the tailor (optional but good practice)
    const customerRef = db.collection("customers").doc(customerId);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Customer not found or does not belong to this tailor."
      );
    }

    const measurementsSnapshot = await db.collection("measurements")
      .where("tailorId", "==", tailorId)
      .where("customerId", "==", customerId)
      .orderBy("takenDate", "desc")
      .get();

    const measurements = [];
    measurementsSnapshot.forEach(doc => {
      measurements.push({ id: doc.id, ...doc.data() });
    });
    
    functions.logger.info(`Measurements listed for UID: ${tailorId}, CustomerID: ${customerId}, Count: ${measurements.length}`);
    return { success: true, measurements: measurements };
  } catch (error) {
    functions.logger.error(`Error listing measurements for UID: ${tailorId}, CustomerID: ${customerId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to list measurements.");
  }
});

/**
 * HTTPS Callable: Updates a specific measurement for the authenticated tailor.
 * Input: data (object: { measurementId: string, updateData: object })
 */
exports.updateMeasurement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const measurementId = data.measurementId;
  const measurementUpdateData = data.updateData;

  if (!measurementId || !measurementUpdateData) {
    throw new functions.https.HttpsError("invalid-argument", "Missing measurementId or updateData.");
  }

  // Prevent changing key identifiers
  if (measurementUpdateData.tailorId) delete measurementUpdateData.tailorId;
  if (measurementUpdateData.customerId) delete measurementUpdateData.customerId;
  if (measurementUpdateData.takenDate) delete measurementUpdateData.takenDate; // Or allow updating if needed

  if (Object.keys(measurementUpdateData).length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No valid fields to update.");
  }

  measurementUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  try {
    const measurementRef = db.collection("measurements").doc(measurementId);
    const doc = await measurementRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Measurement not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to update this measurement."
      );
    }

    await measurementRef.update(measurementUpdateData);
    functions.logger.info(`Measurement updated by UID: ${tailorId}, MeasurementID: ${measurementId}`, measurementUpdateData);
    return { success: true, message: "Measurement updated successfully." };
  } catch (error) {
    functions.logger.error(`Error updating measurement ${measurementId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to update measurement.");
  }
});

/**
 * HTTPS Callable: Deletes a specific measurement for the authenticated tailor.
 * Input: data (object: { measurementId: string })
 */
exports.deleteMeasurement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const tailorId = context.auth.uid;
  const measurementId = data.measurementId;

  if (!measurementId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing measurementId.");
  }

  try {
    const measurementRef = db.collection("measurements").doc(measurementId);
    const doc = await measurementRef.get();

    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Measurement not found.");
    }
    if (doc.data().tailorId !== tailorId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to delete this measurement."
      );
    }

    await measurementRef.delete();
    functions.logger.info(`Measurement deleted by UID: ${tailorId}, MeasurementID: ${measurementId}`);
    return { success: true, message: "Measurement deleted successfully." };
  } catch (error) {
    functions.logger.error(`Error deleting measurement ${measurementId} for UID: ${tailorId}`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to delete measurement.");
  }
});
