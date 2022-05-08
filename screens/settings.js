// Import the libraries needed
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import {
  KeyboardAvoidingView, ScrollView,
  View
} from "react-native";
import {
  Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";


// Initialize the database functions
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

savedSettings = {}

console.disableYellowBox = true;

const Settings = () => {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Run once the app has loaded
  React.useEffect(() => {
    // Get the existing factors and set them in the field
    get("factors")
      .then(factors => {
        savedSettings = factors
      })
      .catch(error => {
        savedSettings = {
          ...savedSettings,
          itoc: 0,
          itocm: 0,
          itocl: 0,
          itoca: 0,
          itocd: 0,
          itoce: 0,
          isf: 0,
          isfm: 0,
          isfl: 0,
          isfa: 0,
          isfd: 0,
          isfe: 0,
        }
      })
  }, []);


  // Update the database when the user types anything into any textbox
  const onSave = () => {
    setObj('factors', savedSettings)
    get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/factors`, savedSettings)}});
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
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
          middleContent="Settings"
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

          <Section style={{ marginVertical: 20, marginHorizontal: 20 }}>
            <SectionContent>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ textAlign: "center" }}>I:C Ratio</Text>
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="General" keyboardType="numeric" defaultValue={savedSettings.itoc} onChangeText={(value) => { savedSettings = { ...savedSettings, itoc: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Morning" keyboardType="numeric" defaultValue={savedSettings.itocm} onChangeText={(value) => { savedSettings = { ...savedSettings, itocm: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Lunch" keyboardType="numeric" defaultValue={savedSettings.itocl} onChangeText={(value) => { savedSettings = { ...savedSettings, itocl: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Midday Snack" keyboardType="numeric" defaultValue={savedSettings.itoca} onChangeText={(value) => { savedSettings = { ...savedSettings, itoca: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Dinner" keyboardType="numeric" defaultValue={savedSettings.itocd} onChangeText={(value) => { savedSettings = { ...savedSettings, itocd: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Night Snack" keyboardType="numeric" defaultValue={savedSettings.itoce} onChangeText={(value) => { savedSettings = { ...savedSettings, itoce: value }; onSave(); }} />
              </View>
            </SectionContent>
          </Section>

          <Section style={{ marginBottom: 20, marginHorizontal: 20 }}>
            <SectionContent>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ textAlign: "center" }}>ISF</Text>
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="General" keyboardType="numeric" defaultValue={savedSettings.isf} onChangeText={(value) => { savedSettings = { ...savedSettings, isf: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Morning" keyboardType="numeric" defaultValue={savedSettings.isfm} onChangeText={(value) => { savedSettings = { ...savedSettings, isfm: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Lunch" keyboardType="numeric" defaultValue={savedSettings.isfl} onChangeText={(value) => { savedSettings = { ...savedSettings, isfl: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Midday Snack" keyboardType="numeric" defaultValue={savedSettings.isfa} onChangeText={(value) => { savedSettings = { ...savedSettings, isfa: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Dinner" keyboardType="numeric" defaultValue={savedSettings.isfd} onChangeText={(value) => { savedSettings = { ...savedSettings, isfd: value }; onSave(); }} />
              </View>
              <View style={{ marginBottom: 20 }}>
                <TextInput placeholder="Night Snack" keyboardType="numeric" defaultValue={savedSettings.isfe} onChangeText={(value) => { savedSettings = { ...savedSettings, isfe: value }; onSave(); }} />
              </View>
            </SectionContent>
          </Section>
        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>
  )
}

export default () => {
  return (
    <Settings />
  )
}
