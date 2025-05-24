import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Modal as RNModal, Platform} from 'react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import Select from '../../components/ui/Select'; // For status change
import { OrdersStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
// import ImageViewer from 'react-native-image-zoom-viewer'; // Placeholder for if library was available
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';


import { useAppDispatch, useAppSelector } from '../../store';
import { 
    fetchOrderDetails, 
    clearSelectedOrder, 
    clearOrderError, 
    removeOrder,
    changeOrderStatus,
    generateTokenForOrder,
    clearShareableToken,
    Order
} from '../../store/slices/orderSlice';
import { fetchCustomerDetails, clearSelectedCustomer as clearReduxSelectedCustomer } from '../../store/slices/customerSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format, parseISO} from 'date-fns';

// Mock ImageViewer if not installed
const ImageViewer = ({imageUrls, index, onCancel, enableSwipeDown, renderHeader}: any) => (
    <RNModal visible={true} onRequestClose={onCancel}>
        <View style={{flex:1, backgroundColor: 'black', justifyContent:'center', alignItems:'center'}}>
            {renderHeader()}
            <Text style={{color:'white', fontSize:18, marginBottom:10}}>Image Viewer Placeholder</Text>
            <Image source={{uri: imageUrls[index]?.url}} style={{width:300, height:300, resizeMode:'contain'}}/>
            <Text style={{color:'white', marginTop:10}}>{imageUrls[index]?.url}</Text>
        </View>
    </RNModal>
);


type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

const ORDER_STATUS_OPTIONS = ["received", "designing", "cutting", "stitching", "trial", "ready", "picked_up", "cancelled"].map(s => ({label: s, value: s}));


const OrderDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();
  const {orderId} = route.params;

  const {
    selectedOrder, 
    isLoading: isOrderLoading, 
    error: orderError,
    shareableOrderToken,
    isLoadingShareToken,
    shareError
  } = useAppSelector(state => state.order);
  const {selectedCustomer, isLoading: isCustomerLoading} = useAppSelector(state => state.customer);

  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [imagesForViewer, setImagesForViewer] = useState<{url: string}[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showTokenArea, setShowTokenArea] = useState(false);

  const loadData = useCallback(() => {
    if (orderId) {
      dispatch(fetchOrderDetails(orderId))
        .unwrap()
        .then((fetchedOrder) => {
          if (fetchedOrder && fetchedOrder.customerId) {
            dispatch(fetchCustomerDetails(fetchedOrder.customerId));
          }
        })
        .catch((err) => console.error("Failed to fetch order details or customer details:", err));
    }
  }, [dispatch, orderId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setShowTokenArea(false); 
      dispatch(clearShareableToken()); 
      return () => {
        dispatch(clearSelectedOrder());
        dispatch(clearOrderError());
        dispatch(clearReduxSelectedCustomer());
        dispatch(clearShareableToken());
      };
    }, [dispatch, loadData])
  );

  useEffect(() => {
    if (selectedOrder && selectedOrder.id === orderId) {
      const customerNameToDisplay = selectedCustomer?.name || selectedOrder.customerId.substring(0,6);
      navigation.setOptions({ title: t('orders.detailTitle', {customer: customerNameToDisplay, outfit: selectedOrder.outfitType}) });
      
      if(selectedOrder.images && selectedOrder.images.length > 0){
        setImagesForViewer(selectedOrder.images.map(imgUrl => ({ url: imgUrl })));
      } else {
        setImagesForViewer([]);
      }
    } else {
      navigation.setOptions({ title: t('orders.detailTitleGeneric') });
    }
  }, [navigation, selectedOrder, orderId, t, selectedCustomer]);

  const handleGenerateToken = async () => {
    if (!selectedOrder) return;
    setShowTokenArea(true);
    const resultAction = await dispatch(generateTokenForOrder(selectedOrder.id));
    if (generateTokenForOrder.fulfilled.match(resultAction)) {
        Alert.alert(t('orders.share.tokenGeneratedTitle'), t('orders.share.tokenGeneratedSuccess'));
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert(t('common.copied'), t('orders.share.tokenCopiedToClipboard'));
  };

  const onShareLink = async (token: string) => {
    const shareableLink = `https://darzibook.example.com/track?token=${token}`; // Replace with actual domain/path
    try {
      await Share.open({
        title: t('orders.share.shareLinkTitle'),
        message: t('orders.share.shareLinkMessage', {link: shareableLink}),
        url: shareableLink,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleDeleteOrder = () => {
    if (!selectedOrder) return;
    Alert.alert(
      t('orders.deleteConfirmTitle', {outfit: selectedOrder.outfitType}),
      t('orders.deleteConfirmMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            const resultAction = await dispatch(removeOrder(selectedOrder.id));
            if (removeOrder.fulfilled.match(resultAction)) {
              Alert.alert(t('orders.deleteSuccessTitle'), t('orders.deleteSuccessMessage'));
              navigation.navigate('OrderList', {refresh: true});
            } else {
              Alert.alert(t('common.error'), String(orderError || t('common.unknownError')));
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = async (newStatus: string | number) => {
    if (!selectedOrder || typeof newStatus !== 'string' || selectedOrder.status === newStatus) return;
    
    const resultAction = await dispatch(changeOrderStatus({orderId: selectedOrder.id, newStatus}));
    if (changeOrderStatus.fulfilled.match(resultAction)) {
        Alert.alert(t('orders.statusUpdateSuccessTitle'), t('orders.statusUpdateSuccessMessage', {status: t(`orderStatus.${newStatus}`, newStatus)}));
    } else {
        Alert.alert(t('common.error'), String(orderError || t('common.unknownError')));
    }
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };
  
  const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: { flex: 1, padding: 10, backgroundColor: colors.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { ...typography.body, color: colors.error, textAlign: 'center', padding: 20 },
    headerCard: { marginBottom: 15, padding: 20 },
    titleSection: { alignItems: 'center', marginBottom: 10 },
    outfitType: { ...typography.h2, color: colors.text, textAlign: 'center' },
    customerNameLink: { ...typography.h5, color: colors.primary, textDecorationLine: 'underline', marginVertical: 5 },
    sectionTitle: { ...typography.h4, color: colors.textSecondary, marginTop: 15, marginBottom: 10, paddingHorizontal: 5 },
    detailItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    detailLabel: { ...typography.body, fontWeight: typography.fontWeights.semibold, color: colors.textSecondary, flex: 1 },
    detailValue: { ...typography.body, color: colors.text, flex: 2, textAlign: 'right' },
    badgeContainer: { alignItems: 'flex-end' },
    featuresList: { marginLeft: 10 },
    featureItem: { ...typography.body, color: colors.text, marginBottom: 4 },
    notesText: { ...typography.body, color: colors.text, fontStyle: 'italic', lineHeight: typography.body.fontSize * 1.5 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    imageThumbnailTouchable: { marginRight: 10, marginBottom: 10 },
    imageThumbnail: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.border },
    actionsContainer: { marginTop: 20, marginBottom: 20 },
    actionButton: { marginVertical: 6 },
    deleteButtonText: { color: colors.error, fontWeight: typography.fontWeights.bold },
    statusChangeContainer: { paddingVertical: 10 },
    shareTokenCard: { marginTop:10, },
    shareTokenTitle: { ...typography.h5, color: colors.textSecondary, marginBottom:10 },
    tokenText: { ...typography.body, backgroundColor: colors.border, padding:10, borderRadius: 5, color: colors.text, marginBottom:10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'},
    shareActionsContainer: { flexDirection: 'row', justifyContent: 'space-around'},
    shareErrorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center', marginTop: 10 },
  });


  if ((isOrderLoading || (selectedOrder?.customerId && isCustomerLoading && !selectedCustomer)) && !selectedOrder) {
    return <View style={styles.loaderContainer}><Loader size="large" /></View>;
  }

  if (orderError && !selectedOrder) {
    return <Text style={styles.errorText}>{t('common.errorLoadingDetails', {entity: t('orders.singular')})}: {String(orderError)}</Text>;
  }
  if (!selectedOrder) {
    return <View style={styles.loaderContainer}><Text style={styles.errorText}>{t('orders.notFound')}</Text><Button title={t('common.backToList')} onPress={() => navigation.navigate('OrderList')} /></View>;
  }

  const orderDate = typeof selectedOrder.orderDate === 'string' ? parseISO(selectedOrder.orderDate) : new Date(selectedOrder.orderDate._seconds * 1000);
  const deadline = typeof selectedOrder.deadlineDate === 'string' ? parseISO(selectedOrder.deadlineDate) : new Date(selectedOrder.deadlineDate._seconds * 1000);
  const remainingAmount = selectedOrder.totalAmount - selectedOrder.paidAmount;
  const shareableLink = shareableOrderToken ? `https://darzibook.example.com/track?token=${shareableOrderToken}` : '';


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <Card style={styles.headerCard}>
        <View style={styles.titleSection}>
          <Text style={styles.outfitType}>{selectedOrder.outfitType}</Text>
          {selectedCustomer ? (
            <TouchableOpacity onPress={() => navigation.navigate('CustomerDetail', {customerId: selectedCustomer.id})}>
              <Text style={styles.customerNameLink}>{selectedCustomer.name}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.customerNameLink}>{t('orders.customerId', {id: selectedOrder.customerId.substring(0,6)})}</Text>
          )}
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>{t('orders.statusLabel')}:</Text>
          <View style={styles.badgeContainer}>
            <Badge label={t(`orderStatus.${selectedOrder.status}`, selectedOrder.status)} type={OrderListItem.prototype.getStatusBadgeType(selectedOrder.status)} />
          </View>
        </View>
      </Card>

      {/* ... other Card sections for details, features, notes, images ... */}
      {/* (Assuming these sections are already implemented as per previous subtask) */}
       <Card>
        <Text style={styles.sectionTitle}>{t('orders.detailsSectionTitle')}</Text>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.form.orderDateLabel')}:</Text><Text style={styles.detailValue}>{format(orderDate, 'PPpp')}</Text></View>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.form.deadlineDateLabel')}:</Text><Text style={styles.detailValue}>{format(deadline, 'PPpp')}</Text></View>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.form.totalAmountLabel')}:</Text><Text style={styles.detailValue}>{t('common.currencySymbol')}{selectedOrder.totalAmount.toLocaleString()}</Text></View>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.form.paidAmountLabel')}:</Text><Text style={styles.detailValue}>{t('common.currencySymbol')}{selectedOrder.paidAmount.toLocaleString()}</Text></View>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.remainingAmountLabel')}:</Text><Text style={styles.detailValue}>{t('common.currencySymbol')}{remainingAmount.toLocaleString()}</Text></View>
      </Card>

      {selectedOrder.features && Object.keys(selectedOrder.features).length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>{t('orders.featuresSectionTitle')}</Text>
          <View style={styles.featuresList}>
            {Object.entries(selectedOrder.features).map(([key, value]) => (
              <Text key={key} style={styles.featureItem}>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}</Text>
            ))}
          </View>
        </Card>
      )}

      {selectedOrder.notes && (
        <Card>
          <Text style={styles.sectionTitle}>{t('orders.form.notesLabel')}</Text>
          <Text style={styles.notesText}>{selectedOrder.notes}</Text>
        </Card>
      )}

      {selectedOrder.images && selectedOrder.images.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>{t('orders.form.imagesLabel')}</Text>
          <View style={styles.imageGrid}>
            {selectedOrder.images.map((imgUrl, index) => (
              <TouchableOpacity key={index} onPress={() => openImageViewer(index)} style={styles.imageThumbnailTouchable}>
                <Image source={{uri: imgUrl}} style={styles.imageThumbnail} resizeMode="cover"/>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}
      {imagesForViewer.length > 0 && (
          <RNModal visible={isImageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
            <ImageViewer 
                imageUrls={imagesForViewer} 
                index={selectedImageIndex}
                onCancel={() => setImageViewerVisible(false)}
                enableSwipeDown={true}
                renderHeader={() => (
                    <TouchableOpacity style={{position: 'absolute', top: 40, right: 20, zIndex: 10}} onPress={() => setImageViewerVisible(false)}>
                        <Text style={{color: 'white', fontSize: 18, backgroundColor: 'rgba(0,0,0,0.3)', padding:10, borderRadius:5}}>X</Text>
                    </TouchableOpacity>
                )}
            />
          </RNModal>
      )}


      <Card>
        <Text style={styles.sectionTitle}>{t('orders.changeStatusSectionTitle')}</Text>
        <View style={styles.statusChangeContainer}>
            <Select
                label={t('orders.statusLabel')}
                options={ORDER_STATUS_OPTIONS.map(s => ({label: t(`orderStatus.${s.value}`, s.value), value: s.value}))}
                selectedValue={selectedOrder.status}
                onValueChange={handleStatusChange}
                disabled={isOrderLoading}
            />
        </View>
      </Card>

      {/* Share Order Status Section */}
      <Card style={styles.shareTokenCard}>
        <Text style={styles.sectionTitle}>{t('orders.share.title')}</Text>
        {!showTokenArea ? (
            <Button 
                title={t('orders.share.generateTokenButton')} 
                onPress={handleGenerateToken} 
                isLoading={isLoadingShareToken}
            />
        ) : isLoadingShareToken ? (
            <Loader />
        ) : shareError ? (
            <Text style={styles.shareErrorText}>{String(shareError)}</Text>
        ) : shareableOrderToken ? (
            <View>
                <Text style={styles.shareTokenTitle}>{t('orders.share.yourToken')}:</Text>
                <Text selectable style={styles.tokenText}>{shareableOrderToken}</Text>
                <Text style={styles.shareTokenTitle}>{t('orders.share.shareableLink')}:</Text>
                <Text selectable style={styles.tokenText}>{shareableLink}</Text>
                <View style={styles.shareActionsContainer}>
                    <Button title={t('orders.share.copyToken')} onPress={() => copyToClipboard(shareableOrderToken)} variant="outline" style={{flex:1, marginRight:5}} />
                    <Button title={t('orders.share.shareLink')} onPress={() => onShareLink(shareableOrderToken)} variant="outline" style={{flex:1, marginLeft:5}}/>
                </View>
                <Button title={t('orders.share.generateNewToken')} onPress={handleGenerateToken} variant="text" style={{marginTop:15}}/>
            </View>
        ) : null}
      </Card>


      <View style={styles.actionsContainer}>
        <Button 
          title={t('common.editEntity', {entity: t('orders.singular')})} 
          onPress={() => navigation.navigate('AddEditOrder', {orderId: selectedOrder.id, customerId: selectedOrder.customerId})} 
          style={styles.actionButton}
        />
        <Button 
          title={t('invoices.generateForOrder')}
          onPress={() => console.log("Navigate to AddEditInvoice with orderId:", selectedOrder.id)} // Placeholder
          style={styles.actionButton}
          variant="outline" 
        />
         <Button 
          title={t('common.deleteEntity', {entity: t('orders.singular')})}
          onPress={handleDeleteOrder}
          variant="text" 
          style={styles.actionButton}
          textStyle={styles.deleteButtonText}
          disabled={isOrderLoading}
        />
      </View>
    </ScrollView>
  );
};

// Helper for badge type on OrderListItem, if it's not part of OrderListItem itself
// This is duplicated from OrderListItem for now. Ideally, this logic is centralized or part of Badge.
OrderListItem.prototype.getStatusBadgeType = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received': return 'primary';
      case 'designing': return 'info';
      case 'cutting': return 'info';
      case 'stitching': return 'warning';
      case 'trial': return 'warning';
      case 'ready': return 'success';
      case 'picked_up': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
};


export default OrderDetailScreen;
