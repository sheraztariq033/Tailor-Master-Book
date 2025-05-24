import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle} from 'react-native';
// In a real app, you'd likely use @react-native-picker/picker or a custom modal-based picker.
// This is a simplified placeholder.

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  selectedValue?: string | number;
  onValueChange: (value: string | number, index: number) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  style?: ViewStyle; // Style for the touchable part
  textStyle?: TextStyle;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option...',
  error,
  containerStyle,
  style,
  textStyle,
  disabled = false,
}) => {
  const selectedOption = options.find(opt => opt.value === selectedValue);

  // This component would typically open a Modal with a list of options
  // or use a native Picker component. For this environment, it's a display-only
  // touchable that logs the action.
  const handlePress = () => {
    console.log('Select pressed. Options:', options);
    // In a real app, this would open a picker modal.
    // For demonstration, let's cycle through options if not disabled.
    if (!disabled && options.length > 0) {
        const currentIndex = options.findIndex(opt => opt.value === selectedValue);
        const nextIndex = (currentIndex + 1) % options.length;
        onValueChange(options[nextIndex].value, nextIndex);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.selectBox, error ? styles.selectBoxError : null, style, disabled && styles.disabled]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Text style={[styles.selectText, textStyle]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  selectBox: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectBoxError: {
    borderColor: '#ff3b30',
  },
  selectText: {
    fontSize: 16,
    color: '#000',
  },
  arrow: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  }
});

export default Select;
