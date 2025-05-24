import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert} from 'react-native';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { Measurement } from '../../../store/slices/measurementSlice'; // For Partial<Measurement>
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example, if icons are setup

// Define the shape of the form data this component will handle and output
export interface MeasurementFormData {
  outfitType: string;
  measurementValues: Record<string, string>; // Key-value pairs, both strings for input
  notes?: string;
}

interface MeasurementField {
  id: string; // For FlatList key
  keyName: string;
  keyValue: string;
}

interface MeasurementFormProps {
  initialData?: Partial<Measurement> | null;
  onSubmit: (formData: MeasurementFormData) => void;
  isLoading: boolean;
  customerName?: string;
}

const MeasurementForm: React.FC<MeasurementFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  customerName,
}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();

  const [outfitType, setOutfitType] = useState('');
  const [notes, setNotes] = useState('');
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([]);
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof MeasurementFormData | 'measurementFields', string>>>({});


  useEffect(() => {
    if (initialData) {
      setOutfitType(initialData.outfitType || '');
      setNotes(initialData.notes || '');
      if (initialData.measurementValues) {
        const fields = Object.entries(initialData.measurementValues).map(([key, value], index) => ({
          id: `field-${index}-${Date.now()}`, // Ensure unique ID
          keyName: key,
          keyValue: String(value), // Ensure value is string for input
        }));
        setMeasurementFields(fields.length > 0 ? fields : [{id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
      } else {
        setMeasurementFields([{id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
      }
    } else {
      // Initialize with one empty field for new measurements
      setMeasurementFields([{id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
      setOutfitType('');
      setNotes('');
    }
  }, [initialData]);

  const handleAddField = () => {
    setMeasurementFields([...measurementFields, {id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
  };

  const handleRemoveField = (id: string) => {
    if (measurementFields.length > 1) {
      setMeasurementFields(measurementFields.filter(field => field.id !== id));
    } else {
        Alert.alert(t('measurements.form.cannotRemoveLastFieldTitle'), t('measurements.form.cannotRemoveLastFieldMsg'));
    }
  };

  const handleFieldChange = (id: string, keyOrValue: 'keyName' | 'keyValue', text: string) => {
    setMeasurementFields(
      measurementFields.map(field =>
        field.id === id ? {...field, [keyOrValue]: text} : field,
      ),
    );
    if(localErrors.measurementFields) validateForm(); // Re-validate if there was a field error
  };

  const validateForm = (): boolean => {
    const errorsUpdate: Partial<Record<keyof MeasurementFormData | 'measurementFields', string>> = {};
    if (!outfitType.trim()) {
      errorsUpdate.outfitType = t('validation.required', {field: t('measurements.form.outfitTypeLabel')});
    }

    const validFields = measurementFields.filter(f => f.keyName.trim() !== '' && f.keyValue.trim() !== '');
    if (validFields.length === 0) {
        errorsUpdate.measurementFields = t('measurements.form.atLeastOneField');
    } else {
        const hasEmptyKeyOrValue = measurementFields.some(
            f => (f.keyName.trim() !== '' && f.keyValue.trim() === '') || (f.keyName.trim() === '' && f.keyValue.trim() !== '')
        );
        if (hasEmptyKeyOrValue) {
            errorsUpdate.measurementFields = t('measurements.form.emptyKeyOrValue');
        }
    }
    
    setLocalErrors(errorsUpdate);
    return Object.keys(errorsUpdate).length === 0;
  };


  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const measurementValues: Record<string, string> = {};
    measurementFields.forEach(field => {
      const key = field.keyName.trim();
      const value = field.keyValue.trim(); // Values are kept as strings
      if (key && value) { // Only include if both key and value are present
        measurementValues[key] = value;
      }
    });
    
    // Double check after processing if measurementValues is empty, even if validateForm passed (edge case)
    if (Object.keys(measurementValues).length === 0) {
        setLocalErrors(prev => ({...prev, measurementFields: t('measurements.form.atLeastOneCompleteField')}));
        return;
    }

    onSubmit({
      outfitType: outfitType.trim(),
      measurementValues,
      notes: notes.trim(),
    });
  };
  
  const styles = StyleSheet.create({
    formContainer: {
      paddingBottom: 20, // Space for the final button
    },
    customerContextText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 16,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
    },
    fieldInputContainer: {
      flex: 1,
      marginRight: 8,
    },
    removeButton: {
      padding: 8, // Make touch target larger
      // backgroundColor: colors.error, // Example styling for remove button
      // borderRadius: 20,
    },
    removeButtonText: { // If using a text button
        color: colors.error,
        ...typography.caption,
        fontWeight: typography.fontWeights.bold,
    },
    addMoreButton: {
      marginTop: 10,
      marginBottom: 20,
    },
    errorText: {
        ...typography.bodySmall,
        color: colors.error,
        marginTop: 4,
        textAlign: 'center'
    },
    submitButton: {
        marginTop: 20,
    }
  });

  const renderMeasurementField = ({item, index}: {item: MeasurementField; index: number}) => (
    <View style={styles.fieldRow}>
      <View style={styles.fieldInputContainer}>
        <Input
          label={t('measurements.form.measurementNameLabel')}
          value={item.keyName}
          onChangeText={text => handleFieldChange(item.id, 'keyName', text)}
          placeholder={t('measurements.form.measurementNamePlaceholder', {example: 'Chest'})}
          disabled={isLoading}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.fieldInputContainer}>
        <Input
          label={t('measurements.form.valueLabel')}
          value={item.keyValue}
          onChangeText={text => handleFieldChange(item.id, 'keyValue', text)}
          placeholder={t('measurements.form.valuePlaceholder', {example: '38'})}
          keyboardType="numeric" // Suggest numeric, but accept string
          disabled={isLoading}
        />
      </View>
      {measurementFields.length > 1 && (
        <TouchableOpacity onPress={() => handleRemoveField(item.id)} style={styles.removeButton} disabled={isLoading}>
          {/* <Icon name="delete-outline" size={24} color={colors.error} /> */}
          <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.formContainer}>
      {customerName && (
        <Text style={styles.customerContextText}>
          {t('measurements.form.forCustomer', {name: customerName})}
        </Text>
      )}

      <View style={styles.inputContainer}>
        <Input
          label={t('measurements.form.outfitTypeLabel') + "*"}
          value={outfitType}
          onChangeText={(text) => {setOutfitType(text); if(localErrors.outfitType) validateForm();}}
          placeholder={t('measurements.form.outfitTypePlaceholder')}
          error={localErrors.outfitType}
          disabled={isLoading}
          autoCapitalize="words"
        />
      </View>

      <Text style={{...typography.label, color: colors.text, marginBottom: 8}}>{t('measurements.form.fieldsTitle')}</Text>
      {localErrors.measurementFields && <Text style={styles.errorText}>{localErrors.measurementFields}</Text>}
      
      <FlatList
        data={measurementFields}
        renderItem={renderMeasurementField}
        keyExtractor={item => item.id}
        // scrollEnabled={false} // If this form is already in a ScrollView
      />
      
      <Button
        title={t('measurements.form.addFieldButton')}
        onPress={handleAddField}
        variant="outline"
        style={styles.addMoreButton}
        disabled={isLoading}
      />

      <View style={styles.inputContainer}>
        <Input
          label={t('measurements.form.notesLabel')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('measurements.form.notesPlaceholder')}
          multiline
          numberOfLines={3}
          style={{height: 80, textAlignVertical: 'top'}}
          disabled={isLoading}
        />
      </View>
      
      <Button
        title={initialData ? t('common.updateChanges') : t('common.saveEntity', {entity: t('measurements.singular')})}
        onPress={handleSubmit}
        isLoading={isLoading}
        style={styles.submitButton}
      />
    </View>
  );
};

export default MeasurementForm;
