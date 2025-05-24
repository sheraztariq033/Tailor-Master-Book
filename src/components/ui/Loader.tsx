import React from 'react';
import {ActivityIndicator, View, StyleSheet, ViewStyle} from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  isLoading?: boolean; // If false, render nothing
}

const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = '#007bff', // Example primary color
  style,
  isLoading = true,
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default Loader;
