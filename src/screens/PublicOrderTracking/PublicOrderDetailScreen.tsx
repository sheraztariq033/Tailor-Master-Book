import React, {useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Image, TouchableOpacity} from 'react-native';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import { PublicOrderTrackingStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
// import ImageViewer from 'react-native-image-zoom-viewer'; // If you had this for OrderDetailScreen

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchPublicOrder, clearPublicOrderStatus, PublicOrderDetails } from '../../store/slices/orderSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format, parseISO} from 'date-fns';

// Mock ImageViewer if not installed (same as in OrderDetailScreen)
const ImageViewer = ({imageUrls, index, onCancel, enableSwipeDown, renderHeader}: any) => (
    <RNModal visible={true} onRequestClose={onCancel}>
        <View style={{flex:1, backgroundColor: 'black', justifyContent:'center', alignItems:'center'}}>
            {renderHeader()}
            <Text style={{color:'white', fontSize:18, marginBottom:10}}>Image Viewer Placeholder</Text>
            {imageUrls && imageUrls[index] && <Image source={{uri: imageUrls[index]?.url}} style={{width:300, height:300, resizeMode:'contain'}}/>}
            {imageUrls && imageUrls[index] && <Text style={{color:'white', marginTop:10}}>{imageUrls[index]?.url}</Text>}
        </View>
    </RNModal>
);
import { Modal as RNModal } from 'react-native'; // Ensure Modal is imported


type Props = NativeStackScreenProps<PublicOrderTrackingStackParamList, 'PublicOrderDetail'>;

const PublicOrderDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();
  const {token} = route.params;

  const {publicOrderStatus, isLoadingPublicOrder, publicOrderError} = useAppSelector(state => state.order);
  
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [imagesForViewer, setImagesForViewer] = useState<{url: string}[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const loadData = useCallback(() => {
    if (token && (!publicOrderStatus || publicOrderStatus.orderId !== token)) { // Fetch if no status or different token
      dispatch(fetchPublicOrder(token));
    } else if (publicOrderStatus?.images && publicOrderStatus.images.length > 0) {
        setImagesForViewer(publicOrderStatus.images.map(imgUrl => ({ url: imgUrl })));
    }
  }, [dispatch, token, publicOrderStatus]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Do not clear publicOrderStatus here, as it's needed for display if navigated back
      // It will be cleared when EnterOrderTokenScreen is focused again.
    }, [loadData])
  );
  
  useEffect(() => {
    if (publicOrderStatus?.images && publicOrderStatus.images.length > 0) {
        setImagesForViewer(publicOrderStatus.images.map(imgUrl => ({ url: imgUrl })));
      } else {
        setImagesForViewer([]);
      }
  }, [publicOrderStatus]);


  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };
  
  // Copy getStatusBadgeType from OrderListItem or centralize it
  const getStatusBadgeType = (status: string) => {
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

  const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: { flex: 1, padding: 15, backgroundColor: colors.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { ...typography.body, color: colors.error, textAlign: 'center', padding: 20 },
    headerCard: { marginBottom: 15, padding: 20 },
    titleSection: { alignItems: 'center', marginBottom: 10 },
    outfitType: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: 5 },
    customerText: { ...typography.h5, color: colors.textSecondary, textAlign: 'center' },
    tailorText: { ...typography.bodySmall, color: colors.textDisabled, textAlign: 'center', marginTop: 3},
    sectionTitle: { ...typography.h4, color: colors.textSecondary, marginTop: 15, marginBottom: 10, paddingHorizontal: 5 },
    detailItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    detailLabel: { ...typography.body, fontWeight: typography.fontWeights.semibold, color: colors.textSecondary, flex: 1 },
    detailValue: { ...typography.body, color: colors.text, flex: 2, textAlign: 'left' }, // Align left for public view
    badgeContainer: { alignItems: 'flex-start' }, // Align badge left
    featuresList: { marginLeft: 10 },
    featureItem: { ...typography.body, color: colors.text, marginBottom: 4 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    imageThumbnailTouchable: { marginRight: 10, marginBottom: 10 },
    imageThumbnail: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.border },
    trackAnotherButton: { marginTop: 25 }
  });

  if (isLoadingPublicOrder && !publicOrderStatus) {
    return <View style={styles.loaderContainer}><Loader size="large" /></View>;
  }

  if (publicOrderError) {
    return (
        <View style={styles.container}>
            <Text style={styles.errorText}>{t('publicOrderTracking.errorFetching')}: {String(publicOrderError)}</Text>
            <Button title={t('publicOrderTracking.trackAnotherButton')} onPress={() => navigation.replace('EnterOrderToken')} />
        </View>
    );
  }
  if (!publicOrderStatus) {
    // This case should ideally be handled by loader or error, but as a fallback:
    return (
        <View style={styles.container}>
            <Text style={styles.errorText}>{t('publicOrderTracking.noDetailsFound')}</Text>
            <Button title={t('publicOrderTracking.trackAnotherButton')} onPress={() => navigation.replace('EnterOrderToken')} />
        </View>
    );
  }

  const orderDate = publicOrderStatus.orderDate ? format(parseISO(publicOrderStatus.orderDate), 'PP') : t('common.notSet');
  const deadline = publicOrderStatus.deadlineDate ? format(parseISO(publicOrderStatus.deadlineDate), 'PP') : t('common.notSet');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <Card style={styles.headerCard}>
        <View style={styles.titleSection}>
          <Text style={styles.outfitType}>{publicOrderStatus.outfitType}</Text>
          <Text style={styles.customerText}>{t('publicOrderTracking.forCustomer', {name: publicOrderStatus.customerFirstName || t('common.customer')})}</Text>
          <Text style={styles.tailorText}>{t('publicOrderTracking.byTailor', {name: publicOrderStatus.tailorBusinessName || t('common.tailorShop')})}</Text>
        </View>
        <View style={styles.detailItemRow}>
          <Text style={styles.detailLabel}>{t('orders.statusLabel')}:</Text>
          <View style={styles.badgeContainer}>
            <Badge label={t(`orderStatus.${publicOrderStatus.status}`, publicOrderStatus.status)} type={getStatusBadgeType(publicOrderStatus.status)} />
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{t('orders.detailsSectionTitle')}</Text>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.form.orderDateLabel')}:</Text><Text style={styles.detailValue}>{orderDate}</Text></View>
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.form.deadlineDateLabel')}:</Text><Text style={styles.detailValue}>{deadline}</Text></View>
        {/* Masked Order ID */}
        <View style={styles.detailItemRow}><Text style={styles.detailLabel}>{t('orders.orderIdLabel')}:</Text><Text style={styles.detailValue}>{publicOrderStatus.orderId}</Text></View>
      </Card>

      {publicOrderStatus.features && Object.keys(publicOrderStatus.features).length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>{t('orders.featuresSectionTitle')}</Text>
          <View style={styles.featuresList}>
            {Object.entries(publicOrderStatus.features).map(([key, value]) => (
              <Text key={key} style={styles.featureItem}>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}</Text>
            ))}
          </View>
        </Card>
      )}

      {publicOrderStatus.images && publicOrderStatus.images.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>{t('orders.form.imagesLabel')}</Text>
          <View style={styles.imageGrid}>
            {publicOrderStatus.images.map((imgUrl, index) => (
              <TouchableOpacity key={index} onPress={() => openImageViewer(index)} style={styles.imageThumbnailTouchable}>
                <Image source={{uri: imgUrl}} style={styles.imageThumbnail} resizeMode="cover"/>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}
      {imagesForViewer.length > 0 && (
          <ImageViewer 
            imageUrls={imagesForViewer} 
            index={selectedImageIndex}
            visible={isImageViewerVisible} // Control visibility
            onRequestClose={() => setImageViewerVisible(false)} // For Android back button
            onCancel={() => setImageViewerVisible(false)}
            enableSwipeDown={true}
            renderHeader={() => (
                <TouchableOpacity style={{position: 'absolute', top: 40, right: 20, zIndex: 10}} onPress={() => setImageViewerVisible(false)}>
                    <Text style={{color: 'white', fontSize: 18, backgroundColor: 'rgba(0,0,0,0.3)', padding:10, borderRadius:5}}>X</Text>
                </TouchableOpacity>
            )}
        />
      )}

      <Button 
        title={t('publicOrderTracking.trackAnotherButton')} 
        onPress={() => {
            dispatch(clearPublicOrderStatus()); // Clear current order before going back
            navigation.replace('EnterOrderToken');
        }} 
        style={styles.trackAnotherButton}
        variant="outline"
      />
    </ScrollView>
  );
};

export default PublicOrderDetailScreen;
