import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import { AuthStackParamList, RootStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

// Props for LoginScreen within AuthStack, which is part of RootStack
type Props = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, 'Login'>,
  NativeStackScreenProps<RootStackParamList> // To navigate to MainApp or Onboarding
>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {isLoading, error, isAuthenticated, isProfileComplete, user} = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Clear error when component mounts or email/password changes
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("LoginScreen: isAuthenticated is true. User:", user, "Profile Complete:", isProfileComplete);
      if (isProfileComplete === true) { // Explicitly check for true
        navigation.replace('MainApp');
      } else if (isProfileComplete === false) { // Explicitly check for false
        navigation.replace('Onboarding');
      }
      // If isProfileComplete is null, it means it's still being determined or there was an issue.
      // The AppNavigator or a loading screen should ideally handle this intermediate state.
      // For now, we assume profile fetch completes and sets it before this effect runs post-login.
    }
  }, [isAuthenticated, isProfileComplete, navigation, user]);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.validationError'), t('loginScreen.fillFields'));
      return;
    }
    dispatch(loginUser({email, password}));
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
      minHeight: 20, // Keep space for error message
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
      ...typography.button, // Use button typography for consistency
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('loginScreen.title')}</Text>

        <View style={styles.inputContainer}>
          <Input
            label={t('loginScreen.emailLabel')}
            placeholder={t('loginScreen.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            // Themed input styles are now part of the Input component itself
          />
        </View>
        <View style={styles.inputContainer}>
          <Input
            label={t('loginScreen.passwordLabel')}
            placeholder={t('loginScreen.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            // Themed input styles are now part of the Input component itself
          />
        </View>
        
        <Text style={styles.errorText}>{error ? String(error) : ' '}</Text>

        {isLoading ? (
          <Loader size="large" />
        ) : (
          <View style={styles.buttonContainer}>
            <Button title={t('loginScreen.loginButton')} onPress={handleLogin} disabled={isLoading} />
          </View>
        )}

        <Button
          title={t('loginScreen.registerPrompt')}
          onPress={() => navigation.navigate('Register')}
          variant="text"
          style={styles.linkButton}
          textStyle={styles.linkButtonText}
          disabled={isLoading}
        />
        <Button
          title={t('loginScreen.forgotPasswordPrompt')}
          onPress={() => navigation.navigate('ForgotPassword')}
          variant="text"
          style={styles.linkButton}
          textStyle={styles.linkButtonText}
          disabled={isLoading}
        />

        <Button
          title={t('loginScreen.trackOrderPrompt')}
          onPress={() => navigation.navigate('PublicOrderTrackingModal')} // Navigate to the modal stack
          variant="text"
          style={[styles.linkButton, {marginTop: 25}]} // Add more margin
          textStyle={styles.linkButtonText}
          disabled={isLoading}
        />
      </View>
    </ScrollView>
  );
};

export default LoginScreen;
