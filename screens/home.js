// Import all libraries required
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import {
  Dimensions, ScrollView,
  View
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  Layout, Section, SectionContent, Text,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";


// Initialize the database operations
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }

// Initialize the state
let sugarValues = 0;
let arrow = ""

function Home() {

  const { isDarkmode, setTheme } = useTheme();

  // Initialize the state
  const navigation = useNavigation();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [foods, setFoods] = React.useState(0);
  const [recipeCount, setRecipeCount] = React.useState(0);
  const [first_value, setFirstValue] = React.useState("Loading...");
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
            case "DoubleUp": { arrow = "⇈"; break }
            case "SingleUp": { arrow = "↑"; break }
            case "FortyFiveUp": { arrow = "↗"; break }
            case "Flat": { arrow = "→"; break }
            case "FortyFiveDown": { arrow = "↘"; break }
            case "SingleDown": { arrow = "↓"; break }
            case "DoubleDown": { arrow = "⇊"; break }
            default: { arrow = ""; break }
          }

          let rValues = []
          for (let i = 0; i < readings.length; i++) {
            rValues.push(readings[i].value)
          }

          // Set a reverse copy (oldest to latest) of the glucose readings in the state
          setReadingValues(rValues.reverse())
          forceUpdate();
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
    <Layout>
      <TopNav
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white : themeColor.black}
          />
        }
        leftAction={() => navigation.goBack()}
        middleContent="Home"
        rightContent={
          <Ionicons
            name={isDarkmode ? "sunny" : "moon"}
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => {
          if (isDarkmode) {
            setTheme("light");
          } else {
            setTheme("dark");
          }
        }}
      />
      <ScrollView>
        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text size="xl" style={{ textAlign: 'center' }}>Current Glucose Value-
                <Text size="xl" style={{ textAlign: 'center' }}>
                  {first_value} <Text size='h1'>{arrow}</Text>
                </Text>
              </Text>
            </View>

          </SectionContent>
        </Section>

        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text pb="4" size="xl" style={{ textAlign: 'center' }}>Sugar At Last Recorded Meal- <Text color="warning.800">{sugarValues}</Text></Text>
            </View>

          </SectionContent>
        </Section>

        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text size="md" style={{ textAlign: 'center' }}>mg/dl over the past 2 hours-</Text>

            </View>
            {first_value != "Loading..." &&
              <View>
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
                    backgroundColor: isDarkmode ? "rgb(38, 40, 52, 1)" : "rgb(247, 247, 247, 1)",
                    backgroundGradientFrom: isDarkmode ? "rgb(38, 40, 52, 1)" : "rgb(247, 247, 247, 1)",
                    backgroundGradientTo: isDarkmode ? "rgb(38, 40, 52, 1)" : "rgb(247, 247, 247, 1)",
                    decimalPlaces: 0,
                    color: (opacity = 1) => { `rgb(255, 255, 255, ${opacity})` },
                    labelColor: (opacity = 1) => { `rgb(255, 255, 255, ${opacity})` },
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "3",
                      strokeWidth: "1",
                      stroke: "#06b6d4"
                    },
                    propsForLabels: {
                      fill: "white"
                    }
                  }}
                  bezier
                  style={{
                    borderRadius: 16,
                    padding: 10
                  }}
                />
              </View>
            }
            <View>

            </View>
          </SectionContent>
        </Section>

        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text size="md" ml="-1" textAlign="center">
                Foods Stored
              </Text>
              <Text fontWeight="400" textAlign="center">
                {foods}
              </Text>
            </View>
          </SectionContent>
        </Section>

        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text size="md" ml="-1" textAlign="center">
                Recipes Stored
              </Text>
              <Text fontWeight="400" textAlign="center">
                {recipeCount}
              </Text>
            </View>
          </SectionContent>
        </Section>
      </ScrollView>
    </Layout>
  );
}

export default () => {
  return (
    <Home />
  )
}
