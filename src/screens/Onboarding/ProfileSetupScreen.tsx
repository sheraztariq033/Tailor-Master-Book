import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { OnboardingStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store'; // To get existing user data for pre-fill

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen: React.FC<Props> = ({navigation, route}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const authUser = useAppSelector(state => state.auth.user); // Get user from Redux for pre-fill
  const firebaseUser = useAppSelector(state => state.auth.firebaseUser); // Get firebase user for email/phone pre-fill

  const [name, setName] = useState(authUser?.name || firebaseUser?.displayName || '');
  const [businessName, setBusinessName] = useState(authUser?.businessName || '');
  const [phoneNumber, setPhoneNumber] = useState(authUser?.phoneNumber || firebaseUser?.phoneNumber || '');
  // Email is typically fixed from Firebase Auth, but allow to show it. UID is also fixed.
  const email = authUser?.email || firebaseUser?.email || '';
  const uid = authUser?.id || firebaseUser?.uid || '';


  const handleNext = () => {
    if (!name.trim() || !businessName.trim() || !phoneNumber.trim()) {
      Alert.alert(t('common.validationError'), t('profileSetupScreen.fillRequiredFields'));
      return;
    }

    const profileData = {
      uid: uid, // Ensure UID is passed along
      name: name.trim(),
      businessName: businessName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email, // Pass along the email
      // isProfileComplete will be determined by the backend/slice logic after all steps
    };
    navigation.navigate('BusinessType', {profileDataFromSetup: profileData});
  };
  
  // Dynamic styles
  const styles = StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
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
      marginBottom: 30,
    },
    inputContainer: {
      marginBottom: 15,
    },
    emailText: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: 5,
    },
    emailValue: {
        ...typography.body,
        color: colors.text,
        paddingVertical: 12, // Similar to input padding
        paddingHorizontal: 10,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: colors.inputBackground, // Show as non-editable but styled like input
        opacity: 0.7, // Indicate non-editable
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('profileSetupScreen.title')}</Text>
        <Text style={styles.subtitle}>{t('profileSetupScreen.subtitle')}</Text>
        
        <View style={styles.inputContainer}>
          <Input
            label={t('profileSetupScreen.nameLabel') + "*"}
            value={name}
            onChangeText={setName}
            placeholder={t('profileSetupScreen.namePlaceholder')}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.inputContainer}>
          <Input
            label={t('profileSetupScreen.businessNameLabel') + "*"}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder={t('profileSetupScreen.businessNamePlaceholder')}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.inputContainer}>
          <Input
            label={t('profileSetupScreen.phoneLabel') + "*"}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder={t('profileSetupScreen.phonePlaceholder')}
            keyboardType="phone-pad"
          />
        </View>
        {email && (
            <View style={styles.inputContainer}>
                <Text style={styles.emailText}>{t('profileSetupScreen.emailLabel')}</Text>
                <Text style={styles.emailValue}>{email}</Text>
            </View>
        )}

        <Button 
            title={t('profileSetupScreen.nextButton')} 
            onPress={handleNext} 
        />
      </View>
    </ScrollView>
  );
};

export default ProfileSetupScreen;
