import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import {
  NativeBaseProvider,
  Button,
  Box,
  HamburgerIcon,
  Pressable,
  Heading,
  VStack,
  Text,
  Center,
  HStack,
  Divider,
  Icon,
  Spinner,
  Container
} from 'native-base';
import axios from 'axios';

import HomeScreen from '../screens/home';
import MealsScreen from '../screens/foods';
import InsulinScreen from '../screens/insulin';
import RecipesScreen from '../screens/recipes';
import SettingsScreen from '../screens/settings';

import AsyncStorage from '@react-native-async-storage/async-storage';

const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}


let isLoading = true;

const Drawer = createDrawerNavigator();

const getIcon = (screenName) => {
  switch (screenName) {
    case 'Home':
      return 'home-outline';
    case 'Ingredients':
      return 'nutrition-outline';
    case 'Insulin':
      return 'pencil-outline';
    case 'Dexcom':
      return 'stats-chart-outline';
    case 'Recipes':
      return 'bookmarks-outline';
    case 'Settings':
      return 'settings-outline';
    default:
      return undefined;
  }
};

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} safeArea>
      <VStack space="6" my="2" mx="1">
        <Box px="4">
          <Text bold color="gray.700">
            Diabetic Manager
          </Text>
        </Box>
        <VStack divider={<Divider />} space="4">
          <VStack space="3">
            {props.state.routeNames.map((name, index) => (
              <Pressable
                px="5"
                py="3"
                rounded="md"
                bg={
                  index === props.state.index
                    ? 'rgba(6, 182, 212, 0.1)'
                    : 'transparent'
                }
                onPress={(event) => {
                  props.navigation.navigate(name);
                }}>
                <HStack space="7" alignItems="center">
                  <Icon
                    color={
                      index === props.state.index ? 'primary.500' : 'gray.500'
                    }
                    size="5"
                    as={<Ionicons name={getIcon(name)} />}
                  />
                  <Text
                    fontWeight="500"
                    color={
                      index === props.state.index ? 'primary.500' : 'gray.700'
                    }>
                    {name}
                  </Text>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        </VStack>
      </VStack>
    </DrawerContentScrollView>
  );
}
function MyDrawer() {
  return (
      <Box safeArea flex={1}>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}>
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Ingredients" component={MealsScreen} />
        <Drawer.Screen name="Insulin" component={InsulinScreen} />
        <Drawer.Screen name="Recipes" component={RecipesScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </Box>

  );
}


export default function App() {

    const [data, setData] = React.useState({});

    get("login")
    .then(loginInfo => {

    setData({
        ...data,
        username: loginInfo.username,
        password: loginInfo.password
    })

      axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/AuthenticatePublisherAccount", {
        "accountName": data.username,
        "password": data.password,
        "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
    })
    .then((response) => {

    const account_id = response.data;
    axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/LoginPublisherAccountById", {
        "accountId": account_id,
        "password": data.password,
        "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
    })
    .then((response) => {
    const session_id = response.data;

    axios.post(`https://share2.dexcom.com/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${session_id}&minutes=1440&maxCount=24`)
    .then((response) => {
    response = response.data;

    let readings = []
    for (let i=0; i<response.length; i++) {
        readings.push({
            value: response[i].Value,
            trend: response[i].Trend
        })
    }

    setObj("readings", readings)

    isLoading = false;
    })
    .catch(error => console.error(error.response))
    })
    .catch(error => console.error(error.response))
    })
    .catch(error => console.error(error.response))
    })


  return (
    <NavigationContainer independent={true}>
      <NativeBaseProvider>

      {isLoading &&
      <Center flex={1} px="3">
      <HStack space={2} alignItems="center">
        <Spinner size="lg" accessibilityLabel="Loading posts" />
        <Heading color="primary.500" fontSize="3xl">
          Loading
        </Heading>
      </HStack>
      </Center>
      }

      {!isLoading &&
       <MyDrawer />
      }
      </NativeBaseProvider>
    </NavigationContainer>
  );
}
