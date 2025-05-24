import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Card from '../../ui/Card'; // Assuming Card is in components/ui
import Badge from '../../ui/Badge'; // Assuming Badge is in components/ui
import { Customer } from '../../../store/slices/customerSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next'; // For potential future use (e.g. "Tags:")

interface CustomerListItemProps {
  customer: Customer;
  onPress: (customerId: string) => void;
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({ customer, onPress }) => {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    card: {
      marginBottom: 10,
      // Card component is already themed, specific overrides for list item can go here
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    customerName: {
      ...typography.h5, // Use a heading style for name
      color: colors.text,
      flexShrink: 1, // Ensure name doesn't push other elements out
    },
    customerPhone: {
      ...typography.body,
      color: colors.primary, // Highlight phone number
      marginLeft: 10, // Add some space if name is long
    },
    detailText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    tagBadge: {
      marginRight: 5,
      marginBottom: 5,
    }
  });

  return (
    <TouchableOpacity onPress={() => onPress(customer.id)}>
      <Card style={styles.card} shadow={true}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phoneNumber}</Text>
        </View>
        
        {customer.email && (
          <Text style={styles.detailText}>{t('common.email')}: {customer.email}</Text>
        )}
        
        {/* Optionally display a snippet of notes or address if needed in list view */}
        {/* <Text style={styles.detailText} numberOfLines={1}>
          {customer.notes || customer.address || ''}
        </Text> */}

        {customer.tags && customer.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {customer.tags.slice(0, 3).map((tag, index) => ( // Show max 3 tags for brevity
              <Badge key={index} label={tag} type="info" style={styles.tagBadge} />
            ))}
            {customer.tags.length > 3 && <Text style={styles.detailText}>...</Text>}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

export default CustomerListItem;
