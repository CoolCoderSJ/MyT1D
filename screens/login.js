// Import the necessary libraries
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as React from "react";
import { ScrollView, View } from "react-native";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";


// Disable warnings that aren't important
console.disableYellowBox = true;



// Initialize database methods
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }


// Create the login screen function
export default Login = () => {

  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize state
  const [formData, setData] = React.useState({});
  const [errors, setErrors] = React.useState({});

  get("login").then(result => {
    if (result) {
      navigation.navigate('app')
    }
  })

  // Setup the validation function
  const validate = async () => {

    // If the form is empty, return an error
    if (formData.username === undefined || formData.password === undefined) {
      setErrors({
        ...errors,
        name: 'Both fields are required',
      });
      return false;
    }

    // Validate the account with Dexcom's api, if it fails, return an error
    try {
      const response = await axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/AuthenticatePublisherAccount", {
        "accountName": formData.username,
        "password": formData.password,
        "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
      });

      const account_id = response.data;
      const ok = account_id && account_id !== "";

      setErrors({
        ...errors,
        name: ok ? null : 'Incorrect credentials',
      });
      return ok;
    } catch (error) {
      setErrors({
        ...errors,
        name: 'Incorrect credentials',
      });
      return false;
    }
  }

  // When the user submits the form, validate the credentials
  const onLogin = () => {
    validate()
      .then(function (check) {
        if (check) {

          setObj("login", {
            username: formData.username,
            password: formData.password
          })
          navigation.navigate('app')
        }
        else {
          return false
        }
      })
  };

  // If the user picks the test mode option, let the app know and skip the login screen
  const testModeActivate = () => {
    setObj("login", {
      username: "testDemo",
      password: "password"
    })
    navigation.navigate('app')
  };

  return (
    <Layout>
      <TopNav
        leftAction={() => navigation.goBack()}
        middleContent="Login"
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
              <Text style={{ marginBottom: 10 }}>{errors.name ? errors['name'] : "Enter your username"}</Text>

              <TextInput
                placeholder="Enter your username"
                onChangeText={(value) => setData({ ...formData, username: value })}
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>
                {errors.name ? errors['name'] : "Enter your password"}
              </Text>

              <TextInput
                placeholder="Enter your password"
                onChangeText={(value) => setData({ ...formData, password: value })}
                leftContent={
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={themeColor.gray300}
                  />
                }
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Button
                style={{ marginTop: 10 }}
                text="Login"
                status="primary"
                type="TouchableOpacity"
                onPress={onLogin}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Button
                style={{ marginTop: 10 }}
                text="Test Mode"
                status="primary"
                type="TouchableOpacity"
                onPress={testModeActivate}
              />
            </View>

          </SectionContent>
        </Section>
      </ScrollView>
    </Layout>
  );
}
