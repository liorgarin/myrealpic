import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

import MyAlbumsScreen from './screens/MyAlbumsScreen'; 
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import GalleryScreen from './screens/GalleryScreen';
import PurchaseFilmScreen from './screens/PurchaseFilmScreen';
import EnterCouponScreen from './screens/EnterCouponScreen';

// Add a console.log to verify App.js runs:
console.log("App.js: Starting up the app...");

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function CustomDrawerContent(props) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.logoContainer}>
        <Image source={require('./assets/icon.png')} style={styles.logo} />
      </View>
      <DrawerItemList {...props} />
      <View style={{ padding: 16 }}>
        <TouchableOpacity 
          style={{
            backgroundColor: '#FF3B30', 
            paddingVertical: 10, 
            borderRadius: 8, 
            alignItems: 'center'
          }} 
          onPress={handleLogout}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

function BottomTabsNavigator() {
  console.log("App.js: BottomTabsNavigator rendered");
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Active') {
            iconName = focused ? 'film' : 'film-outline';
          } else if (route.name === 'Ready to Print') {
            iconName = focused ? 'print' : 'print-outline';
          } else if (route.name === 'On the Way') {
            iconName = focused ? 'airplane' : 'airplane-outline';
          } else if (route.name === 'Arrived') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Active" component={(props) => <HomeScreen {...props} tab="Active" />} />
      <Tab.Screen name="Ready to Print" component={(props) => <HomeScreen {...props} tab="Ready to Print" />} />
      <Tab.Screen name="On the Way" component={(props) => <HomeScreen {...props} tab="On the Way" />} />
      <Tab.Screen name="Arrived" component={(props) => <HomeScreen {...props} tab="Arrived" />} />
    </Tab.Navigator>
  );
}

function DrawerNavigator() {
  console.log("App.js: DrawerNavigator rendered");
  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Home" component={BottomTabsNavigator} />
      <Drawer.Screen name="My Albums" component={MyAlbumsScreen} />
      <Drawer.Screen name="PurchaseFilm" component={PurchaseFilmScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  console.log("App.js: App component rendering");
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />

        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        <Stack.Screen name="Home" component={DrawerNavigator} options={{ headerShown: false }} />

        <Stack.Screen
          name="PurchaseFilm"
          component={PurchaseFilmScreen}
          options={({ navigation }) => ({
            headerShown: true,
            title: '',
            headerTitle: () => null,
            headerBackTitleVisible: false,
            headerBackVisible: false,
            headerLeft: () => (
              <DrawerToggleButton />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => navigation.navigate('Home')}
              >
                <Ionicons name="home" size={24} color="black" />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="EnterCoupon" component={EnterCouponScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 200,
    height: 200, // Ensure it's square
    resizeMode: 'contain',
  },
});