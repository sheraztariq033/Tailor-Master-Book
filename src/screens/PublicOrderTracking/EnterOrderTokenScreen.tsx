import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import { PublicOrderTrackingStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchPublicOrder, clearPublicOrderStatus, clearOrderError } from '../../store/slices/orderSlice'; // Reusing clearOrderError for publicOrderError
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<PublicOrderTrackingStackParamList, 'EnterOrderToken'>;

const EnterOrderTokenScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {isLoadingPublicOrder, publicOrderError, publicOrderStatus} = useAppSelector(state => state.order);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Clear previous status and errors when screen mounts
    dispatch(clearPublicOrderStatus());
    dispatch(clearOrderError()); // Assuming publicOrderError is cleared by clearOrderError for simplicity
  }, [dispatch]);

  const handleTrackOrder = async () => {
    if (!token.trim()) {
      Alert.alert(t('common.validationError'), t('publicOrderTracking.tokenRequired'));
      return;
    }
    dispatch(clearPublicOrderStatus()); // Clear previous results before new fetch
    dispatch(clearOrderError());

    const resultAction = await dispatch(fetchPublicOrder(token.trim()));
    
    if (fetchPublicOrder.fulfilled.match(resultAction)) {
      // Navigation to PublicOrderDetailScreen will occur if publicOrderStatus is successfully populated.
      // This can be handled by a useEffect watching publicOrderStatus or directly here.
      // For simplicity, let's assume a useEffect in this screen or a parent navigator handles it.
      // Or, navigate directly:
      navigation.navigate('PublicOrderDetail', { token: token.trim() });
    } 
    // Error is handled by publicOrderError state and displayed
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
    errorText: {
      ...typography.bodySmall,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 15,
      minHeight: 20,
    },
    inputContainer: {
      width: '100%',
      marginBottom: 20,
    },
    buttonContainer: {
      width: '100%',
      marginTop: 10,
    },
    closeButton: { // If this screen is presented modally, a close button might be nice
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        zIndex: 1,
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Optional: Close button if presented as a full modal screen that doesn't use stack header */}
        {/* <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={{color: colors.primary, fontSize: 16}}>Close</Text>
        </TouchableOpacity> */}

        <Text style={styles.title}>{t('publicOrderTracking.enterTokenTitle')}</Text>
        <Text style={styles.subtitle}>{t('publicOrderTracking.enterTokenSubtitle')}</Text>

        <View style={styles.inputContainer}>
            <Input
                label={t('publicOrderTracking.tokenInputLabel')}
                placeholder={t('publicOrderTracking.tokenInputPlaceholder')}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
        
        <Text style={styles.errorText}>{publicOrderError ? String(publicOrderError) : ' '}</Text>

        {isLoadingPublicOrder ? (
            <Loader size="large" />
        ) : (
            <View style={styles.buttonContainer}>
                <Button title={t('publicOrderTracking.trackButton')} onPress={handleTrackOrder} disabled={isLoadingPublicOrder} />
            </View>
        )}
      </View>
    </ScrollView>
  );
};

export default EnterOrderTokenScreen;
