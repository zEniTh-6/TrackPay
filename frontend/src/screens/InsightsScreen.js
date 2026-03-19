import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InsightsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>InsightsScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA'
  },
  text: {
    fontSize: 20,
    color: '#333333'
  }
});

export default InsightsScreen;
