import * as React from "react"
import { Dimensions } from "react-native";
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
  Spinner,
  View,
  Hidden
} from "native-base"
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from "react-native-chart-kit";
import Arrow from 'react-native-arrow';
import AsyncStorage from '@react-native-async-storage/async-storage';

const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}


console.disableYellowBox = true;

let first_value = "Loading..."
let readings = []
let rotation_factor = 180
let showSingleArrow = false
let showDoubleArrow = false
let readingValues = []

export default () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

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

    forceUpdate()
  })

  return (
    <Center flex={1} px="3">
    <Box safeArea p="2" py="8" h="80%" w="90%" maxW="290">
    <VStack space={3} mt="5">
    <Text color="primary.500" fontSize="6xl" style={{textAlign: 'center'}}>
      {first_value}

      {showSingleArrow &&
      <View pl="1" style={[{transform: [{ rotate: `${rotation_factor}deg` }]}]}><Arrow size={30} color={'#06b6d4'} /></View>
      }

      {showDoubleArrow &&
        <View style={[{transform: [{ rotate: `${rotation_factor}deg` }]}]}><Arrow size={30} color={'#06b6d4'} /></View>
      }
    </Text>

    {first_value!="Loading..." &&
    <LineChart
        data={{
          labels: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          datasets: [
            {
              data: readingValues
            }
          ]
        }}
        width={Dimensions.get("window").width-(Dimensions.get("window").width-290)}
        height={325}
        yAxisSuffix=" mg/dl"
        chartConfig={{
          backgroundColor: "#f2f2f2",
          backgroundGradientFrom: "#f2f2f2",
          backgroundGradientTo: "#f2f2f2",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(242, 242, 242, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#06b6d4"
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    }
    </VStack>
    </Box>
    </Center>
  )
}
