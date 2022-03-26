// Import the libraries needed
import * as React from "react"
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Button,
  HStack,
  Center,
  Collapse,
  ScrollView,
  Alert,
  IconButton,
  CloseIcon,
  View,
} from "native-base";
import { StyleSheet, TextInput } from "react-native";
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }



console.disableYellowBox = true;

const Settings = () => {
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
        setShowAlert(true);
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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: 40 }}>
        <Center flex={1} px="3">
          <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">
            <Heading
              size="lg"
              fontWeight="600"
              color="coolGray.800"
              _dark={{
                color: "warmGray.50",
              }}
            >
              Settings
            </Heading>

            <Collapse isOpen={showAlert}>
              <Alert w="100%" status={"success"}>
                <VStack space={2} flexShrink={1} w="100%">
                  <HStack flexShrink={1} space={2} justifyContent="space-between">
                    <HStack space={2} flexShrink={1}>
                      <Alert.Icon mt="1" />
                      <Text fontSize="md" color="coolGray.800">
                        Successfully Saved!
                      </Text>
                    </HStack>
                    <IconButton
                      variant="unstyled"
                      icon={<CloseIcon size="3" color="coolGray.600" />}
                      onPress={() => setShowAlert(false)}
                    />
                  </HStack>
                </VStack>
              </Alert>
            </Collapse>


            <VStack space={10} mt="5">
              <FormControl>
                <FormControl.Label>I:C Ratio</FormControl.Label>
                <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.itoc} onChangeText={(value) => setSettings({ ...savedSettings, itoc: value })} />
              </FormControl>

              <Collapse isOpen={showitoc}>
                <FormControl>
                  <FormControl.Label>I:C Ratio - Morning</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.itocm} onChangeText={(value) => setSettings({ ...savedSettings, itocm: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>I:C Ratio - Lunch</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.itocl} onChangeText={(value) => setSettings({ ...savedSettings, itocl: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>I:C Ratio - Midday Snack</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.itoca} onChangeText={(value) => setSettings({ ...savedSettings, itoca: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>I:C Ratio - Dinner</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.itocd} onChangeText={(value) => setSettings({ ...savedSettings, itocd: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>I:C Ratio - Night Snack</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.itoce} onChangeText={(value) => setSettings({ ...savedSettings, itoce: value })} />
                </FormControl>
              </Collapse>

              <Button size="sm" colorScheme="indigo" onPress={handleToggleitoc}>
                <Text color="white">{showitoc ? 'Hide' : 'Show'} Individual Meal Values</Text>
              </Button>

              <FormControl>
                <FormControl.Label>Insulin Sensitivity Factor</FormControl.Label>
                <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.isf} onChangeText={(value) => setSettings({ ...savedSettings, isf: value })} />
              </FormControl>


              <Collapse isOpen={showisf}>
                <FormControl>
                  <FormControl.Label>ISF - Morning</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.isfm} onChangeText={(value) => setSettings({ ...savedSettings, isfm: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>ISF - Lunch</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.isfl} onChangeText={(value) => setSettings({ ...savedSettings, isfl: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>ISF - Midday Snack</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.isfa} onChangeText={(value) => setSettings({ ...savedSettings, isfa: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>ISF - Dinner</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.isfd} onChangeText={(value) => setSettings({ ...savedSettings, isfd: value })} />
                </FormControl>

                <FormControl>
                  <FormControl.Label>ISF - Night Snack</FormControl.Label>
                  <TextInput style={styles.input} keyboardType="numeric" value={savedSettings.isfe} onChangeText={(value) => setSettings({ ...savedSettings, isfe: value })} />
                </FormControl>
              </Collapse>

              <Button size="sm" colorScheme="indigo" onPress={handleToggleisf}>
                <Text color="white">{showisf ? 'Hide' : 'Show'} Individual Meal Values</Text>
              </Button>


              <Button mt="2" colorScheme="indigo" onPress={onSave}>
                Save!
              </Button>
            </VStack>
          </Box>
        </Center>
      </View>
    </ScrollView>
  )
}

export default () => {
  return (
    <Settings />
  )
}
