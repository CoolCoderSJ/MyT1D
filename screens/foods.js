// Import the libraries needed
import * as React from "react"
import { StyleSheet, TextInput, KeyboardAvoidingView } from "react-native";
import { Ionicons } from '@expo/vector-icons';

import { Box, VStack, FormControl, Button, HStack, Center, View, ScrollView, Icon } from "native-base";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }


export default function App() {
  // Initialize the state
  const [fields, setFields] = React.useState([{}]);

  // Run once the app has loaded
  React.useEffect(() => {
    // Fetch the ingredients from a database
    get("meals").then(function (result) {
      let meals = result;

      if (!meals) {
        meals = {};
      }

      // Set the ingredients in the state
      for (let i = 0; i < Object.keys(meals).length; i++) {
        fields.push({
          meal: meals[String(i)].meal,
          carbs: meals[String(i)].carbs,
          unit: meals[String(i)].unit
        });
      }

      // Remove the empty object that's left over
      handleRemove(0);
    });
  }, []);

  // What happens when an input changes
  function handleChange(i, type, value) {
    // Update the state
    const values = [...fields];
    values[i][type] = value;
    setFields(values);

    // Update the database
    get("meals").then(function (result) {
      let meals = result;

      if (!meals) {
        meals = {};
      }

      meals[i] = {
        meal: fields[i].meal,
        carbs: fields[i].carbs,
        unit: fields[i].unit,
        usedMeals: meals[i].usedMeals
      };

      setObj("meals", meals)
    });


  }

  // What happens when the add new button is clicked
  function handleAdd() {
    // Add a new ingredient to the state and update the database
    const values = [...fields];
    values.push({ meal: null, carbs: null, unit: null, usedMeals: [] });
    setFields(values);
    setObj("meals", values);
  }

  // What happens when the delete button is clicked
  function handleRemove(i) {
    // Remove the ingredient the delete button was clicked for and update the state and database
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    setObj("meals", values);
  }


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
    <ScrollView contentContainerStyle={{ flexGrow: 2 }}>
      <View style={{ padding: 40 }}>
        <Center>
          <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">

            <VStack space={10} mt="5">
              { /* Loop through the ingredients */
                fields.map((field, idx) => {

                  // make a style object for the input
                  const styles = StyleSheet.create({
                    input: {
                      height: 40,
                      borderWidth: 1,
                      padding: 10,
                      borderRadius: 5,
                      marginBottom: 5,
                      width: 200
                    },
                  });

                  return (
                    <HStack space={7}>
                      <View alignItems={'flex-start'}>
                        <FormControl key={`${field}-${idx}`}>
                          <TextInput
                            placeholder="Ingredient name"
                            style={styles.input}
                            onChangeText={e => handleChange(idx, "meal", e)}
                            value={field.meal}
                          />
                          <TextInput
                            placeholder="Carbs"
                            style={styles.input}
                            onChangeText={e => handleChange(idx, "carbs", e)}
                            value={field.carbs}
                            keyboardType="numeric"
                          />
                          <TextInput
                            placeholder="Unit (e.g. cup, oz, etc.)"
                            style={styles.input}
                            onChangeText={e => handleChange(idx, "unit", e)}
                            value={field.unit}
                          />

                        </FormControl>
                      </View>

                      <Button size="lg" colorScheme="error" onPress={() => handleRemove(idx, field)} variant="outline">
                        <Icon
                          color='error.500'
                          size="8"
                          as={<Ionicons name="trash-outline" />}
                        />
                      </Button>

                    </HStack>
                  );
                })}

              <Button leftIcon={<Icon
                color='white'
                size="8"
                as={<Ionicons name="add-outline" />}
              />}

                onPress={handleAdd}
              >Add Ingredient</Button>
            </VStack>
          </Box>
        </Center>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}