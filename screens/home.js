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
import { useNavigation } from '@react-navigation/native';


const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) }}


function Home() {
  const navigation = useNavigation();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [foods, setFoods] = React.useState(0);
  const [recipeCount, setRecipeCount] = React.useState(0);
  const [sugarValues, setSugarValues] = React.useState([]);
  const [first_value, setFirstValue] = React.useState("Loading...");
  const [rotation_factor, setRotationFactor] = React.useState(180);
  const [showSingleArrow, setShowSingleArrow] = React.useState(false);
  const [showDoubleArrow, setShowDoubleArrow] = React.useState(false);
  const [readingValues, setReadingValues] = React.useState([0, 0]);

  React.useEffect(() => {
    const refreshData = navigation.addListener('focus', () => {
    console.log("loading data")
  
    get("meals").then(function(result){
      if (result) {
      setFoods(result.length);
      }
      else {
        setFoods(0);
      }
    });
    
    
    get("recipes").then(function(result){
      if (result) {
      setRecipeCount(result.length);
      }
      else {
        setRecipeCount(0);
      }
    });
    
    
    
    get("readings")
      .then(result => {
        let readings = result
        setFirstValue(readings[0].value)
    
        let trend = readings[0].trend
    
        switch (trend) {
          case "DoubleUp":      {setRotationFactor(90);  setShowDoubleArrow(true);  setShowSingleArrow(true);  break }
          case "SingleUp":      {setRotationFactor(90);  setShowDoubleArrow(false); setShowSingleArrow(true);  break }
          case "FortyFiveUp":   {setRotationFactor(135); setShowDoubleArrow(false); setShowSingleArrow(true);  break }
          case "Flat":          {setRotationFactor(180); setShowDoubleArrow(false); setShowSingleArrow(true);  break }
          case "FortyFiveDown": {setRotationFactor(225); setShowDoubleArrow(false); setShowSingleArrow(true);  break }
          case "SingleDown":    {setRotationFactor(270); setShowDoubleArrow(false); setShowSingleArrow(true);  break }
          case "DoubleDown":    {setRotationFactor(270); setShowDoubleArrow(true);  setShowSingleArrow(true);  break }
          default:              {                        setShowDoubleArrow(false); setShowSingleArrow(false); break }
        }
    
        let rValues = []
        for (let i=0; i<readings.length; i++) {
          rValues.push(readings[i].value)
        }

        setReadingValues(rValues)
      })
    
    getAll().then(function(result){
      console.log("All keys: ", result)
    
      let sValues = [];
      for (let i=0; i<result.length; i++) {
        if (result[i].includes("meal") && !result[i].includes("metadata") && result != "meals") {
          console.log("getting metadata for ", result[i])
          get(result[i]+"metadata").then(function(meta){
            console.log("Sugar value ", meta.dexVal)
            sValues.push(meta.dexVal)
          });
        }
      }

      setSugarValues(sValues)
    
      console.log("All sugar values: " + sugarValues)
    });
    
    forceUpdate();
  });
  return refreshData;
    }, [navigation]);

    
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
