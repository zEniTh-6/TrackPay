import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor="#F5F0EB"
        barStyle="dark-content"
        translucent={false}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
