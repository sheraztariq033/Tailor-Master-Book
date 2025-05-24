import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import { AuthStackParamList, RootStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Register'>,
  NativeStackScreenProps<RootStackParamList> // To navigate to Onboarding
>;

const RegisterScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {isLoading, error, isAuthenticated, isProfileComplete} = useAppSelector(state => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError()); // Clear Redux error on mount
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
        // After successful registration and profile fetch, user will be authenticated.
        // isProfileComplete will determine where to go. Firebase onUserCreate + fetchAndSetUserProfile handles this.
        // If profile is not complete (which is expected after fresh registration), navigate to Onboarding.
        // If somehow profile is complete (e.g. re-registering an existing email after deletion, not typical), go to MainApp.
        if (isProfileComplete === false) {
            navigation.replace('Onboarding');
        } else if (isProfileComplete === true) {
            navigation.replace('MainApp');
        }
        // If isProfileComplete is null, wait for it to be determined. AppNavigator should show loader.
    }
  }, [isAuthenticated, isProfileComplete, navigation]);

  const handleRegister = () => {
    setLocalError(null); // Clear local error
    dispatch(clearError()); // Clear Redux error

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError(t('registerScreen.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(t('registerScreen.passwordsDontMatch'));
      return;
    }
    if (password.length < 6) {
      setLocalError(t('registerScreen.passwordTooShort'));
      return;
    }
    // Additional email validation can be added here

    dispatch(registerUser({name, email, password}));
  };
  
  const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 15,
      minHeight: 20,
    },
    inputContainer: {
      width: '100%',
      marginBottom: 10,
    },
    buttonContainer: {
      width: '100%',
      marginTop: 10,
    },
    linkButton: {
      marginTop: 15,
    },
    linkButtonText: {
        color: colors.primary,
        ...typography.button,
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
        <Text style={styles.title}>{t('registerScreen.title')}</Text>

        <View style={styles.inputContainer}>
            <Input
                label={t('registerScreen.nameLabel')}
                placeholder={t('registerScreen.namePlaceholder')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
            />
        </View>
        <View style={styles.inputContainer}>
            <Input
                label={t('registerScreen.emailLabel')}
                placeholder={t('registerScreen.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>
        <View style={styles.inputContainer}>
            <Input
                label={t('registerScreen.passwordLabel')}
                placeholder={t('registerScreen.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
        </View>
        <View style={styles.inputContainer}>
            <Input
                label={t('registerScreen.confirmPasswordLabel')}
                placeholder={t('registerScreen.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />
        </View>
        
        <Text style={styles.errorText}>
            {localError || (error ? String(error) : ' ')}
        </Text>

        {isLoading ? (
            <Loader size="large" />
        ) : (
            <View style={styles.buttonContainer}>
            <Button title={t('registerScreen.registerButton')} onPress={handleRegister} disabled={isLoading} />
            </View>
        )}

        <Button
            title={t('registerScreen.loginPrompt')}
            onPress={() => navigation.navigate('Login')}
            variant="text"
            style={styles.linkButton}
            textStyle={styles.linkButtonText}
            disabled={isLoading}
        />
        </View>
    </ScrollView>
  );
};

export default RegisterScreen;
