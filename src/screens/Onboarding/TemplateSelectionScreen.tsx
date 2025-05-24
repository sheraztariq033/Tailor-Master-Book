import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert} from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import { OnboardingStackParamList, RootStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { completeOnboarding, User } from '../../store/slices/authSlice';

// Define props for navigation, including parent navigator for replacing the stack
type Props = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, 'TemplateSelection'>,
  NativeStackScreenProps<RootStackParamList> // Parent navigator
>;


// Sample data - in a real app, this might come from a default set or be fetched
// from the `listMeasurementTemplates` Cloud Function.
const sampleSystemTemplates = [
  {id: 'sys_mens_suit_std', nameKey: 'templates.mensSuitStd', typeKey: "suitTypes.mensSuit"},
  {id: 'sys_womens_kurti_simple', nameKey: 'templates.womensKurtiSimple', typeKey: "suitTypes.womensKurti"},
  {id: 'sys_kids_shirt_basic', nameKey: 'templates.kidsShirtBasic', typeKey: "suitTypes.kidsShirt"},
  {id: 'sys_sherwani_classic', nameKey: 'templates.sherwaniClassic', typeKey: "suitTypes.sherwani"},
];

const TemplateSelectionScreen: React.FC<Props> = ({navigation, route}) => {
  const {profileDataFromSuitTypes} = route.params;
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();
  const {isLoading, error, isProfileComplete} = useAppSelector(state => state.auth);

  // For P0, template selection itself isn't saved to user profile,
  // but this screen acts as the final step to trigger profile update.
  // We can still show selection for UI completeness.
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const toggleSelection = (templateId: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId],
    );
  };

  useEffect(() => {
    if (isProfileComplete === true) {
      // Onboarding is complete, navigate to the main app.
      // Replace the entire Onboarding stack with MainApp stack.
      navigation.getParent<NativeStackScreenProps<RootStackParamList>['navigation']>()?.replace('MainApp');
    }
  }, [isProfileComplete, navigation]);


  const handleFinishOnboarding = () => {
    // The profileDataFromSuitTypes already contains name, businessName, phone, suitTypes, uid, email.
    // For P0, we don't add selected templates to the user profile itself.
    // We just mark the profile as complete by dispatching the existing data.
    const finalProfileData: Partial<User> = {
      ...profileDataFromSuitTypes,
      // language and theme can be set to defaults or from device settings here if desired
      // For now, they are handled by Cloud Function `onUserCreate` defaults
      // or will be updated via Settings screen later.
    };
    
    console.log("Finalizing onboarding with data:", finalProfileData);
    dispatch(completeOnboarding(finalProfileData));
  };
  
  // Dynamic styles
  const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 25,
    },
    listContainer: {
      marginBottom: 20,
      flexGrow: 0, // Prevent FlatList from taking all space in ScrollView
    },
    templateCard: {
      padding: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedCard: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryDark,
    },
    templateName: {
      ...typography.body,
      fontWeight: typography.fontWeights.semibold,
      color: colors.text,
    },
    templateType: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 4,
    },
    selectedText: {
      color: colors.buttonPrimaryText,
    },
    selectedTypeText: {
      color: colors.buttonPrimaryText, // Or a slightly different shade if needed
      opacity: 0.8,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 15,
      minHeight: 20,
    },
    buttonContainer: {
      marginTop: 'auto',
      paddingVertical: 10,
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
            <Text style={styles.title}>{t('templateSelectionScreen.title')}</Text>
            <Text style={styles.subtitle}>{t('templateSelectionScreen.subtitle')}</Text>

            {/* For P0, we are just showing default templates. Actual selection and saving custom ones is P1. */}
            <FlatList
                data={sampleSystemTemplates}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                <TouchableOpacity onPress={() => toggleSelection(item.id)}>
                    <Card style={[styles.templateCard, selectedTemplateIds.includes(item.id) && styles.selectedCard]}>
                    <Text style={[styles.templateName, selectedTemplateIds.includes(item.id) && styles.selectedText]}>
                        {t(item.nameKey)}
                    </Text>
                    <Text style={[styles.templateType, selectedTemplateIds.includes(item.id) && styles.selectedTypeText]}>
                        {t('common.type')}: {t(item.typeKey)}
                    </Text>
                    </Card>
                </TouchableOpacity>
                )}
                style={styles.listContainer}
                ListEmptyComponent={<Text style={{textAlign: 'center', color: colors.textSecondary}}>{t('templateSelectionScreen.noTemplates')}</Text>}
            />
            
            <Text style={styles.errorText}>{error ? String(error) : ' '}</Text>

            {isLoading ? (
                <Loader size="large" />
            ) : (
                <View style={styles.buttonContainer}>
                    <Button
                        title={t('templateSelectionScreen.finishButton')}
                        onPress={handleFinishOnboarding}
                    />
                    <Button
                        title={t('common.back')}
                        onPress={() => navigation.goBack()}
                        variant="text"
                    />
                </View>
            )}
        </View>
    </ScrollView>
  );
};

export default TemplateSelectionScreen;
