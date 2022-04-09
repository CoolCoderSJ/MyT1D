// Import the libraries required
import * as React from 'react';
import { 
  ScrollView, 
  ActivityIndicator,
  View,
  Pressable,
  StyleSheet
 } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import {
  Layout,
  TopNav,
  Text,
  TextInput,
  themeColor,
  SectionContent,
  Section,
  useTheme,
  Button
} from "react-native-rapi-ui";
import { enableScreens } from "react-native-screens";
import { TouchableOpacity } from "react-native-gesture-handler";

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';


// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }

// Whether the app is loading or not, used to show and hide the loading spinner
let isLoading = true;


export default App = () => {
  enableScreens();


  const navigation = useNavigation();
  // Set the state of the app
  const [data, setData] = React.useState({});
  const { isDarkmode, setTheme } = useTheme();

  const styles = StyleSheet.create({
    listItem: {
      marginHorizontal: 20,
      marginTop: 20,
      padding: 20,
      backgroundColor: isDarkmode ? "#262834" : "white",
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });
  

  // Get the login information from the database
  get("login")
    .then(loginInfo => {

      setData({
        ...data,
        username: loginInfo.username,
        password: loginInfo.password
      })

      // If the app is in test mode
      if (data.username == "testDemo" && data.password == "password") {

        // Get a random number within a range
        function getRandom(min, max) {
          return Math.random() * (max - min) + min;
        }

        // Initialize a readings list and all possible trends
        let readings = [];
        let trends = ['DoubleUp', 'SingleUp', 'FortyFiveUp', 'Flat', 'FortyFiveDown', 'SingleDown', 'DoubleDown']

        // Load 24 random glucose values
        for (let i = 0; i < 24; i++) {
          readings.push(
            {
              value: Math.round(getRandom(100, 150)),
              trend: trends[Math.round(getRandom(0, 6))]
            }
          )
        }

        setObj("readings", readings)
          .then(() => isLoading = false)

      }

      else {
        // Get an account id from Dexcom
        axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/AuthenticatePublisherAccount", {
          "accountName": data.username,
          "password": data.password,
          "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
        })
          .then((response) => {
            // Get a session ID from Dexcom
            const account_id = response.data;
            axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/LoginPublisherAccountById", {
              "accountId": account_id,
              "password": data.password,
              "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
            })
              .then((response) => {
                const session_id = response.data;
                // Use the session ID to get the readings
                axios.post(`https://share2.dexcom.com/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${session_id}&minutes=1440&maxCount=24`)
                  .then((response) => {
                    response = response.data;

                    // Set the readings list to the database
                    let readings = []
                    for (let i = 0; i < response.length; i++) {
                      readings.push({
                        value: response[i].Value,
                        trend: response[i].Trend
                      })
                    }

                    setObj("readings", readings)

                    // FInish loading
                    isLoading = false;
                  })
                  .catch(error => console.error(error.response))
              })
              .catch(error => console.error(error.response))
          })
          .catch(error => console.error(error.response))

      }
    })


  return (
      <Layout>

        {isLoading &&
          <View flex={1} px="3" style={{
            flex:1, // Covers the available space
            justifyContent:"center", // aligns through main axis
            alignItems:"center" // aligns though secondary axis
        }}>
              <Text color={isDarkmode ? themeColor.white100 : themeColor.dark} size="h2">
                Loading
              </Text>
          </View>
        }

        {!isLoading &&
        <Layout>
          <TopNav
            middleContent="MyT1D"
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

            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Home"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Ingredients")}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Ingredients"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Insulin")}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Insulin"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Recipes")}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Recipes"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Settings"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

          
            <TouchableOpacity style={{marginTop: 50}} onPress={() =>  {
                  console.log("logging out")
                  delkey("login").then(() => {console.log("deleted"); props.navigation.goBack(); props.navigation.goBack(); props.navigation.goBack(); props.navigation.goBack(); props.navigation.goBack(); props.navigation.goBack()})
                }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">Logout</Text>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

          </ScrollView>
          </Layout>
        }
      </Layout>
  );
}
