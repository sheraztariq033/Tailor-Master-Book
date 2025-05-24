import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Loader from '../../components/ui/Loader';
import MeasurementTemplateForm, { MeasurementTemplateFormData } from '../../components/specific/templates/MeasurementTemplateForm';
import { SettingsStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { 
    addNewCustomMeasurementTemplate, 
    updateExistingCustomMeasurementTemplate, 
    fetchCustomMeasurementTemplates, // To get existing template for edit mode or find by ID
    clearTemplateError,
    MeasurementTemplate
} from '../../store/slices/measurementSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AddEditMeasurementTemplate'>;

const AddEditMeasurementTemplateScreen: React.FC<Props> = ({route, navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {templateId} = route.params || {};
  const isEditing = !!templateId;

  const {
    isLoadingTemplates, 
    templateError,
    customMeasurementTemplates
  } = useAppSelector(state => state.measurement);
  
  const [initialTemplateData, setInitialTemplateData] = useState<Partial<MeasurementTemplate> | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false); // Separate loading for initial fetch

  useEffect(() => {
    navigation.setOptions({ 
      title: isEditing ? t('templates.editTitle') : t('templates.addTitle') 
    });

    if (isEditing && templateId) {
      const existingTemplate = customMeasurementTemplates.find(t => t.id === templateId);
      if (existingTemplate) {
        setInitialTemplateData(existingTemplate);
      } else {
        // If not found in current list (e.g. deep link, or list not yet loaded), fetch all and find
        setIsFetchingDetails(true);
        dispatch(fetchCustomMeasurementTemplates())
          .unwrap() // unwrap to handle promise result here
          .then((templates) => {
            const found = templates.find(t => t.id === templateId);
            if (found) setInitialTemplateData(found);
            else Alert.alert(t('common.error'), t('templates.notFound'));
          })
          .catch(() => Alert.alert(t('common.error'), t('templates.errorFetching')))
          .finally(() => setIsFetchingDetails(false));
      }
    } else {
      setInitialTemplateData(null); // Ensure form is clear for Add mode
    }
  }, [dispatch, isEditing, templateId, navigation, t, customMeasurementTemplates]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(clearTemplateError());
      };
    }, [dispatch])
  );

  const handleFormSubmit = async (formData: MeasurementTemplateFormData) => {
    const dataToSubmit = {
      name: formData.name,
      outfitType: formData.outfitType,
      defaultValues: formData.defaultValues, // Already Record<string, string>
    };

    let resultAction;
    if (isEditing && templateId) {
      resultAction = await dispatch(updateExistingCustomMeasurementTemplate({ 
        templateId, 
        dataToUpdate: dataToSubmit 
    }));
    } else {
      resultAction = await dispatch(addNewCustomMeasurementTemplate(dataToSubmit));
    }

    if (resultAction.meta.requestStatus === 'fulfilled') {
      Alert.alert(
        t(isEditing ? 'templates.updateSuccessTitle' : 'templates.addSuccessTitle'),
        t(isEditing ? 'templates.updateSuccessMessage' : 'templates.addSuccessMessage', { name: dataToSubmit.name })
      );
      navigation.navigate('ManageMeasurementTemplates', { refresh: true });
    } else {
      // Error is handled by the templateError state variable and displayed below
      // Alert.alert(t('common.error'), templateError ? String(templateError) : t('common.unknownError'));
    }
  };
  
  const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: { flex: 1, padding: 20, backgroundColor: colors.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center', marginBottom: 10 },
  });

  if (isEditing && (isFetchingDetails || (isLoadingTemplates && !initialTemplateData))) {
    return (
      <View style={styles.loaderContainer}>
        <Loader size="large" />
        <Text style={{color: colors.textSecondary, marginTop: 10}}>{t('templates.loadingDetails')}</Text>
      </View>
    );
  }
  if (isEditing && !initialTemplateData && !isFetchingDetails && !isLoadingTemplates) { // Failed to load for edit
     return (
        <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>{t('templates.notFoundOrError')}</Text>
            <Button title={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
    );
  }

  return (
    <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <MeasurementTemplateForm
          initialData={initialTemplateData}
          onSubmit={handleFormSubmit}
          isLoading={isLoadingTemplates && !isFetchingDetails} // Disable form only during submit, not initial fetch
        />
        {templateError && (
          <Text style={styles.errorText}>{String(templateError)}</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default AddEditMeasurementTemplateScreen;
