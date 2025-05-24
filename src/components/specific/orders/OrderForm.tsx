import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image} from 'react-native';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Select from '../../ui/Select'; // Assuming Select component is themed or simple enough
import Card from '../../ui/Card';
import { Order } from '../../../store/slices/orderSlice';
import { Customer } from '../../../store/slices/customerSlice';
import { Measurement } from '../../../store/slices/measurementSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format, parseISO} from 'date-fns';
import * as imagePickerService from '../../../services/imagePickerService'; // Import the service

// Define the shape of the form data this component will handle and output
export interface OrderFormData {
  customerId: string | null;
  measurementId: string | null;
  outfitType: string;
  orderDate: string; // ISO string YYYY-MM-DD
  deadlineDate: string; // ISO string YYYY-MM-DD
  features: Record<string, string>; // Key-value for simplicity
  images: Array<{ uri: string; type: 'local' | 'remote'; name?: string }>;
  notes: string;
  totalAmount: string;
  paidAmount: string;
}

interface OrderFormProps {
  initialData?: Partial<Order> | null;
  customers: Customer[];
  measurementsForSelectedCustomer: Measurement[];
  onSubmit: (formData: OrderFormData, newLocalImagesToUpload: Array<{uri: string, name: string}>) => void;
  isLoading: boolean;
  isUploadingImages?: boolean;
  onCustomerSelected: (customerId: string | null) => void; // Callback when customer changes
}

const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  customers,
  measurementsForSelectedCustomer,
  onSubmit,
  isLoading,
  isUploadingImages,
  onCustomerSelected,
}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const [outfitType, setOutfitType] = useState('');
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deadlineDate, setDeadlineDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [featuresString, setFeaturesString] = useState('{}'); // Store features as JSON string in form
  const [images, setImages] = useState<Array<{ uri: string; type: 'local' | 'remote'; name?: string }>>([]);
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setCustomerId(initialData.customerId || null);
      setMeasurementId(initialData.measurementId || null);
      setOutfitType(initialData.outfitType || '');
      setOrderDate(initialData.orderDate ? format(typeof initialData.orderDate === 'string' ? parseISO(initialData.orderDate) : new Date(initialData.orderDate._seconds * 1000), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setDeadlineDate(initialData.deadlineDate ? format(typeof initialData.deadlineDate === 'string' ? parseISO(initialData.deadlineDate) : new Date(initialData.deadlineDate._seconds * 1000), 'yyyy-MM-dd') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
      setFeaturesString(JSON.stringify(initialData.features || {}, null, 2));
      setImages(initialData.images?.map(img => ({ uri: img, type: 'remote' })) || []);
      setNotes(initialData.notes || '');
      setTotalAmount(String(initialData.totalAmount || ''));
      setPaidAmount(String(initialData.paidAmount || ''));
      if(initialData.customerId) onCustomerSelected(initialData.customerId); // Trigger measurement load
    } else {
        // Reset form for "Add" mode or if initialData is null
        setCustomerId(null);
        setMeasurementId(null);
        setOutfitType('');
        setOrderDate(format(new Date(), 'yyyy-MM-dd'));
        setDeadlineDate(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
        setFeaturesString('{}');
        setImages([]);
        setNotes('');
        setTotalAmount('');
        setPaidAmount('');
        onCustomerSelected(null); // Clear any previously loaded measurements for a customer
    }
  }, [initialData, onCustomerSelected]);

  const customerOptions = useMemo(() => customers.map(c => ({label: c.name, value: c.id})), [customers]);
  const measurementOptions = useMemo(() => 
    measurementsForSelectedCustomer.map(m => ({
        label: `${m.outfitType} (${format(typeof m.takenDate === 'string' ? parseISO(m.takenDate) : new Date(m.takenDate._seconds * 1000), 'PP')})`, 
        value: m.id
    })), [measurementsForSelectedCustomer]);

  const handleCustomerChange = (selectedCustId: string | number | null) => {
    const newCustomerId = selectedCustId ? String(selectedCustId) : null;
    setCustomerId(newCustomerId);
    setMeasurementId(null); // Reset measurement when customer changes
    onCustomerSelected(newCustomerId); // Notify parent to fetch measurements
    if(localErrors.customerId) validateForm();
  };

  const handleMeasurementChange = (selectedMeasId: string | number | null) => {
    const newMeasurementId = selectedMeasId ? String(selectedMeasId) : null;
    setMeasurementId(newMeasurementId);
    // Optionally auto-fill outfitType if a measurement is selected
    const selectedMeasurement = measurementsForSelectedCustomer.find(m => m.id === newMeasurementId);
    if (selectedMeasurement && !outfitType) { // Only if outfitType is empty
      setOutfitType(selectedMeasurement.outfitType);
    }
    if(localErrors.measurementId) validateForm();
  };
  
  // Simplified image handling
  const handleAddImage = async () => {
    try {
      const response = await imagePickerService.launchAppImageLibrary({selectionLimit: 5 - images.length}); // Limit selection
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (response.errorCode || response.errorMessage) {
        Alert.alert(t('orders.form.imagePickerErrorTitle'), response.errorMessage || response.errorCode);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const newImages = response.assets.map(asset => ({
          uri: asset.uri!, // uri should be present if not cancelled and no error
          type: 'local' as 'local' | 'remote',
          name: asset.fileName || `image_${Date.now()}.${asset.type?.split('/')[1] || 'jpg'}`,
        }));
        setImages(prevImages => [...prevImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error launching image library:', error);
      Alert.alert(t('orders.form.imagePickerErrorTitle'), String(error) || t('common.unknownError'));
    }
  };

  const handleRemoveImage = (uriToRemove: string) => {
    setImages(images.filter(img => img.uri !== uriToRemove));
  };

  const validateForm = (): boolean => {
    const errorsUpdate: Partial<Record<keyof OrderFormData, string>> = {};
    if (!customerId) errorsUpdate.customerId = t('validation.required', {field: t('orders.form.customerLabel')});
    if (!measurementId) errorsUpdate.measurementId = t('validation.required', {field: t('orders.form.measurementLabel')});
    if (!outfitType.trim()) errorsUpdate.outfitType = t('validation.required', {field: t('orders.form.outfitTypeLabel')});
    if (!orderDate) errorsUpdate.orderDate = t('validation.required', {field: t('orders.form.orderDateLabel')});
    if (!deadlineDate) errorsUpdate.deadlineDate = t('validation.required', {field: t('orders.form.deadlineDateLabel')});
    if (!totalAmount.trim() || isNaN(parseFloat(totalAmount))) errorsUpdate.totalAmount = t('validation.invalidFormat', {field: t('orders.form.totalAmountLabel')});
    if (paidAmount.trim() && isNaN(parseFloat(paidAmount))) errorsUpdate.paidAmount = t('validation.invalidFormat', {field: t('orders.form.paidAmountLabel')});
    try { JSON.parse(featuresString); } catch (e) { errorsUpdate.features = t('validation.invalidJson'); }

    setLocalErrors(errorsUpdate);
    return Object.keys(errorsUpdate).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const newLocalImagesToUpload = images
        .filter(img => img.type === 'local' && img.name)
        .map(img => ({uri: img.uri, name: img.name!}));
        
    const remoteImageUris = images
        .filter(img => img.type === 'remote')
        .map(img => img.uri);

    onSubmit({
      customerId,
      measurementId,
      outfitType: outfitType.trim(),
      orderDate,
      deadlineDate,
      features: JSON.parse(featuresString),
      images: remoteImageUris, // Send only existing remote URIs, new ones will be added by thunk after upload
      notes: notes.trim(),
      totalAmount: String(parseFloat(totalAmount) || 0), // Ensure it's a string for consistency, thunk will parse
      paidAmount: String(parseFloat(paidAmount) || 0),
    }, newLocalImagesToUpload);
  };
  
  const styles = StyleSheet.create({
    formContainer: { paddingBottom: 20 },
    inputContainer: { marginBottom: 16 },
    label: { ...typography.label, color: colors.textSecondary, marginBottom: 4 },
    imagePreviewContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
    imageWrapper: { marginRight: 10, marginBottom: 10, position: 'relative' },
    imageThumbnail: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.border },
    removeImageButton: { position: 'absolute', top: -5, right: -5, backgroundColor: colors.error, borderRadius: 12, padding: 4, zIndex: 10 },
    removeImageText: { color: colors.buttonPrimaryText, fontSize: 12, fontWeight: 'bold'},
    errorText: { ...typography.caption, color: colors.error, marginTop: 2},
    submitButton: { marginTop: 20 },
    uploadingText: { ...typography.body, color: colors.primary, textAlign: 'center', marginVertical: 10 },
  });

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Select
          label={t('orders.form.customerLabel') + "*"}
          options={customerOptions}
          selectedValue={customerId}
          onValueChange={handleCustomerChange}
          placeholder={t('orders.form.customerPlaceholder')}
          disabled={isLoading || isUploadingImages}
          error={localErrors.customerId}
        />
      </View>

      <View style={styles.inputContainer}>
        <Select
          label={t('orders.form.measurementLabel') + "*"}
          options={measurementOptions}
          selectedValue={measurementId}
          onValueChange={handleMeasurementChange}
          placeholder={t('orders.form.measurementPlaceholder')}
          disabled={isLoading || isUploadingImages || !customerId || measurementsForSelectedCustomer.length === 0}
          error={localErrors.measurementId}
        />
        {customerId && measurementsForSelectedCustomer.length === 0 && (
            <Text style={styles.errorText}>{t('orders.form.noMeasurementsForCustomer')}</Text>
        )}
      </View>

      <Input label={t('orders.form.outfitTypeLabel') + "*"} value={outfitType} onChangeText={setOutfitType} placeholder={t('orders.form.outfitTypePlaceholder')} disabled={isLoading || isUploadingImages} error={localErrors.outfitType} containerStyle={styles.inputContainer} autoCapitalize="words"/>
      <Input label={t('orders.form.orderDateLabel') + "*"} value={orderDate} onChangeText={setOrderDate} placeholder="YYYY-MM-DD" disabled={isLoading || isUploadingImages} error={localErrors.orderDate} containerStyle={styles.inputContainer}/>
      <Input label={t('orders.form.deadlineDateLabel') + "*"} value={deadlineDate} onChangeText={setDeadlineDate} placeholder="YYYY-MM-DD" disabled={isLoading || isUploadingImages} error={localErrors.deadlineDate} containerStyle={styles.inputContainer}/>
      <Input label={t('orders.form.featuresLabel')} value={featuresString} onChangeText={setFeaturesString} placeholder='e.g., {"Collar": "Round", "Sleeves": "Half"}' multiline style={{height: 80, textAlignVertical: 'top'}} disabled={isLoading || isUploadingImages} error={localErrors.features} containerStyle={styles.inputContainer}/>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('orders.form.imagesLabel')}</Text>
        <View style={styles.imagePreviewContainer}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{uri: img.uri}} style={styles.imageThumbnail} />
              <TouchableOpacity onPress={() => handleRemoveImage(img.uri)} style={styles.removeImageButton} disabled={isLoading || isUploadingImages}>
                <Text style={styles.removeImageText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Button title={t('orders.form.addImageButton')} onPress={handleAddImage} variant="outline" disabled={isLoading || isUploadingImages || images.length >= 5} />
         {isUploadingImages && <Text style={styles.uploadingText}>{t('orders.form.uploadingImages')}</Text>}
      </View>

      <Input label={t('orders.form.notesLabel')} value={notes} onChangeText={setNotes} placeholder={t('orders.form.notesPlaceholder')} multiline style={{height: 100, textAlignVertical: 'top'}} disabled={isLoading || isUploadingImages} containerStyle={styles.inputContainer}/>
      <Input label={t('orders.form.totalAmountLabel') + "*"} value={totalAmount} onChangeText={setTotalAmount} placeholder="0.00" keyboardType="numeric" disabled={isLoading || isUploadingImages} error={localErrors.totalAmount} containerStyle={styles.inputContainer}/>
      <Input label={t('orders.form.paidAmountLabel')} value={paidAmount} onChangeText={setPaidAmount} placeholder="0.00" keyboardType="numeric" disabled={isLoading || isUploadingImages} error={localErrors.paidAmount} containerStyle={styles.inputContainer}/>

      <Button
        title={initialData ? t('common.updateChanges') : t('common.saveEntity', {entity: t('orders.singular')})}
        onPress={handleSubmit}
        isLoading={isLoading || isUploadingImages}
        style={styles.submitButton}
      />
    </View>
  );
};

export default OrderForm;
