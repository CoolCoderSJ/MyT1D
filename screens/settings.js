// Import the libraries needed
import * as React from "react"
import {
  ScrollView,
  View,
} from "react-native";
import { VStack, HStack } from 'react-native-stacks';
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
  Button,
  CheckBox
} from "react-native-rapi-ui";
import { StyleSheet, KeyboardAvoidingView } from "react-native";
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }



console.disableYellowBox = true;

const Settings = () => {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [savedSettings, setSettings] = React.useState({});

  const [showitoc, setShowitoc] = React.useState(false);
  const handleToggleitoc = () => setShowitoc(!showitoc);

  const [showisf, setShowisf] = React.useState(false);
  const handleToggleisf = () => setShowisf(!showisf);

  const [showAlert, setShowAlert] = React.useState(false);

  // Remove the alert box when someone comes back to the screen
  React.useEffect(() => {
    const refreshData = navigation.addListener('focus', () => {
      setShowAlert(false)
    });

    return refreshData;
  }, [navigation]);

  // Run once the app has loaded
  React.useEffect(() => {
    // Get the existing factors and set them in the database
    get("factors")
      .then(factors => {
        setSettings({
          ...savedSettings,
          itoc: factors.itoc,
          itocm: factors.itocm,
          itocl: factors.itocl,
          itoca: factors.itoca,
          itocd: factors.itocd,
          itoce: factors.itoce,
          isf: factors.isf,
          isfm: factors.isfm,
          isfl: factors.isfl,
          isfa: factors.isfa,
          isfd: factors.isfd,
          isfe: factors.isfe,
        })
      })
      .catch(error => {
        setSettings({
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
        })
      })
  }, []);


  // Update the database when the user clicks Save
  const onSave = () => {
    setObj('factors', {
      "name": "factors",
      "itoc": savedSettings.itoc,
      "itocm": savedSettings.itocm,
      "itocl": savedSettings.itocl,
      "itoca": savedSettings.itoca,
      "itocd": savedSettings.itocd,
      "itoce": savedSettings.itoce,
      "isf": savedSettings.isf,
      "isfm": savedSettings.isfm,
      "isfl": savedSettings.isfl,
      "isfa": savedSettings.isfa,
      "isfd": savedSettings.isfd,
      "isfe": savedSettings.isfe,
    })
      .then(() => {
        setObj('factors', {
          "name": "factors",
          "itoc": savedSettings.itoc,
          "itocm": savedSettings.itocm,
          "itocl": savedSettings.itocl,
          "itoca": savedSettings.itoca,
          "itocd": savedSettings.itocd,
          "itoce": savedSettings.itoce,
          "isf": savedSettings.isf,
          "isfm": savedSettings.isfm,
          "isfl": savedSettings.isfl,
          "isfa": savedSettings.isfa,
          "isfd": savedSettings.isfd,
          "isfe": savedSettings.isfe,
        }).then(() => {
          console.log("Saved!");
        })
      });
  };


  // Create a style object for the input boxes
  const styles = StyleSheet.create({
    input: {
      height: 40,
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
    },
  });

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

          <Section style={{marginVertical: 20, marginHorizontal: 20}}>
            <SectionContent>
              <View style={{marginBottom: 20}}>
              <Text style={{textAlign: "center"}}>I:C Ratio</Text>
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="General" keyboardType="numeric" value={savedSettings.itoc} onChangeText={(value) => {setSettings({ ...savedSettings, itoc: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Morning" keyboardType="numeric" value={savedSettings.itocm} onChangeText={(value) => {setSettings({ ...savedSettings, itocm: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Lunch" keyboardType="numeric" value={savedSettings.itocl} onChangeText={(value) => {setSettings({ ...savedSettings, itocl: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Midday Snack" keyboardType="numeric" value={savedSettings.itoca} onChangeText={(value) => {setSettings({ ...savedSettings, itoca: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Dinner" keyboardType="numeric" value={savedSettings.itocd} onChangeText={(value) => {setSettings({ ...savedSettings, itocd: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Night Snack" keyboardType="numeric" value={savedSettings.itoce} onChangeText={(value) => {setSettings({ ...savedSettings, itoce: value }); onSave();}} />
              </View>
            </SectionContent>
          </Section>

          <Section style={{marginBottom: 20, marginHorizontal: 20}}>
            <SectionContent>
              <View style={{marginBottom: 20}}>
              <Text style={{textAlign: "center"}}>ISF</Text>
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="General" keyboardType="numeric" value={savedSettings.isf} onChangeText={(value) => {setSettings({ ...savedSettings, isf: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Morning" keyboardType="numeric" value={savedSettings.isfm} onChangeText={(value) => {setSettings({ ...savedSettings, isfm: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Lunch" keyboardType="numeric" value={savedSettings.isfl} onChangeText={(value) => {setSettings({ ...savedSettings, isfl: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Midday Snack" keyboardType="numeric" value={savedSettings.isfa} onChangeText={(value) => {setSettings({ ...savedSettings, isfa: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Dinner" keyboardType="numeric" value={savedSettings.isfd} onChangeText={(value) => {setSettings({ ...savedSettings, isfd: value }); onSave();}} />
              </View>
              <View style={{marginBottom: 20}}>
              <TextInput placeholder="Night Snack" keyboardType="numeric" value={savedSettings.isfe} onChangeText={(value) => {setSettings({ ...savedSettings, isfe: value }); onSave();}} />
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
