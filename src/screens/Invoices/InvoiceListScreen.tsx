import React from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { InvoicesStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<InvoicesStackParamList, 'InvoiceList'>;

const sampleInvoices = [
  {id: 'INV001', orderId: '101', customerName: 'Ahmad Khan', date: '2024-04-10', total: 3500, status: 'Paid'},
  {id: 'INV002', orderId: '102', customerName: 'Fatima Ali', date: '2024-04-12', total: 12000, status: 'Partially Paid'},
  {id: 'INV003', orderId: '103', customerName: 'Usman Tariq', date: '2024-04-18', total: 5000, status: 'Unpaid'},
];

const InvoiceListScreen: React.FC<Props> = ({navigation}) => {
  const getStatusBadgeType = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'partially paid': return 'warning';
      case 'unpaid': return 'error';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const renderInvoice = ({item}: {item: typeof sampleInvoices[0]}) => (
    <TouchableOpacity onPress={() => navigation.navigate('InvoiceDetail', {invoiceId: item.id})}>
      <Card style={styles.invoiceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.invoiceId}>Invoice #{item.id}</Text>
          <Badge label={item.status} type={getStatusBadgeType(item.status)} />
        </View>
        <Text style={styles.detailText}>Order ID: {item.orderId}</Text>
        <Text style={styles.detailText}>Customer: {item.customerName}</Text>
        <Text style={styles.detailText}>Date: {item.date}</Text>
        <Text style={styles.totalText}>Total: Rs. {item.total.toLocaleString()}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Invoices are usually generated from Orders, so a "Create New Invoice" button might be less common here.
          It could be part of the OrderDetailScreen.
      <Button
        title="Create New Invoice"
        onPress={() => console.log("Navigate to create invoice screen or flow")}
        style={styles.addButton}
      /> */}
      <FlatList
        data={sampleInvoices}
        renderItem={renderInvoice}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  // addButton: { // If needed
  //   margin: 15,
  // },
  listContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  invoiceCard: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  totalText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 5,
  },
});

export default InvoiceListScreen;
