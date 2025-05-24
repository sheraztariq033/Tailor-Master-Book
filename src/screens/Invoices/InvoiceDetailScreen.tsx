import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { InvoicesStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<InvoicesStackParamList, 'InvoiceDetail'>;

// Sample data
const invoiceDetails = {
  id: 'INV001',
  orderId: '101',
  customerName: 'Ahmad Khan',
  customerId: '1',
  generatedDate: '2024-04-10T11:00:00Z',
  dueDate: '2024-04-25T18:00:00Z',
  status: 'Paid',
  items: [
    {id: 'item1', description: 'Shalwar Kameez - Stitching Charges', quantity: 1, unitPrice: 3000, amount: 3000},
    {id: 'item2', description: 'Extra Embroidery Work', quantity: 1, unitPrice: 500, amount: 500},
  ],
  subtotal: 3500,
  tax: 0, // Assuming no tax for now
  discount: 0,
  totalAmount: 3500,
  paidAmount: 3500,
  remainingAmount: 0,
  paymentMethod: 'Cash',
  notes: 'Full payment received. Customer satisfied.',
};

const InvoiceDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {invoiceId} = route.params;
  // Fetch invoiceDetails using invoiceId in a real app

  const getStatusBadgeType = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'partially paid': return 'warning';
      case 'unpaid': return 'error';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerTopRow}>
            <Text style={styles.invoiceIdText}>Invoice #{invoiceDetails.id}</Text>
            <Badge label={invoiceDetails.status} type={getStatusBadgeType(invoiceDetails.status)} />
        </View>
        <Text style={styles.detailText}>Order ID: {invoiceDetails.orderId}</Text>
        <Text style={styles.detailText}>Customer: {invoiceDetails.customerName}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Dates</Text>
        <Text style={styles.detailText}>Generated: {new Date(invoiceDetails.generatedDate).toLocaleDateString()}</Text>
        <Text style={styles.detailText}>Due Date: {new Date(invoiceDetails.dueDate).toLocaleDateString()}</Text>
      </Card>
      
      <Card>
        <Text style={styles.sectionTitle}>Invoice Items</Text>
        {invoiceDetails.items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemDescription}>{item.description} (x{item.quantity})</Text>
            <Text style={styles.itemAmount}>Rs. {item.amount.toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.separator} />
        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>Rs. {invoiceDetails.subtotal.toLocaleString()}</Text>
        </View>
        {invoiceDetails.tax > 0 && (
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax:</Text>
                <Text style={styles.totalValue}>Rs. {invoiceDetails.tax.toLocaleString()}</Text>
            </View>
        )}
        {invoiceDetails.discount > 0 && (
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>- Rs. {invoiceDetails.discount.toLocaleString()}</Text>
            </View>
        )}
         <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.totalLabel, styles.grandTotalLabel]}>Total Amount:</Text>
            <Text style={[styles.totalValue, styles.grandTotalValue]}>Rs. {invoiceDetails.totalAmount.toLocaleString()}</Text>
        </View>
      </Card>
      
      <Card>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <Text style={styles.detailText}>Paid Amount: Rs. {invoiceDetails.paidAmount.toLocaleString()}</Text>
        <Text style={styles.detailText}>Remaining Amount: Rs. {invoiceDetails.remainingAmount.toLocaleString()}</Text>
        <Text style={styles.detailText}>Payment Method: {invoiceDetails.paymentMethod}</Text>
      </Card>

      {invoiceDetails.notes && (
        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{invoiceDetails.notes}</Text>
        </Card>
      )}

      <View style={styles.actionsContainer}>
        <Button title="Print/Share Receipt" onPress={() => console.log("Generate receipt PDF/Share")} />
        {invoiceDetails.status !== 'Paid' && (
            <Button title="Record Payment" onPress={() => console.log("Open record payment modal")} variant="secondary" style={{marginTop: 10}} />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 10,
  },
  headerCard: {
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceIdText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#444',
    flex: 3,
  },
  itemAmount: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  grandTotalRow: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: '#555',
  },
  totalValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#007bff',
  },
  notesText: {
    fontSize: 15,
    color: '#555',
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
});

export default InvoiceDetailScreen;
