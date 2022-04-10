// Import necessary libraries
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import MealsScreen from '../../screens/foods';
import HomeScreen from '../../screens/home';
import App from "../../screens/index";
import InsulinScreen from '../../screens/insulin';
// Import all of the screens
import Login from "../../screens/login";
import RecipesScreen from '../../screens/recipes';
import SettingsScreen from '../../screens/settings';



// Create the navigation stack
const MainStack = createStackNavigator();

const Main = () => {
  return (
    <NavigationContainer>
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