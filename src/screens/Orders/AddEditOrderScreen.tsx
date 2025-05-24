import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select'; // Assuming Select component exists
import { OrdersStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OrdersStackParamList, 'AddEditOrder'>;

// Sample data for editing
const existingOrderData = {
  id: '101',
  customerId: '1', // Link to existing customer
  customerName: 'Ahmad Khan', // Usually fetched or passed
  outfitType: 'Shalwar Kameez (3 Piece)',
  orderDate: new Date().toISOString().split('T')[0], // Today's date
  deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // A week from now
  features: {
    fabric: 'Cotton - White',
    collar: 'Standard',
    cuffs: 'Buttoned',
  },
  notes: 'Comfortable fit.',
  totalAmount: 3500,
  paidAmount: 1000,
  status: 'Received',
};

const AddEditOrderScreen: React.FC<Props> = ({route, navigation}) => {
  const orderId = route.params?.orderId;
  const customerIdFromParams = route.params?.customerId; // For creating a new order for a specific customer
  const isEditing = !!orderId;

  const [customerId, setCustomerId] = useState(customerIdFromParams || '');
  const [outfitType, setOutfitType] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to one week from now
  );
  // Features would be more complex, maybe a dynamic list of Input fields or a JSON editor for simplicity
  const [featuresString, setFeaturesString] = useState('{}'); 
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [status, setStatus] = useState('received'); // Default status

  // Sample customers for select (in a real app, fetch or search)
  const [customers, setCustomers] = useState([
    {label: 'Ahmad Khan (ID:1)', value: '1'}, 
    {label: 'Fatima Ali (ID:2)', value: '2'}
  ]);
  const orderStatuses = [
    {label: 'Received', value: 'received'},
    {label: 'Designing', value: 'designing'},
    {label: 'Cutting', value: 'cutting'},
    {label: 'Stitching', value: 'stitching'},
    {label: 'Trial', value: 'trial'},
    {label: 'Ready', value: 'ready'},
    {label: 'Picked Up', value: 'picked_up'},
    {label: 'Cancelled', value: 'cancelled'},
  ];


  useEffect(() => {
    if (isEditing && orderId) {
      // Fetch order data using orderId and populate state
      setCustomerId(existingOrderData.customerId);
      setOutfitType(existingOrderData.outfitType);
      setOrderDate(existingOrderData.orderDate);
      setDeadlineDate(existingOrderData.deadlineDate);
      setFeaturesString(JSON.stringify(existingOrderData.features, null, 2));
      setNotes(existingOrderData.notes);
      setTotalAmount(String(existingOrderData.totalAmount));
      setPaidAmount(String(existingOrderData.paidAmount));
      setStatus(existingOrderData.status);
      navigation.setOptions({ title: 'Edit Order #' + orderId });
    } else {
      navigation.setOptions({ title: 'Create New Order' });
      if (customerIdFromParams) {
        setCustomerId(customerIdFromParams);
      }
    }
  }, [isEditing, orderId, navigation, customerIdFromParams]);

  const handleSaveOrder = () => {
    if (!customerId || !outfitType.trim() || !totalAmount) {
      Alert.alert('Validation Error', 'Customer, Outfit Type, and Total Amount are required.');
      return;
    }
    try {
      const parsedFeatures = JSON.parse(featuresString);
      const orderData = {
        customerId,
        outfitType,
        orderDate,
        deadlineDate,
        features: parsedFeatures,
        notes,
        totalAmount: parseFloat(totalAmount) || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        status,
      };
      if (isEditing) {
        console.log('Updating order:', orderId, orderData);
        // Call update service
      } else {
        console.log('Creating new order:', orderData);
        // Call create service
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Features JSON is invalid.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Edit Order' : 'Create New Order'}</Text>
      
      <Select 
        label="Customer*"
        options={customers}
        selectedValue={customerId}
        onValueChange={(val) => setCustomerId(String(val))}
        placeholder="Select Customer"
      />
      {/* In a real app, you might have a "Add New Customer" button here or a search functionality */}

      <Input label="Outfit Type*" value={outfitType} onChangeText={setOutfitType} placeholder="e.g., Men's Suit, Kurti" />
      <Input label="Order Date*" value={orderDate} onChangeText={setOrderDate} placeholder="YYYY-MM-DD" />
      <Input label="Deadline Date*" value={deadlineDate} onChangeText={setDeadlineDate} placeholder="YYYY-MM-DD" />
      
      <Input 
        label="Features (JSON format)" 
        value={featuresString} 
        onChangeText={setFeaturesString} 
        placeholder='e.g., {"fabric": "Cotton", "color": "Blue"}' 
        multiline 
        style={{height: 100}}
      />
      
      <Input label="Notes (Optional)" value={notes} onChangeText={setNotes} placeholder="Specific instructions or details" multiline style={{height: 80}}/>
      <Input label="Total Amount*" value={totalAmount} onChangeText={setTotalAmount} placeholder="Enter total order amount" keyboardType="numeric" />
      <Input label="Paid Amount (Optional)" value={paidAmount} onChangeText={setPaidAmount} placeholder="Enter amount paid" keyboardType="numeric" />

      {isEditing && (
         <Select 
            label="Order Status"
            options={orderStatuses}
            selectedValue={status}
            onValueChange={(val) => setStatus(String(val))}
        />
      )}

      <Button title={isEditing ? 'Save Changes' : 'Create Order'} onPress={handleSaveOrder} style={styles.saveButton} />
      <Button title="Cancel" onPress={() => navigation.goBack()} variant="text" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  saveButton: {
    marginTop: 20,
  }
});

export default AddEditOrderScreen;
