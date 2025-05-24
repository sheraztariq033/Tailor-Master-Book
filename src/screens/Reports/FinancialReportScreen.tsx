import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import { InvoicesStackParamList } from '../../navigation/navigationTypes';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchFinancialReport, clearReportData, clearInvoiceError, FinancialReport } from '../../store/slices/invoiceSlice';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import {format, parseISO, isValid, startOfMonth, endOfMonth, subMonths} from 'date-fns';

type Props = NativeStackScreenProps<InvoicesStackParamList, 'FinancialReport'>;

const FinancialReportScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {colors, typography} = useTheme();
  const dispatch = useAppDispatch();

  const {reportData, isLoading, error} = useAppSelector(state => state.invoice);

  // Default to previous month for initial date range
  const today = new Date();
  const firstDayPrevMonth = startOfMonth(subMonths(today, 1));
  const lastDayPrevMonth = endOfMonth(subMonths(today, 1));

  const [startDate, setStartDate] = useState<string>(format(firstDayPrevMonth, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(lastDayPrevMonth, 'yyyy-MM-dd'));
  const [submittedDateRange, setSubmittedDateRange] = useState<{from: string, to: string} | null>(null);


  useFocusEffect(
    useCallback(() => {
      // Clear previous report data and errors when screen is focused
      dispatch(clearReportData());
      dispatch(clearInvoiceError());
    }, [dispatch])
  );
  
  const validateDates = (): boolean => {
    const from = parseISO(startDate);
    const to = parseISO(endDate);
    if (!isValid(from) || !isValid(to)) {
      Alert.alert(t('common.validationError'), t('reports.invalidDateRange'));
      return false;
    }
    if (from > to) {
      Alert.alert(t('common.validationError'), t('reports.startDateAfterEndDate'));
      return false;
    }
    return true;
  };

  const handleGenerateReport = () => {
    if (!validateDates()) return;
    
    const payload = {
      dateRange: {from: startDate, to: endDate},
      reportType: 'revenue_summary', // Currently fixed to 'revenue_summary'
    };
    setSubmittedDateRange(payload.dateRange); // Store the submitted range for display
    dispatch(fetchFinancialReport(payload));
  };
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollViewContent: { padding: 20, flexGrow: 1 },
    title: { ...typography.h2, color: colors.text, marginBottom: 20, textAlign: 'center' },
    dateInputContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    dateInputWrapper: { flex: 1, marginHorizontal: 5 },
    generateButton: { marginBottom: 20 },
    reportCard: { marginTop: 10 },
    reportHeader: { ...typography.h4, color: colors.textSecondary, marginBottom: 10, textAlign: 'center' },
    reportItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    reportItemLabel: { ...typography.body, color: colors.textSecondary, fontWeight: typography.fontWeights.semibold },
    reportItemValue: { ...typography.body, color: colors.text, fontWeight: typography.fontWeights.bold },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { ...typography.body, color: colors.error, textAlign: 'center', padding: 20 },
    emptyDataText: { ...typography.body, color: colors.textDisabled, textAlign: 'center', paddingVertical: 30 },
  });

  const renderReportContent = () => {
    if (isLoading) return <View style={styles.loaderContainer}><Loader size="large" /></View>;
    if (error) return <Text style={styles.errorText}>{t('common.errorLoading', {entity: t('reports.financialReportTitle')})}: {String(error)}</Text>;
    
    if (!reportData && submittedDateRange) { // Submitted but no data yet (might be empty from server)
        return <Text style={styles.emptyDataText}>{t('reports.noDataForPeriod')}</Text>;
    }
    if (!reportData) return null; // No report generated yet

    // Assuming reportData matches the FinancialReport interface from invoiceSlice
    const { dateRange, totalInvoiced, totalPaid, invoiceCount, paidInvoicesCount, unpaidInvoicesCount, partiallyPaidInvoicesCount } = reportData;
    const totalOutstanding = totalInvoiced - totalPaid;

    return (
      <Card style={styles.reportCard}>
        <Text style={styles.reportHeader}>
            {t('reports.reportForPeriod', {
                startDate: format(parseISO(dateRange.from), 'PP'), 
                endDate: format(parseISO(dateRange.to), 'PP')
            })}
        </Text>
        <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.totalInvoiced')}:</Text>
          <Text style={styles.reportItemValue}>{t('common.currencySymbol')}{totalInvoiced?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.totalPaid')}:</Text>
          <Text style={styles.reportItemValue}>{t('common.currencySymbol')}{totalPaid?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.totalOutstanding')}:</Text>
          <Text style={styles.reportItemValue}>{t('common.currencySymbol')}{totalOutstanding?.toLocaleString() || '0'}</Text>
        </View>
        <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.invoicesIssued')}:</Text>
          <Text style={styles.reportItemValue}>{invoiceCount || 0}</Text>
        </View>
        <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.paidInvoicesCount')}:</Text>
          <Text style={styles.reportItemValue}>{paidInvoicesCount || 0}</Text>
        </View>
        <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.unpaidInvoicesCount')}:</Text>
          <Text style={styles.reportItemValue}>{unpaidInvoicesCount || 0}</Text>
        </View>
         <View style={styles.reportItemRow}>
          <Text style={styles.reportItemLabel}>{t('reports.partiallyPaidInvoicesCount')}:</Text>
          <Text style={styles.reportItemValue}>{partiallyPaidInvoicesCount || 0}</Text>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.title}>{t('reports.financialReportTitle')}</Text>
      <Card>
        <View style={styles.dateInputContainer}>
          <View style={styles.dateInputWrapper}>
            <Input
              label={t('reports.startDateLabel')}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              keyboardType="number-pad" // Simple way to suggest numeric input
            />
          </View>
          <View style={styles.dateInputWrapper}>
            <Input
              label={t('reports.endDateLabel')}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Button
          title={t('reports.generateReportButton')}
          onPress={handleGenerateReport}
          isLoading={isLoading}
          style={styles.generateButton}
        />
      </Card>
      {renderReportContent()}
    </ScrollView>
  );
};

export default FinancialReportScreen;
