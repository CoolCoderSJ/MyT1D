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
import axios from 'axios';

console.disableYellowBox = true;

const db = new PouchDB('settings')


const Stack = createNativeStackNavigator();



const Login = ({ navigation }) => {
  db.get("login").then(function(value) { 
    console.log(value)
    if (!value) {
      return
    }
    else {
      navigation.navigate('Home')
    }
  })

  const [formData, setData] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const validate = async () => {
  
    if (formData.username === undefined || formData.password === undefined) {
      setErrors({
        ...errors,
        name: 'Both fields are required',
      });
      return false;
    } 

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
    console.log(error.response);
    setErrors({
        ...errors,
        name: 'Incorrect credentials',
    });
    return false;
}
  }

  const onLogin = () => {
    validate()
    .then(function (check) {
    if (check) {
      db.put({
        "_id": "login",
        "login": {
          "username": formData['username'],
          "password": formData['password']
        }
      });
      navigation.navigate('Home')
    }
    else {
      return false
    }
  })
  };

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
        <FormControl isRequired={true} isInvalid={errors['name']}>
          <FormControl.Label>Username</FormControl.Label>
          <Input onChangeText={(value) => setData({ ...formData, username: value })} />

          {errors['name'] ?
        <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>{errors.name}</FormControl.ErrorMessage>
:

        <FormControl.HelperText _text={{fontSize: 'xs'}}>
        </FormControl.HelperText>
        }
        </FormControl>
        <FormControl isRequired={true} isInvalid={errors['name']}>
          <FormControl.Label>Password</FormControl.Label>
          <Input type="password" onChangeText={(value) => setData({ ...formData, password: value })} />

          {errors['name'] ?
        <FormControl.ErrorMessage _text={{fontSize: 'xs', color: 'error.500', fontWeight: 500}}>{errors.name}</FormControl.ErrorMessage>
:

        <FormControl.HelperText _text={{fontSize: 'xs'}}>
        </FormControl.HelperText>
        }
        </FormControl>

        <Button mt="2" colorScheme="indigo" onPress={onLogin}>
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
