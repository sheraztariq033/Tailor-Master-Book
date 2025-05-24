import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Switch, I18nManager, Alert} from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input'; // For Profile Settings
import Loader from '../../components/ui/Loader';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { User, completeOnboarding as updateProfileThunk, logoutUser } from '../../store/slices/authSlice';
import { clearAllCustomers } from '../../store/slices/customerSlice';
import { clearAllMeasurements, clearAllCustomTemplates } from '../../store/slices/measurementSlice'; // Added clearAllCustomTemplates
import { clearAllOrders } from '../../store/slices/orderSlice';
import { clearAllInvoices } from '../../store/slices/invoiceSlice';
import { 
    triggerManualBackup, 
    triggerDataExport, 
    triggerDataImport,
    clearBackupStatus,
    clearExportStatus,
    clearImportStatus,
    clearAllDataManagementStatus // Added for logout
} from '../../store/slices/dataSlice';
import { MainAppTabParamList, RootStackParamList, SettingsStackParamList } from '../../navigation/navigationTypes';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native'; // Added useFocusEffect
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define navigation props
type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainAppTabParamList, 'SettingsTab'>,
  NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'> // Updated for SettingsNavigator context
>;

// Mocked Document Picker Function
const pickDocument = async (): Promise<{ uri: string; name: string; type: string; content: string } | null> => {
  console.log("Simulating document pick...");
  // To test cancellation: return Promise.resolve(null);
  // To test error: return Promise.reject(new Error("Document picker error"));
  const mockCustomers = [
    { name: "Mock User From File 1", phoneNumber: "9876543210", email: "mock1@example.com", notes: "Imported via JSON" }, 
    { name: "Mock User From File 2", phoneNumber: "1234567890", address: "Mock Address 2", tags: ["imported", "test"] }
  ];
  const mockFileContent = JSON.stringify(mockCustomers, null, 2);
  return Promise.resolve({ uri: "mock://path/to/customers.json", name: "customers.json", type: "application/json", content: mockFileContent });
};


const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation}) => {
  const { t, i18n } = useTranslation();
  const { colors, typography, isDarkMode, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();

  const {user, isLoading: authLoading, error: authError} = useAppSelector(state => state.auth);
  const dataManagementState = useAppSelector(state => state.data); // Data slice state

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const email = user?.email || ''; // Email is display only

  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Placeholder

  // Data Export State
  const [exportCollection, setExportCollection] = useState<'customers' | 'orders' | 'measurements' | 'invoices' | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const exportCollectionOptions = [
    {label: t('dataManagement.export.selectCollection'), value: null},
    {label: t('customers.titleMultiple'), value: 'customers'},
    {label: t('orders.titleMultiple'), value: 'orders'},
    {label: t('measurements.titleMultiple'), value: 'measurements'},
    {label: t('invoices.titleMultiple'), value: 'invoices'},
  ];
  const exportFormatOptions = [
    {label: 'JSON', value: 'json'},
    {label: 'CSV', value: 'csv'},
  ];

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBusinessName(user.businessName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      // Clear any previous data management statuses when screen is focused
      dispatch(clearBackupStatus());
      dispatch(clearExportStatus());
      dispatch(clearImportStatus());
    }, [dispatch])
  );


  const languages = [
    {label: t('languages.en'), value: 'en'},
    {label: t('languages.ur'), value: 'ur'},
  ];

  const handleLanguageChange = (value: string | number) => {
    const langCode = String(value);
    i18n.changeLanguage(langCode)
      .then(() => {
        const isRTL = langCode === 'ur';
        I18nManager.forceRTL(isRTL);
        Alert.alert(t('settingsScreen.languageChangedTitle'), t('settingsScreen.languageChangedMsg'));
      })
      .catch(err => console.error("Failed to change language", err));
  };

  const handleProfileUpdate = async () => {
    if (!user?.id) return;
    if (!name.trim() || !businessName.trim() || !phoneNumber.trim()) {
        Alert.alert(t('common.validationError'), t('profileSetupScreen.fillRequiredFields'));
        return;
    }
    const profileData: Partial<User> = {
      id: user.id, name: name.trim(), businessName: businessName.trim(), phoneNumber: phoneNumber.trim(),
      suitTypes: user.suitTypes || [], language: i18n.language, theme: isDarkMode ? 'dark' : 'light',
    };
    const resultAction = await dispatch(updateProfileThunk(profileData));
    if (updateProfileThunk.fulfilled.match(resultAction)) {
      Alert.alert(t('settingsScreen.profileUpdateSuccess'));
    } else {
      Alert.alert(t('common.error'), String(dataManagementState.backupError || authError || t('common.unknownError')));
    }
  };

  const handleManualBackup = async () => {
    dispatch(clearBackupStatus());
    const resultAction = await dispatch(triggerManualBackup());
    if (triggerManualBackup.fulfilled.match(resultAction)) {
      Alert.alert(t('dataManagement.backup.successTitle'), resultAction.payload.message);
    } else if (triggerManualBackup.rejected.match(resultAction)) {
      Alert.alert(t('dataManagement.backup.errorTitle'), String(resultAction.payload));
    }
  };

  const handleDataExport = async () => {
    if (!exportCollection) {
      Alert.alert(t('common.validationError'), t('dataManagement.export.selectCollectionError'));
      return;
    }
    dispatch(clearExportStatus());
    const resultAction = await dispatch(triggerDataExport({collectionName: exportCollection, format: exportFormat}));
    if (triggerDataExport.fulfilled.match(resultAction)) {
      Alert.alert(t('dataManagement.export.successTitle'), resultAction.payload.message);
    } else if (triggerDataExport.rejected.match(resultAction)) {
      Alert.alert(t('dataManagement.export.errorTitle'), String(resultAction.payload));
    }
  };

  const handleDataImport = async () => {
    dispatch(clearImportStatus());
    try {
      const pickedFile = await pickDocument(); // Use mocked document picker
      if (pickedFile && pickedFile.content) {
        const parsedData = JSON.parse(pickedFile.content);
        if (!Array.isArray(parsedData)) {
          throw new Error(t('dataManagement.import.invalidJsonArray'));
        }
        // For P0, only importing 'customers'
        const resultAction = await dispatch(triggerDataImport({collectionName: 'customers', data: parsedData}));
        if (triggerDataImport.fulfilled.match(resultAction)) {
          Alert.alert(t('dataManagement.import.successTitle'), resultAction.payload.message);
          // Optionally, trigger a refresh of relevant data, e.g., customer list
          dispatch(clearAllCustomers()); // To force refetch on next visit to customer list
        } else if (triggerDataImport.rejected.match(resultAction)) {
          Alert.alert(t('dataManagement.import.errorTitle'), String(resultAction.payload));
        }
      } else if (pickedFile === null) {
        // User cancelled picker
        console.log("Import cancelled by user.");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      Alert.alert(t('dataManagement.import.errorTitle'), err.message || t('common.unknownError'));
    }
  };


  const handleLogout = () => {
    Alert.alert(
        t('settingsScreen.logoutConfirmTitle'),
        t('settingsScreen.logoutConfirmMsg'),
        [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('settingsScreen.logout'),
                style: 'destructive',
                onPress: async () => {
                    dispatch(logoutUser());
                    dispatch(clearAllCustomers());
                    dispatch(clearAllMeasurements());
                    dispatch(clearAllCustomTemplates());
                    dispatch(clearAllOrders());
                    dispatch(clearAllInvoices());
                    dispatch(clearAllDataManagementStatus()); // Clear data management statuses
                    navigation.getParent<NativeStackScreenProps<RootStackParamList>['navigation']>()?.replace('Auth');
                },
            },
        ]
    );
  };
  
  // Dynamic styles based on theme
  const themedStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingBottom: 20 },
    title: { ...typography.h1, color: colors.text, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, textAlign: i18n.language === 'ur' ? 'right' : 'left'},
    card: { marginHorizontal: 15, marginBottom: 20 },
    sectionTitle: { ...typography.h3, color: colors.textSecondary, marginBottom: 15, textAlign: i18n.language === 'ur' ? 'right' : 'left' },
    settingItem: { flexDirection: i18n.language === 'ur' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    settingLabel: { ...typography.body, color: colors.text, flexShrink: 1, marginHorizontal: 5, textAlign: i18n.language === 'ur' ? 'right' : 'left' },
    emailDisplay: { ...typography.body, color: colors.textDisabled, paddingVertical: 12 }, // For non-editable email
    inputContainer: { marginBottom: 10 }, // For profile inputs
    saveProfileButton: { marginTop: 10 },
    logoutButton: { marginTop: 20, marginBottom: 30, alignSelf: 'center' },
    errorText: { ...typography.caption, color: colors.error, textAlign: 'center', marginTop: 5}
  });

  return (
    <ScrollView style={themedStyles.container}>
      <Text style={themedStyles.title}>{t('settingsScreen.title')}</Text>

      {/* Profile Settings Card */}
      <Card style={themedStyles.card}>
        <Text style={themedStyles.sectionTitle}>{t('settingsScreen.profileSettings')}</Text>
        <View style={themedStyles.inputContainer}>
            <Input label={t('profileSetupScreen.nameLabel')} value={name} onChangeText={setName} disabled={authLoading}/>
        </View>
        <View style={themedStyles.inputContainer}>
            <Input label={t('profileSetupScreen.businessNameLabel')} value={businessName} onChangeText={setBusinessName} disabled={authLoading}/>
        </View>
        <View style={themedStyles.inputContainer}>
            <Input label={t('profileSetupScreen.phoneLabel')} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" disabled={authLoading}/>
        </View>
        <View style={themedStyles.inputContainer}>
            <Text style={[typography.label, {color: colors.textSecondary}]}>{t('profileSetupScreen.emailLabel')}</Text>
            <Text style={themedStyles.emailDisplay}>{email}</Text>
        </View>
        {authError && <Text style={themedStyles.errorText}>{String(authError)}</Text>}
        <Button 
            title={t('settingsScreen.saveProfile')} 
            onPress={handleProfileUpdate} 
            isLoading={authLoading}
            style={themedStyles.saveProfileButton}
        />
      </Card>

      {/* Preferences Card */}
      <Card style={themedStyles.card}>
        <Text style={themedStyles.sectionTitle}>{t('settingsScreen.preferences')}</Text>
        <View style={themedStyles.settingItem}>
          <Text style={themedStyles.settingLabel}>{t('settingsScreen.language')}</Text>
          <Select options={languages} selectedValue={i18n.language} onValueChange={handleLanguageChange} />
        </View>
        <View style={themedStyles.settingItem}>
          <Text style={themedStyles.settingLabel}>{t('settingsScreen.darkMode')}</Text>
          <Switch trackColor={{false: colors.secondary, true: colors.primary}} thumbColor={isDarkMode ? colors.primaryDark : colors.surface} ios_backgroundColor={colors.secondaryDark} onValueChange={toggleTheme} value={isDarkMode}/>
        </View>
        <View style={themedStyles.settingItem}>
          <Text style={themedStyles.settingLabel}>{t('settingsScreen.notifications')}</Text>
          <Switch trackColor={{false: colors.secondary, true: colors.primary}} thumbColor={notificationsEnabled ? colors.primaryDark : colors.surface} onValueChange={setNotificationsEnabled} value={notificationsEnabled}/>
        </View>
      </Card>
      
      {/* Measurement Templates Management Card - Entry Point */}
      <Card style={themedStyles.card}>
        <Text style={themedStyles.sectionTitle}>{t('settingsScreen.manageTemplates')}</Text>
        <Button title={t('settingsScreen.viewEditTemplates')} onPress={() => navigation.navigate('ManageMeasurementTemplates')} />
      </Card>


      {/* Data Management Card - Placeholder actions */}
      <Card style={themedStyles.card}>
        <Text style={themedStyles.sectionTitle}>{t('settingsScreen.dataManagement')}</Text>
        <Button title={t('settingsScreen.backupData')} onPress={() => Alert.alert("Feature Info", "Data backup would be initiated here.")} variant="secondary"/>
        <Button title={t('settingsScreen.exportData')} onPress={() => Alert.alert("Feature Info", "Data export options would be shown here.")} variant="secondary"/>
      </Card>

      {/* Support Card - Placeholder actions */}
      <Card style={themedStyles.card}>
        <Text style={themedStyles.sectionTitle}>{t('settingsScreen.support')}</Text>
        <Button title={t('common.helpCenter')} onPress={() => Alert.alert("Feature Info", "Navigate to Help Center.")} />
        <Button title={t('common.contactUs')} onPress={() => Alert.alert("Feature Info", "Open Contact Us form/link.")} />
      </Card>

      <Button title={t('settingsScreen.logout')} onPress={handleLogout} variant="text" style={themedStyles.logoutButton} textStyle={{color: colors.error}} isLoading={authLoading}/>
    </ScrollView>
  );
};

export default SettingsScreen;
