// Import all libraries required
import * as React from 'react';
import { Box, Heading, VStack, Text, Center, HStack, Stack, View } from 'native-base';
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Arrow from 'react-native-arrow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Initialize the database operations
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }

// Initialize the state
let sugarValues = 0;

function Home() {
  // Initialize the state
  const navigation = useNavigation();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [foods, setFoods] = React.useState(0);
  const [recipeCount, setRecipeCount] = React.useState(0);
  const [first_value, setFirstValue] = React.useState("Loading...");
  const [rotation_factor, setRotationFactor] = React.useState(180);
  const [showSingleArrow, setShowSingleArrow] = React.useState(false);
  const [showDoubleArrow, setShowDoubleArrow] = React.useState(false);
  const [readingValues, setReadingValues] = React.useState([0, 0]);

  // Run once the app has loaded
  React.useEffect(() => {
    // Run the function every time the user switches to the screen
    const refreshData = navigation.addListener('focus', () => {

      // Get the total number of foods and set it in the state
      get("meals").then(function (result) {
        if (result) {
          setFoods(result.length);
        }
        else {
          setFoods(0);
        }
      });

      // Get the total number of recipes and set it in the state
      get("recipes").then(function (result) {
        if (result) {
          setRecipeCount(result.length);
        }
        else {
          setRecipeCount(0);
        }
      });


      // Get glucose readings from the database
      get("readings")
        .then(result => {
          // Set the latest glucose value in the state
          let readings = result
          setFirstValue(readings[0].value)

          let trend = readings[0].trend

          // Set the arrow direction based on the trend
          switch (trend) {
            case "DoubleUp": { setRotationFactor(90); setShowDoubleArrow(true); setShowSingleArrow(true); break }
            case "SingleUp": { setRotationFactor(90); setShowDoubleArrow(false); setShowSingleArrow(true); break }
            case "FortyFiveUp": { setRotationFactor(135); setShowDoubleArrow(false); setShowSingleArrow(true); break }
            case "Flat": { setRotationFactor(180); setShowDoubleArrow(false); setShowSingleArrow(true); break }
            case "FortyFiveDown": { setRotationFactor(225); setShowDoubleArrow(false); setShowSingleArrow(true); break }
            case "SingleDown": { setRotationFactor(270); setShowDoubleArrow(false); setShowSingleArrow(true); break }
            case "DoubleDown": { setRotationFactor(270); setShowDoubleArrow(true); setShowSingleArrow(true); break }
            default: { setShowDoubleArrow(false); setShowSingleArrow(false); break }
          }

          let rValues = []
          for (let i = 0; i < readings.length; i++) {
            rValues.push(readings[i].value)
          }

          // Set a reverse copy (oldest to latest) of the glucose readings in the state
          setReadingValues(rValues.reverse())
        })

      // Get every thing from the database
      getAll().then(function (result) {

        let sValues = [];
        // Loop through all of the keys
        for (let i = 0; i < result.length; i++) {
          // If the key is an identifier for a meal
          if (result[i].includes("meal") && !result[i].includes("metadata") && result != "meals") {
            // Get the metadata stored
            get(result[i] + "metadata").then(function (meta) {
              // If a glucose value was stored
              if (meta.dexVal) {
                // Set the last glucose value to the value found
                sValues.push(meta.dexVal)
                sugarValues = sValues[0];
                forceUpdate()
              }
            });
          }
        }
      });

      // Update the screen render
      forceUpdate();
    });
    return refreshData;
  }, [navigation]);


  return (
    <Center flex={1} px="3">

      <Box safeArea w="100%" p="2" py="8">
        <VStack space={3} mt="5">
          <Text color="primary.500" fontSize="xl" style={{ textAlign: 'center' }}>Current Glucose Value-
            <Text color="warning.800" fontSize="xl" style={{ textAlign: 'center' }}>
              {first_value}

              {showSingleArrow &&
                <View pl="1" style={[{ transform: [{ rotate: `${rotation_factor}deg` }] }]}><Arrow size={10} color={'#9a3412'} /></View>
              }

              {showDoubleArrow &&
                <View style={[{ transform: [{ rotate: `${rotation_factor}deg` }] }]}><Arrow size={10} color={'#9a3412'} /></View>
              }
            </Text>
          </Text>

          <Text pb="4" color="primary.500" fontSize="xl" style={{ textAlign: 'center' }}>Sugar At Last Recorded Meal- <Text color="warning.800">{sugarValues}</Text></Text>

          <Text fontSize="md" style={{ textAlign: 'center' }}>mg/dl over the past 2 hours-</Text>

          {first_value != "Loading..." &&
            <Center>
              <LineChart
                data={{
                  labels: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                  datasets: [
                    {
                      data: readingValues
                    }
                  ]
                }}
                width={Dimensions.get("window").width - (Dimensions.get("window").width - 300)}
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
