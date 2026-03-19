import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import PayScreen from '../screens/PayScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1A1A2E',
          tabBarInactiveTintColor: '#9C8F84',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 100,
            shadowOpacity: 0.1,
            shadowRadius: 10,
            height: 90,
            paddingBottom: 8,
            paddingTop: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
          },
          tabBarIcon: ({ focused }) => {
            const icons = {
              Home: '⌂', Pay: '↗', Expenses: '≡', Insights: '◑', Profile: '○',
            };
            return (
              <Text style={{ fontSize: 20, color: focused ? '#1A1A2E' : '#9C8F84' }}>
                {icons[route.name] || '●'}
              </Text>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Pay" component={PayScreen} />
        <Tab.Screen name="Expenses" component={ExpensesScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
