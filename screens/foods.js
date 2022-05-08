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
  Button, Layout, Section, SectionContent, TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";





// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

// Initialize the variables
let filterAllowed = []

export default function App() {
  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const navigation = useNavigation();
  const { isDarkmode, setTheme } = useTheme();
  const [fields, setFields] = React.useState([]);

  // Run once the app has loaded
  React.useEffect(() => {
    // Fetch the ingredients from a database
    get("meals").then(function (result) {
      let meals = result;

      if (!meals) {
        meals = {};
      }

      let fieldsToSet = []

      // Set the ingredients in the state
      for (let i = 0; i < Object.keys(meals).length; i++) {
        fieldsToSet.push({
          meal: meals[String(i)].meal,
          carbs: meals[String(i)].carbs,
          unit: meals[String(i)].unit
        });
        filterAllowed.push(i);
      }

      setFields(fieldsToSet);

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

      // Find the meals in which the ingredient is used
      let usedMeals = []
      if (meals[i]) {
        if (meals[i].usedMeals) {
          usedMeals = meals[i].usedMeals
        }
      }

      meals[i] = {
        meal: fields[i].meal,
        carbs: fields[i].carbs,
        unit: fields[i].unit,
        usedMeals: usedMeals
      }

      const values = [...fields];
      if (values[i]['meal'] && values[i]['meal'] != "") {
        setObj("meals", meals)
        get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/meals`, meals)}});
      }
    });


  }

  // What happens when the add new button is clicked
  function handleAdd() {
    // Add a new ingredient to the state and update the database
    const values = [...fields];
    values.push({ meal: null, carbs: null, unit: null, usedMeals: [] });
    setFields(values);
    filterAllowed.push(fields.length - 1);
    forceUpdate();
  }

  // What happens when the delete button is clicked
  function handleRemove(i) {
    // Remove the ingredient the delete button was clicked for and update the state and database
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    setObj("meals", values);
    get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/meals`, values)}});
  }


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
          middleContent="Ingredients"
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
          <View
            style={{
              marginHorizontal: 20,
              marginVertical: 20,
            }}
          >
            <TextInput
              placeholder="Search..."
              leftContent={
                <Ionicons
                  name="search-circle"
                  size={20}
                  color={themeColor.gray300}
                />
              }
              onChangeText={e => {
                // When something is searched, get all ingredients
                let values = [...fields];
                // Clean the filter list
                let allowed = []
                // Loop through all the ingredients
                for (let i = 0; i < values.length; i++) {
                  // If the ingredient contains the search term
                  if (values[i].meal.toLowerCase().includes(e.toLowerCase())) {
                    // Add the ingredient to the filter list
                    allowed.push(i);
                  }
                }

                // Set the filter list
                filterAllowed = allowed;
                forceUpdate();
              }}
            />
          </View>

          {
            fields.map((field, idx) => {
              return (
                <View>
                  {filterAllowed.includes(idx) &&

                    <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                      <SectionContent>
                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Ingredient name"
                            onChangeText={e => handleChange(idx, "meal", e)}
                            defaultValue={field.meal}
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Carbs"
                            onChangeText={e => handleChange(idx, "carbs", e)}
                            defaultValue={field.carbs}
                            keyboardType="numeric"
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Unit (e.g. cup, oz, etc.)"
                            onChangeText={e => handleChange(idx, "unit", e)}
                            defaultValue={field.unit}
                          />
                        </View>

                        <View>
                          <Button
                            style={{ marginTop: 10 }}
                            leftContent={
                              <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                            }
                            text="Remove"
                            status="danger"
                            type="TouchableOpacity"
                            onPress={() => { handleRemove(idx) }}
                          />
                        </View>
                      </SectionContent>
                    </Section>
                  }
                </View>
              )
            })
          }
          <Button
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
              <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
            }
            text="Add New Ingredient"
            status="primary"
            type="TouchableOpacity"
            onPress={handleAdd}
          />
        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>
  );
}