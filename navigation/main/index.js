import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import Login from "../../screens/login";
import App from "../../screens/index";

import HomeScreen from '../../screens/home';
import MealsScreen from '../../screens/foods';
import InsulinScreen from '../../screens/insulin';
import RecipesScreen from '../../screens/recipes';
import SettingsScreen from '../../screens/settings';


const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }


const MainStack = createStackNavigator();
const Main = () => {
  const linking = {
    prefixes: [
      /* your linking prefixes */
    ],
    config: {
      screens: {
        Login: "login",
        App: "app"
      },
    },
  };


  return (
    <NavigationContainer linking={linking}>
      <MainStack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <MainStack.Screen name="login" component={Login} />
        <MainStack.Screen name="app" component={App} />
        
        <MainStack.Screen name="Home" component={HomeScreen} />
        <MainStack.Screen name="Ingredients" component={MealsScreen} />
        <MainStack.Screen name="Insulin" component={InsulinScreen} />
        <MainStack.Screen name="Recipes" component={RecipesScreen} />
        <MainStack.Screen name="Settings" component={SettingsScreen} />

      </MainStack.Navigator>
    </NavigationContainer>
  );
};

export default Main;