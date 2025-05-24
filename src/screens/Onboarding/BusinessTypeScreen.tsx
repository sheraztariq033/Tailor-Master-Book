import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { OnboardingStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { User } from '../../store/slices/authSlice'; // Import User type

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BusinessType'>;

// Predefined list of common suit types
const suitTypesOptions = [
  {id: 'mens_suit', labelKey: 'suitTypes.mensSuit'},
  {id: 'womens_suit', labelKey: 'suitTypes.womensSuit'},
  {id: 'sherwani', labelKey: 'suitTypes.sherwani'},
  {id: 'kurta', labelKey: 'suitTypes.kurta'},
  {id: 'shalwar_kameez_men', labelKey: 'suitTypes.shalwarKameezMen'},
  {id: 'shalwar_kameez_women', labelKey: 'suitTypes.shalwarKameezWomen'},
  {id: 'blouse', labelKey: 'suitTypes.blouse'},
  {id: 'dress_shirt', labelKey: 'suitTypes.dressShirt'},
  {id: 'pants_trousers', labelKey: 'suitTypes.pantsTrousers'},
  {id: 'skirts', labelKey: 'suitTypes.skirts'},
  {id: 'uniforms', labelKey: 'suitTypes.uniforms'},
  {id: 'alterations', labelKey: 'suitTypes.alterations'},
  {id: 'other', labelKey: 'suitTypes.other'},
];

const BusinessTypeScreen: React.FC<Props> = ({navigation, route}) => {
  const {profileDataFromSetup} = route.params;
  const {t} = useTranslation();
  const {colors, typography} = useTheme();

  const [selectedSuitTypes, setSelectedSuitTypes] = useState<string[]>(profileDataFromSetup.suitTypes || []);

  const toggleSelection = (typeId: string) => {
    setSelectedSuitTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId],
    );
  };

  const handleNext = () => {
    if (selectedSuitTypes.length === 0) {
      Alert.alert(t('common.validationError'), t('businessTypeScreen.selectAtLeastOne'));
      return;
    }
    const updatedProfileData: User = {
      ...profileDataFromSetup,
      suitTypes: selectedSuitTypes,
    };
    navigation.navigate('TemplateSelection', {profileDataFromSuitTypes: updatedProfileData});
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
    optionsContainer: {
      marginBottom: 20,
    },
    typeCard: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border, // Use themed border color
      // Card component is already themed, specific overrides can go here
    },
    selectedCard: {
      backgroundColor: colors.primary, // Use themed primary color
      borderColor: colors.primaryDark,
    },
    typeText: {
      ...typography.body,
      color: colors.text,
    },
    selectedText: {
      ...typography.body,
      color: colors.buttonPrimaryText, // Text color for selected items
      fontWeight: fontWeights.bold,
    },
    buttonContainer: {
      marginTop: 'auto', // Push buttons to the bottom if content is short
      paddingVertical: 10,
    }
  });
  const {fontWeights} = typography; // Destructure for easier use in styles

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
            <Text style={styles.title}>{t('businessTypeScreen.title')}</Text>
            <Text style={styles.subtitle}>{t('businessTypeScreen.subtitle')}</Text>
            
            <View style={styles.optionsContainer}>
                {suitTypesOptions.map(type => (
                    <TouchableOpacity key={type.id} onPress={() => toggleSelection(type.id)}>
                    <Card style={[styles.typeCard, selectedSuitTypes.includes(type.id) && styles.selectedCard]}>
                        <Text style={[styles.typeText, selectedSuitTypes.includes(type.id) && styles.selectedText]}>
                        {t(type.labelKey)}
                        </Text>
                    </Card>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title={t('businessTypeScreen.nextButton')}
                    onPress={handleNext}
                />
                <Button
                    title={t('common.back')}
                    onPress={() => navigation.goBack()}
                    variant="text"
                />
            </View>
        </View>
    </ScrollView>
  );
};

export default BusinessTypeScreen;
