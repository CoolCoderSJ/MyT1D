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
  CircularProgress
} from "native-base"
import PouchDB from 'pouchdb-react-native'


console.disableYellowBox = true;

const db = new PouchDB('readings')

let first_value = "Loading..."

function Dexcom () {

  const [value, setValue] = React.useState(0);

  function forceUpdate(){
    setValue(value => value + 1);
}
  db.get("readings")
  .then((dbOutput) => {
    console.log(dbOutput.readings)
    first_value = dbOutput.readings[0].value
    console.log(first_value)
    forceUpdate()
  })

  console.log("first", first_value)

  return (
    <Center flex={1} px="3">
    <Box safeArea p="2" py="8" w="90%" maxW="290">
      <VStack space={3} mt="5">
      <Text>
        {first_value}
      </Text>
      </VStack>
    </Box>
    </Center>
  )
}

export default () => {
  return (
    <Dexcom />
  )
}
