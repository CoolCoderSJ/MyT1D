// Import the necessary libraries
import * as React from "react"
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Box,
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  Center,
  NativeBaseProvider,
} from "native-base";
import HomeScreen from './screens/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Disable warnings that aren't important
console.disableYellowBox = true;

// Make a navigation object
const Stack = createNativeStackNavigator();

// Initialize database methods
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

// Create the login screen function
const Login = ({ navigation }) => {

  // If the user has already logged in, skip the login screen
  get("login").then(result => {
    if (result) {
      navigation.navigate('Home')
    }
  })

  // Initialize state
  const [formData, setData] = React.useState({});
  const [errors, setErrors] = React.useState({});

  // Setup the validation function
  const validate = async () => {

    // If the form is empty, return an error
    if (formData.username === undefined || formData.password === undefined) {
      setErrors({
        ...errors,
        name: 'Both fields are required',
      });
      return false;
    }

    // Validate the account with Dexcom's api, if it fails, return an error
    try {
      const response = await axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/AuthenticatePublisherAccount", {
        "accountName": formData.username,
        "password": formData.password,
        "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
      });

      const account_id = response.data;
      const ok = account_id && account_id !== "";

      setErrors({
        ...errors,
        name: ok ? null : 'Incorrect credentials',
      });
      return ok;
    } catch (error) {
      setErrors({
        ...errors,
        name: 'Incorrect credentials',
      });
      return false;
    }
  }

  // When the user submits the form, validate the credentials
  const onLogin = () => {
    validate()
      .then(function (check) {
        if (check) {

          setObj("login", {
            username: formData.username,
            password: formData.password
          })
          navigation.navigate('Home')
        }
        else {
          return false
        }
      })
  };

  // If the user picks the test mode option, let the app know and skip the login screen
  const testModeActivate = () => {
    setObj("login", {
      username: "testDemo",
      password: "password"
    })
    navigation.navigate('Home')
  };

  return (
    <Center flex={1} px="3">
      <Box safeArea p="2" py="8" w="90%" maxW="290">

        {/* The heading */}
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
          <FormControl isRequired={true} isInvalid={errors['name']}>
            <FormControl.Label>Username</FormControl.Label>
            {/*Update login variables when inputs are changed */}
            <Input onChangeText={(value) => setData({ ...formData, username: value })} />

            {errors['name'] ?
              <FormControl.ErrorMessage _text={{ fontSize: 'xs', color: 'error.500', fontWeight: 500 }}>{errors.name}</FormControl.ErrorMessage>
              :

              <FormControl.HelperText _text={{ fontSize: 'xs' }}>
              </FormControl.HelperText>
            }
          </FormControl>
          <FormControl isRequired={true} isInvalid={errors['name']}>
            <FormControl.Label>Password</FormControl.Label>
            <Input type="password" onChangeText={(value) => setData({ ...formData, password: value })} />

            {errors['name'] ?
              <FormControl.ErrorMessage _text={{ fontSize: 'xs', color: 'error.500', fontWeight: 500 }}>{errors.name}</FormControl.ErrorMessage>
              :

              <FormControl.HelperText _text={{ fontSize: 'xs' }}>
              </FormControl.HelperText>
            }
          </FormControl>

          {/* Call the button click event when login is clicked */}
          <Button mt="2" colorScheme="indigo" onPress={onLogin}>
            Sign in
          </Button>

          {/* Login with test mode */}
          <Button mt="2" colorScheme="indigo" onPress={testModeActivate}>
            Test Mode
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

        {/* Hide the navigation header on the login screen */}
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
