// Import the libraries required
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as React from 'react';
import {
  ScrollView, StyleSheet, View, Alert
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Layout, Text, Button,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";



// Initialize the database functions
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }

// Whether the app is loading or not, used to show and hide the loading spinner
let isLoading = true;

setInterval(() => {
  let loginInfo = null;
  let merged = null;

  get("login").then(res => {
    if (res) {

      loginInfo = res;
      
      axios.get(`https://database.myt1d.repl.co/all/${loginInfo.username}/${loginInfo.password}`)
        .then(response => {
          for (let key in response.data) {
            setObj(key, response.data[key])
          }
        })
    }
  })
}, 5000);

export default App = () => {

  const navigation = useNavigation();
  // Set the state of the app
  const [data, setData] = React.useState({});
  const { isDarkmode, setTheme } = useTheme();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Define styles for the screen selection options
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

  get("pens").then(pens => {
    if (pens) {
    for (let i=0; i<pens.length; i++) {
      let alertedDays = pens[i].alertedDays || [];
      let startDate = new Date(pens[i].takenOut);
      let currentDate = new Date();
      let diffTime = Math.abs(currentDate - startDate);
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays >= 27) {
        if (!alertedDays.includes(currentDate.toLocaleDateString()) && !pens[i].discarded) {
          Alert.alert(
            "Alert", 
            `Your ${pens[i].type} pen with ${pens[i].amount} units left located at ${pens[i].location} has been out for ${diffDays} days. Your pen is about to expire soon.`,
            [
              { 
                text: "OK"
              }
            ]
          );

          alertedDays.push(currentDate.toLocaleDateString());
          pens[i].alertedDays = alertedDays;
          setObj("pens", pens);
        }
      }
    }
  }
  })


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

                    // Finish loading
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
          flex: 1,
          justifyContent: "center",
          alignItems: "center"
        }}>
          <Text color={isDarkmode ? themeColor.white100 : themeColor.dark} size="h2">
            Loading
          </Text>

          <Button style={{ marginHorizontal: 20, marginVertical: 10 }} text="Go Offline" status="primary" onPress={() => isLoading = false} />

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

            <TouchableOpacity onPress={() => navigation.navigate("Pen")}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Insulin Pen"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>


            <TouchableOpacity style={{ marginTop: 50 }} onPress={() => {
              // Delete the login information, then go back to login
              delkey("login").then(() => { navigation.navigate("login"); forceUpdate() })
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
