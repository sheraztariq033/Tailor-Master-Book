import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import Input from '../../ui/Input';
import Button from '../../ui/Button'; // Only if submit button is part of this form
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Customer } from '../../../store/slices/customerSlice'; // For Partial<Customer>

// Define the shape of the form data this component will handle and output
export interface CustomerFormData {
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  tags?: string; // Comma-separated string for simplicity
  notes?: string;
}

interface CustomerFormProps {
  initialData?: Partial<Customer> | null; // For pre-filling form (Edit mode)
  onSubmit: (formData: CustomerFormData) => void;
  isLoading?: boolean; // To disable form/button during submission
  // Error display might be handled by the parent screen, or passed as a prop
  // serverError?: string | null; 
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  // serverError,
}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated string
  const [notes, setNotes] = useState('');

  // Local form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setTags(initialData.tags?.join(', ') || '');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
    if (!name.trim()) newErrors.name = t('validation.required', {field: t('customers.form.nameLabel')});
    if (!phoneNumber.trim()) newErrors.phoneNumber = t('validation.required', {field: t('customers.form.phoneLabel')});
    // Add more specific validation if needed (e.g., phone format, email format)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        name,
        phoneNumber,
        email,
        address,
        tags,
        notes,
      });
    }
  };
  
  const styles = StyleSheet.create({
    formContainer: {
      padding: 0, // Parent screen will handle padding
    },
    inputContainer: {
      marginBottom: 16,
    },
    // Submit button is typically in the parent screen to control dispatch
    // errorText: { // If displaying server error passed via props
    //   ...typography.bodySmall,
    //   color: colors.error,
    //   textAlign: 'center',
    //   marginBottom: 10,
    // }
  });

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Input
          label={t('customers.form.nameLabel') + "*"}
          value={name}
          onChangeText={(text) => { setName(text); if (errors.name) validate(); }}
          placeholder={t('customers.form.namePlaceholder')}
          autoCapitalize="words"
          error={errors.name}
          disabled={isLoading}
        />
      </View>
      <View style={styles.inputContainer}>
        <Input
          label={t('customers.form.phoneLabel') + "*"}
          value={phoneNumber}
          onChangeText={(text) => { setPhoneNumber(text); if (errors.phoneNumber) validate(); }}
          placeholder={t('customers.form.phonePlaceholder')}
          keyboardType="phone-pad"
          error={errors.phoneNumber}
          disabled={isLoading}
        />
      </View>
      <View style={styles.inputContainer}>
        <Input
          label={t('customers.form.emailLabel')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('customers.form.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={isLoading}
        />
      </View>
      <View style={styles.inputContainer}>
        <Input
          label={t('customers.form.addressLabel')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('customers.form.addressPlaceholder')}
          multiline
          numberOfLines={3}
          style={{height: 80, textAlignVertical: 'top'}}
          disabled={isLoading}
        />
      </View>
      <View style={styles.inputContainer}>
        <Input
          label={t('customers.form.tagsLabel')}
          value={tags}
          onChangeText={setTags}
          placeholder={t('customers.form.tagsPlaceholder')}
          helperText={t('customers.form.tagsHelper')}
          disabled={isLoading}
        />
      </View>
      <View style={styles.inputContainer}>
        <Input
          label={t('customers.form.notesLabel')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('customers.form.notesPlaceholder')}
          multiline
          numberOfLines={4}
          style={{height: 100, textAlignVertical: 'top'}}
          disabled={isLoading}
        />
      </View>
      
      {/* Submit button is typically rendered by the parent screen (AddEditCustomerScreen)
          to have access to dispatch and navigation directly.
          If it were part of this component, it would look like:
      <Button
        title={initialData ? t('common.saveChanges') : t('common.addEntity', {entity: t('customers.singular')})}
        onPress={handleSubmit}
        isLoading={isLoading} // Assuming Button has isLoading prop
      />
      */}
    </View>
  );
};

export default CustomerForm;
