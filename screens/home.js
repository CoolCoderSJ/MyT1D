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
  Container,
  Stack,
  View
} from 'native-base';
import { Dimensions } from "react-native";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from "react-native-chart-kit";
import Arrow from 'react-native-arrow';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) }}


let foods = 0;
let recipeCount = 0;
let sugarValues = []

get("meals").then(function(result){
  if (result) {
  foods = result.length;
  }
  else {
    foods = 0;
  }
});


get("recipes").then(function(result){
  if (result) {
  recipeCount = result.length;
  }
  else {
    recipeCount = 0;
  }
});


let first_value = "Loading..."
let readings = []
let rotation_factor = 180
let showSingleArrow = false
let showDoubleArrow = false
let readingValues = []


get("readings")
  .then(result => {
    readings = result
    first_value = readings[0].value

    let trend = readings[0].trend

    switch (trend) {
      case "DoubleUp":      {rotation_factor = 90;  showDoubleArrow = true;  showSingleArrow = true;  break }
      case "SingleUp":      {rotation_factor = 90;  showDoubleArrow = false; showSingleArrow = true;  break }
      case "FortyFiveUp":   {rotation_factor = 135; showDoubleArrow = false; showSingleArrow = true;  break }
      case "Flat":          {rotation_factor = 180; showDoubleArrow = false; showSingleArrow = true;  break }
      case "FortyFiveDown": {rotation_factor = 225; showDoubleArrow = false; showSingleArrow = true;  break }
      case "SingleDown":    {rotation_factor = 270; showDoubleArrow = false; showSingleArrow = true;  break }
      case "DoubleDown":    {rotation_factor = 270; showDoubleArrow = true;  showSingleArrow = true;  break }
      default:              {                       showDoubleArrow = false; showSingleArrow = false; break }
    }

    readingValues = []
    for (let i=0; i<readings.length; i++) {
      readingValues.push(readings[i].value)
    }
  })

getAll().then(function(result){
  console.log("All keys: ", result)

  for (let i=0; i<result.length; i++) {
    if (result[i].includes("meal") && !result[i].includes("metadata") && result != "meals") {
      console.log("getting metadata for ", result[i])
      get(result[i]+"metadata").then(function(meta){
        console.log("Sugar value ", meta.dexVal)
        sugarValues.push(meta.dexVal)
      });
    }
  }

  console.log("All sugar values: " + sugarValues)

});

function Home() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  return (
    <Center flex={1} px="3">

    <Box safeArea w="100%" p="2" py="8">
    <VStack space={3} mt="5">
      <Text color="primary.500" fontSize="xl" style={{textAlign: 'center'}}>Current Glucose Value-
    <Text color="warning.800" fontSize="xl" style={{textAlign: 'center'}}>
      {first_value}

      {showSingleArrow &&
      <View pl="1" style={[{transform: [{ rotate: `${rotation_factor}deg` }]}]}><Arrow size={10} color={'#9a3412'} /></View>
      }

      {showDoubleArrow &&
        <View style={[{transform: [{ rotate: `${rotation_factor}deg` }]}]}><Arrow size={10} color={'#9a3412'} /></View>
      }
    </Text>
    </Text>

    <Text pb="4" color="primary.500" fontSize="xl" style={{textAlign: 'center'}}>Sugar At Last Recorded Meal- <Text color="warning.800">{sugarValues[0]}</Text></Text>

    <Text fontSize="md" style={{textAlign: 'center'}}>mg/dl over the past 2 hours-</Text>

    {first_value!="Loading..." &&
    <Center>
    <LineChart
        data={{
          labels: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          datasets: [
            {
              data: readingValues.reverse()
            }
          ]
        }}
        width={Dimensions.get("window").width-(Dimensions.get("window").width-300)}
        height={325}
        chartConfig={{
          backgroundColor: "#000000",
          backgroundGradientFrom: "#000000",
          backgroundGradientTo: "#000000",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "3",
            strokeWidth: "1",
            stroke: "#06b6d4"
          }
        }}
        bezier
        style={{
          borderRadius: 16,   
          padding: 10       
        }}
      />
      </Center>
    }
    </VStack>
    </Box>

    <HStack>
    <Box alignItems="center">
          <Box w="100%" h="40" mb="10" textAlign="center" shadow="9" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _dark={{
          borderColor: "coolGray.600",
          backgroundColor: "gray.700"
        }} _web={{
          shadow: 2,
          borderWidth: 0
        }} _light={{
          backgroundColor: "gray.50"
        }}>
            <Stack p="4" space={3}>
              <Stack space={2}>
                <Heading size="md" ml="-1" textAlign="center">
                  Foods Stored
                </Heading>
              </Stack>
              <Text fontWeight="400" textAlign="center">
                {foods}
              </Text>
            </Stack>
          </Box>
        </Box>



        <Box alignItems="center">
          <Box w="100%" h="40" mb="10" textAlign="center" shadow="9" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _dark={{
          borderColor: "coolGray.600",
          backgroundColor: "gray.700"
        }} _web={{
          shadow: 2,
          borderWidth: 0
        }} _light={{
          backgroundColor: "gray.50"
        }}>
            <Stack p="4" space={3}>
              <Stack space={2}>
                <Heading size="md" ml="-1" textAlign="center">
                  Recipes Stored
                </Heading>
              </Stack>
              <Text fontWeight="400" textAlign="center">
                {recipeCount}
              </Text>
            </Stack>
          </Box>
        </Box>
        </HStack>

      </Center>
  );
}

export default () => {
  return (
    <Home />
  )
}
