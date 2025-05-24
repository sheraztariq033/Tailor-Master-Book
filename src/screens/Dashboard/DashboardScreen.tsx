import React, {useEffect, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl, FlatList} from 'react-native';
import StatCard from '../../components/specific/dashboard/StatCard';
import OrderListItem from '../../components/specific/orders/OrderListItem'; // Re-use for recent orders/deadlines
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { MainAppTabParamList, OrdersStackParamList } from '../../navigation/navigationTypes'; // For navigating to OrderList
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';


import { useAppDispatch, useAppSelector } from '../../store';
import { fetchOrders, clearOrderError, Order } from '../../store/slices/orderSlice';
import { fetchCustomers as fetchAllCustomers } from '../../store/slices/customerSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, differenceInCalendarDays, isFuture } from 'date-fns';

type DashboardScreenNavigationProps = CompositeScreenProps<
  BottomTabScreenProps<MainAppTabParamList, 'DashboardTab'>,
  NativeStackScreenProps<OrdersStackParamList> // Assuming OrderList is part of OrdersStack
>;


const DashboardScreen: React.FC<DashboardScreenNavigationProps> = ({ navigation }) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {orders, isLoading, error} = useAppSelector(state => state.order);
  const {customers: allCustomers, isLoading: customersLoading} = useAppSelector(state => state.customer);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});

  const loadData = useCallback((showPullToRefreshLoader = true) => {
    if(showPullToRefreshLoader) setIsRefreshing(true);
    // Fetch all orders for client-side processing for P0
    dispatch(fetchOrders()) 
      .finally(() => {
        if(showPullToRefreshLoader) setIsRefreshing(false);
      });
    dispatch(fetchAllCustomers()); // Fetch customers for name mapping
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
      return () => {
        dispatch(clearOrderError());
      };
    }, [loadData, dispatch])
  );
  
  useEffect(() => {
    if (allCustomers.length > 0) {
      const newMap: Record<string, string> = {};
      allCustomers.forEach(c => { newMap[c.id] = c.name; });
      setCustomerMap(newMap);
    }
  }, [allCustomers]);

  const parseOrderDate = (date: string | { _seconds: number, _nanoseconds: number }): Date => {
    return typeof date === 'string' ? parseISO(date) : new Date(date._seconds * 1000);
  };

  // Client-side data processing for stats and lists
  const dashboardData = useMemo(() => {
    const now = new Date();
    const PENDING_STATUSES = ['received', 'designing', 'cutting', 'stitching', 'trial'];
    const COMPLETED_STATUSES = ['picked_up', 'completed']; // 'completed' might be an internal status before picked_up

    const pendingOrders = orders.filter(o => PENDING_STATUSES.includes(o.status)).length;
    
    const ordersThisWeek = orders.filter(o => 
        isWithinInterval(parseOrderDate(o.orderDate), { start: startOfWeek(now), end: endOfWeek(now) })
    ).length;
    
    const ordersThisMonth = orders.filter(o => 
        isWithinInterval(parseOrderDate(o.orderDate), { start: startOfMonth(now), end: endOfMonth(now) })
    ).length;
        
    const totalCompletedOrders = orders.filter(o => COMPLETED_STATUSES.includes(o.status)).length;

    const upcomingDeadlinesOrders = orders
      .filter(o => 
        !COMPLETED_STATUSES.includes(o.status) && 
        isFuture(parseOrderDate(o.deadlineDate)) &&
        differenceInCalendarDays(parseOrderDate(o.deadlineDate), now) <= 7 // Deadline within next 7 days
      )
      .sort((a, b) => parseOrderDate(a.deadlineDate).getTime() - parseOrderDate(b.deadlineDate).getTime())
      .slice(0, 5);

    const recentOrders = [...orders] // Create a new array before sorting
      .sort((a,b) => parseOrderDate(b.orderDate).getTime() - parseOrderDate(a.orderDate).getTime())
      .slice(0, 5);

    return {
      pendingOrders,
      ordersThisWeek,
      ordersThisMonth,
      totalCompletedOrders,
      upcomingDeadlinesOrders,
      recentOrders,
    };
  }, [orders]);
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { ...typography.body, color: colors.error, textAlign: 'center', padding: 20 },
    scrollViewContent: { padding: 15, paddingBottom: 30 },
    title: { ...typography.h1, color: colors.text, marginBottom: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    sectionTitle: { ...typography.h3, color: colors.textSecondary, marginTop: 25, marginBottom: 15 },
    emptyListText: { ...typography.body, color: colors.textDisabled, textAlign: 'center', marginVertical: 20 },
    viewAllButton: { marginTop: 15, alignSelf: 'flex-start' }
  });

  if (isLoading && orders.length === 0 && !isRefreshing) {
    return <View style={styles.loaderContainer}><Loader size="large" /></View>;
  }
  if (error && orders.length === 0) {
    return <Text style={styles.errorText}>{t('common.errorLoading', {entity: t('dashboard.title')})}: {String(error)}</Text>;
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollViewContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadData(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.title}>{t('dashboard.title')}</Text>

      <View style={styles.statsRow}>
        <StatCard title={t('dashboard.stats.pendingOrders')} value={dashboardData.pendingOrders} iconName="timer-sand" />
        <StatCard title={t('dashboard.stats.upcomingDeadlines')} value={dashboardData.upcomingDeadlinesOrders.length} iconName="calendar-clock" />
      </View>
      <View style={styles.statsRow}>
        <StatCard title={t('dashboard.stats.ordersThisWeek')} value={dashboardData.ordersThisWeek} iconName="calendar-week" />
        <StatCard title={t('dashboard.stats.completedThisMonth')} value={dashboardData.totalCompletedOrders} iconName="check-circle-outline" /> 
        {/* Note: totalCompletedOrders is not month specific yet based on current calc */}
      </View>

      <Text style={styles.sectionTitle}>{t('dashboard.recentOrders.title')}</Text>
      {dashboardData.recentOrders.length > 0 ? (
        <>
          <FlatList
            data={dashboardData.recentOrders}
            renderItem={({item}) => (
              <OrderListItem 
                order={item} 
                customerName={customerMap[item.customerId]}
                onPress={(orderId) => navigation.navigate('OrderDetail', { orderId })} 
              />
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false} // Disable scroll for FlatList inside ScrollView
          />
          <Button 
            title={t('dashboard.recentOrders.viewAll')} 
            onPress={() => navigation.navigate('OrdersTab', { screen: 'OrderList' })} 
            variant="text"
            style={styles.viewAllButton}
          />
        </>
      ) : (
        <Text style={styles.emptyListText}>{t('dashboard.recentOrders.empty')}</Text>
      )}

      <Text style={styles.sectionTitle}>{t('dashboard.upcomingDeadlines.title')}</Text>
      {dashboardData.upcomingDeadlinesOrders.length > 0 ? (
        <FlatList
          data={dashboardData.upcomingDeadlinesOrders}
          renderItem={({item}) => (
            <OrderListItem 
              order={item} 
              customerName={customerMap[item.customerId]}
              onPress={(orderId) => navigation.navigate('OrderDetail', { orderId })} 
            />
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.emptyListText}>{t('dashboard.upcomingDeadlines.empty')}</Text>
      )}
    </ScrollView>
  );
};

export default DashboardScreen;
