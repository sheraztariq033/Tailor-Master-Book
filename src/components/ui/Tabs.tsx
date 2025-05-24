import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle} from 'react-native';

interface TabOption {
  title: string;
  key: string;
}

interface TabsProps {
  options: TabOption[];
  onTabSelect: (selectedKey: string) => void;
  defaultSelectedKey?: string;
  style?: ViewStyle; // Style for the tab bar container
  tabStyle?: ViewStyle; // Style for individual tab items
  activeTabStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
}

const Tabs: React.FC<TabsProps> = ({
  options,
  onTabSelect,
  defaultSelectedKey,
  style,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(
    defaultSelectedKey || (options.length > 0 ? options[0].key : '')
  );

  const handleTabPress = (key: string) => {
    setSelectedKey(key);
    onTabSelect(key);
  };

  return (
    <View style={[styles.tabBar, style]}>
      {options.map(option => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.tabItem,
            tabStyle,
            selectedKey === option.key && styles.activeTabItem,
            selectedKey === option.key && activeTabStyle,
          ]}
          onPress={() => handleTabPress(option.key)}
        >
          <Text
            style={[
              styles.tabText,
              textStyle,
              selectedKey === option.key && styles.activeTabText,
              selectedKey === option.key && activeTextStyle,
            ]}
          >
            {option.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0', // Example background for tab bar
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8, // For making active tab look like a pill inside
  },
  activeTabItem: {
    backgroundColor: '#007bff', // Example primary color for active tab
    margin: 4, // To give some space for the "pill" effect
    height: '85%',
  },
  tabText: {
    fontSize: 14,
    color: '#333', // Default text color
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff', // Text color for active tab
    fontWeight: 'bold',
  },
});

export default Tabs;
