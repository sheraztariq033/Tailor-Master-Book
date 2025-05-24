import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { MeasurementTemplate } from '../../../store/slices/measurementSlice';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

interface MeasurementTemplateListItemProps {
  template: MeasurementTemplate;
  onEdit: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

const MeasurementTemplateListItem: React.FC<MeasurementTemplateListItemProps> = ({
  template,
  onEdit,
  onDelete,
}) => {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    card: {
      marginBottom: 10,
      padding: 15,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    templateName: {
      ...typography.h5,
      color: colors.text,
      flexShrink: 1,
    },
    outfitType: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 2,
    },
    defaultValuesPreview: {
        ...typography.caption,
        color: colors.textDisabled,
        marginTop: 6,
        fontStyle: 'italic',
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    actionButton: {
      marginLeft: 10,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    deleteButtonText: {
        color: colors.error,
    }
  });
  
  // Preview a few default values
  const defaultValuesEntries = Object.entries(template.defaultValues || {});
  const previewValues = defaultValuesEntries.slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(', ');


  return (
    <Card style={styles.card}>
      <View style={styles.headerContainer}>
        <View style={{flex:1}}>
            <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
            <Text style={styles.outfitType}>{t('templates.outfitType')}: {template.outfitType}</Text>
        </View>
      </View>
      
      {defaultValuesEntries.length > 0 && (
          <Text style={styles.defaultValuesPreview}>
              {t('templates.defaultValuesPreview')}: {previewValues}{defaultValuesEntries.length > 2 ? '...' : ''}
          </Text>
      )}

      <View style={styles.actionsContainer}>
        <Button
          title={t('common.edit')}
          onPress={() => onEdit(template.id)}
          variant="text"
          style={styles.actionButton}
          textStyle={{color: colors.primary}}
        />
        <Button
          title={t('common.delete')}
          onPress={() => onDelete(template.id)}
          variant="text"
          style={styles.actionButton}
          textStyle={styles.deleteButtonText}
        />
      </View>
    </Card>
  );
};

export default MeasurementTemplateListItem;
