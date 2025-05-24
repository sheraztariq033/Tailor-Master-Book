import React from 'react';
import {TextInput, Text, View, StyleSheet, TextInputProps} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style, // Native TextInput style
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#999" // Example placeholder color
        {...rest}
      />
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
    color: '#333', // Example label color
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderColor: '#ccc', // Example border color
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff', // Example background color
    color: '#000', // Example text color
  },
  inputError: {
    borderColor: '#ff3b30', // Example error color
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30', // Example error color
    marginTop: 4,
  },
});

export default Input;
