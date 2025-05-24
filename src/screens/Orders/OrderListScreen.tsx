import React from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { OrdersStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderList'>;

const sampleOrders = [
  {id: '101', customerName: 'Ahmad Khan', outfit: 'Shalwar Kameez', deadline: '2024-04-15', status: 'Stitching'},
  {id: '102', customerName: 'Fatima Ali', outfit: 'Wedding Dress', deadline: '2024-05-01', status: 'Designing'},
  {id: '103', customerName: 'Usman Tariq', outfit: 'Suit', deadline: '2024-04-20', status: 'Ready'},
];

const OrderListScreen: React.FC<Props> = ({navigation}) => {
  const getStatusBadgeType = (status: string) => {
    switch (status.toLowerCase()) {
      case 'stitching': return 'info';
      case 'designing': return 'warning';
      case 'ready': return 'success';
      case 'picked_up': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const renderOrder = ({item}: {item: typeof sampleOrders[0]}) => (
    <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', {orderId: item.id})}>
      <Card style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Badge label={item.status} type={getStatusBadgeType(item.status)} />
        </View>
        <Text style={styles.customerName}>{item.customerName} - {item.outfit}</Text>
        <Text style={styles.deadline}>Deadline: {item.deadline}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button
        title="Create New Order"
        onPress={() => navigation.navigate('AddEditOrder', {})} // No orderId for new
        style={styles.addButton}
      />
      <FlatList
        data={sampleOrders}
        renderItem={renderOrder}
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
  addButton: {
    margin: 15,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  orderCard: {
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
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  customerName: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  deadline: {
    fontSize: 14,
    color: '#888',
  },
});

export default OrderListScreen;
