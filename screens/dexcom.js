import * as React from "react"
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
  CircularProgress,
  Container,
  Spinner
} from "native-base"
import PouchDB from 'pouchdb-react-native'

console.disableYellowBox = true;

const db = new PouchDB('readings')

let first_value = "e";


export default () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  db.get("readings")
  .then((dbOutput) => {
    first_value = dbOutput.readings[0].value
    console.log(first_value)
    forceUpdate()
  })

  return (
    <Box safeArea p="2" py="8" w="90%" maxW="290">
    <Center flex={1} px="3">
    <VStack space={3} mt="5">
    <Heading color="primary.500" fontSize="3xl" style={{textAlign: 'center'}}>
      {first_value}
    </Heading>
    </VStack>
    </Center>
    </Box>
  )
}
