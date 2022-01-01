import * as React from "react"
import { NavigationContainer } from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Input,
  Link,
  Button,
  HStack,
  Center,
  NativeBaseProvider,
} from "native-base"
import HomeScreen from './screens/index';
import PouchDB from 'pouchdb-react-native'

const db = new PouchDB('settings')


const Stack = createNativeStackNavigator();



const Login = ({ navigation }) => {
  db.get("login").then(function(value) { 
    if (!value) {
      return
    }
    else {
      navigation.navigate('Home')
    }
  })
  return (
    <Center flex={1} px="3">
    <Box safeArea p="2" py="8" w="90%" maxW="290">
      <Heading
        size="lg"
        fontWeight="600"
        color="coolGray.800"
        _dark={{
          color: "warmGray.50",
        }}
      >
        Welcome
      </Heading>
      <Heading
        mt="1"
        _dark={{
          color: "warmGray.200",
        }}
        color="coolGray.600"
        fontWeight="medium"
        size="xs"
      >
        Sign in using your Dexcom credentials
      </Heading>

      <VStack space={3} mt="5">
        <FormControl>
          <FormControl.Label>Username</FormControl.Label>
          <Input getRef={input => {this.username = input;}} />
        </FormControl>
        <FormControl>
          <FormControl.Label>Password</FormControl.Label>
          <Input type="password" getRef={input => {this.password = input;}} />
        </FormControl>

        <Button mt="2" colorScheme="indigo" onPress={() => {
          db.put({
            "login": {
              "username": this.refs.username.value,
              "password": this.refs.password.value
            }
          });
          navigation.navigate('Home')}}>
          Sign in
        </Button>
      </VStack>
    </Box>
    </Center>
  )
}

export default () => {
  return (
    <NavigationContainer>
      <NativeBaseProvider>
        <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}>
            <Stack.Screen
              name="Login"
              component={Login}
            />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NativeBaseProvider>
    </NavigationContainer>
  )
}
