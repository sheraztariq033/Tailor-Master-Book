import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import { Order } from '../../../store/slices/orderSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format} from 'date-fns'; // For formatting dates

interface OrderListItemProps {
  order: Order;
  onPress: (orderId: string) => void;
  customerName?: string; // Optional, as it might not always be readily available
}

const OrderListItem: React.FC<OrderListItemProps> = ({ order, onPress, customerName }) => {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  const deadlineDate = typeof order.deadlineDate === 'string' 
    ? new Date(order.deadlineDate) 
    : new Date(order.deadlineDate._seconds * 1000);
    
  const orderDate = typeof order.orderDate === 'string' 
    ? new Date(order.orderDate) 
    : new Date(order.orderDate._seconds * 1000);

  const getStatusBadgeType = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received': return 'primary';
      case 'designing': return 'info';
      case 'cutting': return 'info';
      case 'stitching': return 'warning';
      case 'trial': return 'warning';
      case 'ready': return 'success';
      case 'picked_up': return 'default'; // Or a specific color for completed/archived
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  const styles = StyleSheet.create({
    card: {
      marginBottom: 10,
      // Card component is already themed
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderIdAndCustomer: {
      flex: 1, // Allow text to take available space before status badge
    },
    orderIdText: {
      ...typography.h5,
      color: colors.text,
      fontWeight: typography.fontWeights.bold,
    },
    customerText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    outfitType: {
      ...typography.body,
      color: colors.text,
      fontWeight: typography.fontWeights.semibold,
      marginVertical: 4,
    },
    dateInfoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
      marginBottom: 6,
    },
    dateText: {
      ...typography.caption,
      color: colors.textDisabled,
    },
    amountText: {
      ...typography.body,
      color: colors.primary, // Highlight the amount
      fontWeight: typography.fontWeights.bold,
      textAlign: 'right',
      marginTop: 8,
    }
  });

  return (
    <TouchableOpacity onPress={() => onPress(order.id)}>
      <Card style={styles.card} shadow={true}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIdAndCustomer}>
            <Text style={styles.orderIdText}>{t('orders.listItem.orderIdPrefix', {id: order.id.substring(0, 6)})}</Text>
            <Text style={styles.customerText}>
              {customerName || t('orders.listItem.customerId', {id: order.customerId.substring(0,6)})}
            </Text>
          </View>
          <Badge label={t(`orderStatus.${order.status}`, order.status)} type={getStatusBadgeType(order.status)} />
        </View>
        
        <Text style={styles.outfitType}>{order.outfitType}</Text>
        
        <View style={styles.dateInfoContainer}>
            <Text style={styles.dateText}>
                {t('orders.listItem.orderDate')}: {format(orderDate, 'PP')}
            </Text>
            <Text style={styles.dateText}>
                {t('orders.listItem.deadline')}: {format(deadlineDate, 'PP')}
            </Text>
        </View>
        
        <Text style={styles.amountText}>
            {t('orders.listItem.total')}: {t('common.currencySymbol')}{order.totalAmount.toLocaleString()}
        </Text>
      </Card>
    </TouchableOpacity>
  );
};

export default OrderListItem;
