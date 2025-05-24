import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import { AuthStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store';
import { sendPasswordResetEmail, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {isLoading, error} = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError()); // Clear Redux error on mount
  }, [dispatch]);

  const handleSendResetEmail = async () => {
    setSuccessMessage(null);
    dispatch(clearError());

    if (!email.trim()) {
      Alert.alert(t('common.validationError'), t('forgotPasswordScreen.emailRequired'));
      return;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Alert.alert(t('common.validationError'), t('forgotPasswordScreen.invalidEmail'));
        return;
    }

    const resultAction = await dispatch(sendPasswordResetEmail({email}));
    if (sendPasswordResetEmail.fulfilled.match(resultAction)) {
      setSuccessMessage(t('forgotPasswordScreen.successMessage'));
      setEmail(''); // Clear email field on success
    }
    // Error is handled by the errorText display from Redux state
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
      marginBottom: 15,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
      paddingHorizontal: 10,
    },
    messageText: { // For success or error messages
      ...typography.bodySmall,
      textAlign: 'center',
      marginBottom: 15,
      minHeight: 20, // Keep space for message
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
      marginTop: 20,
    },
    linkButtonText: {
        color: colors.primary,
        ...typography.button,
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
        <Text style={styles.title}>{t('forgotPasswordScreen.title')}</Text>
        <Text style={styles.subtitle}>{t('forgotPasswordScreen.subtitle')}</Text>

        <View style={styles.inputContainer}>
            <Input
                label={t('forgotPasswordScreen.emailLabel')}
                placeholder={t('forgotPasswordScreen.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>
        
        {successMessage && (
            <Text style={[styles.messageText, {color: colors.success}]}>{successMessage}</Text>
        )}
        {error && (
            <Text style={[styles.messageText, {color: colors.error}]}>{String(error)}</Text>
        )}
        {!successMessage && !error && (<Text style={styles.messageText}> </Text>)}


        {isLoading ? (
            <Loader size="large" />
        ) : (
            <View style={styles.buttonContainer}>
            <Button title={t('forgotPasswordScreen.sendButton')} onPress={handleSendResetEmail} disabled={isLoading} />
            </View>
        )}

        <Button
            title={t('forgotPasswordScreen.backToLogin')}
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

export default ForgotPasswordScreen;
