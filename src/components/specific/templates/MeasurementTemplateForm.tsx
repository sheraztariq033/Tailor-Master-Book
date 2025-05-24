import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert} from 'react-native';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { MeasurementTemplate } from '../../../store/slices/measurementSlice';
import { MeasurementValues } from '../../../store/slices/measurementSlice'; // Re-use for defaultValues
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

// Define the shape of the form data this component will handle and output
export interface MeasurementTemplateFormData {
  name: string;
  outfitType: string;
  defaultValues: Record<string, string>; // Key-value pairs, both strings for input
}

interface MeasurementField {
  id: string; // For FlatList key
  keyName: string;
  keyValue: string;
}

interface MeasurementTemplateFormProps {
  initialData?: Partial<MeasurementTemplate> | null;
  onSubmit: (formData: MeasurementTemplateFormData) => void;
  isLoading: boolean;
}

const MeasurementTemplateForm: React.FC<MeasurementTemplateFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();

  const [name, setName] = useState('');
  const [outfitType, setOutfitType] = useState('');
  const [defaultFields, setDefaultFields] = useState<MeasurementField[]>([]); // Renamed from measurementFields
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof MeasurementTemplateFormData | 'defaultValuesFields', string>>>({});


  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setOutfitType(initialData.outfitType || '');
      if (initialData.defaultValues) {
        const fields = Object.entries(initialData.defaultValues).map(([key, value], index) => ({
          id: `field-${index}-${Date.now()}`,
          keyName: key,
          keyValue: String(value),
        }));
        setDefaultFields(fields.length > 0 ? fields : [{id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
      } else {
        setDefaultFields([{id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
      }
    } else {
      setDefaultFields([{id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
      setName('');
      setOutfitType('');
    }
  }, [initialData]);

  const handleAddField = () => {
    setDefaultFields([...defaultFields, {id: `new-${Date.now()}`, keyName: '', keyValue: ''}]);
  };

  const handleRemoveField = (id: string) => {
    if (defaultFields.length > 1) {
      setDefaultFields(defaultFields.filter(field => field.id !== id));
    } else {
        Alert.alert(t('templates.form.cannotRemoveLastFieldTitle'), t('templates.form.cannotRemoveLastFieldMsg'));
    }
  };

  const handleFieldChange = (id: string, keyOrValue: 'keyName' | 'keyValue', text: string) => {
    setDefaultFields(
      defaultFields.map(field =>
        field.id === id ? {...field, [keyOrValue]: text} : field,
      ),
    );
    if(localErrors.defaultValuesFields) validateForm(); // Re-validate if there was a field error
  };

  const validateForm = (): boolean => {
    const errorsUpdate: Partial<Record<keyof MeasurementTemplateFormData | 'defaultValuesFields', string>> = {};
    if (!name.trim()) {
      errorsUpdate.name = t('validation.required', {field: t('templates.form.nameLabel')});
    }
    if (!outfitType.trim()) {
      errorsUpdate.outfitType = t('validation.required', {field: t('templates.form.outfitTypeLabel')});
    }

    const validFields = defaultFields.filter(f => f.keyName.trim() !== '' && f.keyValue.trim() !== '');
    if (validFields.length === 0) {
        errorsUpdate.defaultValuesFields = t('templates.form.atLeastOneDefaultValue');
    } else {
        const hasEmptyKeyOrValue = defaultFields.some(
            f => (f.keyName.trim() !== '' && f.keyValue.trim() === '') || (f.keyName.trim() === '' && f.keyValue.trim() !== '')
        );
        if (hasEmptyKeyOrValue) {
            errorsUpdate.defaultValuesFields = t('templates.form.emptyKeyOrValueDefault');
        }
    }
    
    setLocalErrors(errorsUpdate);
    return Object.keys(errorsUpdate).length === 0;
  };


  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const defaultValues: Record<string, string> = {};
    defaultFields.forEach(field => {
      const key = field.keyName.trim();
      const value = field.keyValue.trim();
      if (key && value) { 
        defaultValues[key] = value;
      }
    });
    
    if (Object.keys(defaultValues).length === 0) {
        setLocalErrors(prev => ({...prev, defaultValuesFields: t('templates.form.atLeastOneCompleteDefaultValue')}));
        return;
    }

    onSubmit({
      name: name.trim(),
      outfitType: outfitType.trim(),
      defaultValues,
    });
  };
  
  const styles = StyleSheet.create({
    formContainer: { paddingBottom: 20 },
    inputContainer: { marginBottom: 16 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
    fieldInputContainer: { flex: 1, marginRight: 8 },
    removeButton: { padding: 8 },
    removeButtonText: { color: colors.error, ...typography.caption, fontWeight: typography.fontWeights.bold },
    addMoreButton: { marginTop: 10, marginBottom: 20 },
    errorText: { ...typography.bodySmall, color: colors.error, marginTop: 4, textAlign: 'center' },
    submitButton: { marginTop: 20 },
    sectionTitle: { ...typography.label, color: colors.text, marginBottom: 8, marginTop: 10 }
  });

  const renderDefaultValueField = ({item}: {item: MeasurementField}) => (
    <View style={styles.fieldRow}>
      <View style={styles.fieldInputContainer}>
        <Input
          label={t('templates.form.fieldNameLabel')}
          value={item.keyName}
          onChangeText={text => handleFieldChange(item.id, 'keyName', text)}
          placeholder={t('templates.form.fieldNamePlaceholder', {example: 'Chest'})}
          disabled={isLoading}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.fieldInputContainer}>
        <Input
          label={t('templates.form.defaultValueLabel')}
          value={item.keyValue}
          onChangeText={text => handleFieldChange(item.id, 'keyValue', text)}
          placeholder={t('templates.form.valuePlaceholder', {example: '38'})}
          // keyboardType="numeric" // Default values can be strings or numbers initially
          disabled={isLoading}
        />
      </View>
      {defaultFields.length > 1 && (
        <TouchableOpacity onPress={() => handleRemoveField(item.id)} style={styles.removeButton} disabled={isLoading}>
          <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Input
          label={t('templates.form.nameLabel') + "*"}
          value={name}
          onChangeText={(text) => {setName(text); if(localErrors.name) validateForm();}}
          placeholder={t('templates.form.namePlaceholder')}
          error={localErrors.name}
          disabled={isLoading}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Input
          label={t('templates.form.outfitTypeLabel') + "*"}
          value={outfitType}
          onChangeText={(text) => {setOutfitType(text); if(localErrors.outfitType) validateForm();}}
          placeholder={t('templates.form.outfitTypePlaceholder')}
          error={localErrors.outfitType}
          disabled={isLoading}
          autoCapitalize="words"
        />
      </View>

      <Text style={styles.sectionTitle}>{t('templates.form.defaultValuesTitle')}</Text>
      {localErrors.defaultValuesFields && <Text style={styles.errorText}>{localErrors.defaultValuesFields}</Text>}
      
      <FlatList
        data={defaultFields}
        renderItem={renderDefaultValueField}
        keyExtractor={item => item.id}
      />
      
      <Button
        title={t('templates.form.addFieldButton')}
        onPress={handleAddField}
        variant="outline"
        style={styles.addMoreButton}
        disabled={isLoading}
      />
      
      <Button
        title={initialData ? t('common.updateChanges') : t('common.saveEntity', {entity: t('templates.singular')})}
        onPress={handleSubmit}
        isLoading={isLoading}
        style={styles.submitButton}
      />
    </View>
  );
};

export default MeasurementTemplateForm;
