import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import { Invoice } from '../../../store/slices/invoiceSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format, parseISO} from 'date-fns';

interface InvoiceListItemProps {
  invoice: Invoice;
  onPress: (invoiceId: string) => void;
  customerName?: string;
}

const InvoiceListItem: React.FC<InvoiceListItemProps> = ({ invoice, onPress, customerName }) => {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  const generatedDate = typeof invoice.generatedDate === 'string' 
    ? parseISO(invoice.generatedDate) 
    : new Date(invoice.generatedDate._seconds * 1000);

  const getStatusBadgeType = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      case 'unpaid': return 'error';
      case 'overdue': return 'error'; // Could be a different shade of red
      case 'refunded': return 'default';
      default: return 'default';
    }
  };
  
  const styles = StyleSheet.create({
    card: {
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    invoiceIdAndCustomer: {
      flex: 1,
    },
    invoiceIdText: {
      ...typography.h5,
      color: colors.text,
      fontWeight: typography.fontWeights.bold,
    },
    customerText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 2,
    },
    dateAndAmountContainer: {
      marginTop: 8,
    },
    detailText: {
      ...typography.body,
      color: colors.text,
      marginBottom: 4,
    },
    amountText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: typography.fontWeights.bold,
      textAlign: 'right', // Align amount to the right if desired
    }
  });

  return (
    <TouchableOpacity onPress={() => onPress(invoice.id)}>
      <Card style={styles.card} shadow={true}>
        <View style={styles.cardHeader}>
          <View style={styles.invoiceIdAndCustomer}>
            <Text style={styles.invoiceIdText}>{t('invoices.listItem.invoiceIdPrefix', {id: invoice.id.substring(0, 6)})}</Text>
            <Text style={styles.customerText}>
              {customerName || t('invoices.listItem.customerId', {id: invoice.customerId.substring(0,6)})}
            </Text>
          </View>
          <Badge 
            label={t(`invoiceStatus.${invoice.paymentStatus}`, invoice.paymentStatus)} 
            type={getStatusBadgeType(invoice.paymentStatus)} 
          />
        </View>
        
        <View style={styles.dateAndAmountContainer}>
            <Text style={styles.detailText}>
                {t('invoices.listItem.generatedDate')}: {format(generatedDate, 'PP')}
            </Text>
            <Text style={styles.amountText}>
                {t('invoices.listItem.totalAmount')}: {t('common.currencySymbol')}{invoice.totalAmount.toLocaleString()}
            </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default InvoiceListItem;
