import * as React from 'react';
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
import PouchDB from 'pouchdb-react-native'
import axios from 'axios';


function Home() {
  return (
    <Center flex={1} px="3">
      <Text>Hi :D</Text>
      </Center>
  );
}

export default () => {
  return (
    <Home />
  )
}