// Import the libraries needed
import * as React from "react"
import { StyleSheet, KeyboardAvoidingView } from "react-native";
import {
  ScrollView,
  ActivityIndicator,
  View,
  Pressable,
  Switch
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

import { TouchableOpacity } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker';
import { ma } from 'moving-averages';
import { useNavigation } from '@react-navigation/native';


// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

// Initialize all of the variables
let foodUnits = "";
let correction = "";
let totalUnits = "";
let meal = "";
let factors = {};
let readings = [];
let sugarValue = 0;
let totalCarb = 0;
let mainMealSelected = false
let mainMeal = undefined
let showAlert = false;
let amount = "";
let settingsMissing = false;


export default function App() {
  const navigation = useNavigation();

  // Initialize the state
  const { isDarkmode, setTheme } = useTheme();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [fields, setFields] = React.useState([{}]);

  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);

  const [servingSizes, setServingSizes] = React.useState({});
  const [date, setDate] = React.useState(new Date());
  const [show, setShow] = React.useState(false);

  const [showInsulinEditor, setShowInsulinEditor] = React.useState(false);


  const fetchMeals = () => {
    // Fetch the ingredients from a database
    get(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`).then((result) => {
      if (result) {
        // Set the state to the ingredients found
        setFields(result);

        // Loop through all of the ingredients
        for (let a = 0; a < result.length; a++) {
          // Get the list of all ingredients
          get("meals").then((foods) => {
            if (foods) {
              // For each ingredient in the database
              for (let b = 0; b < foods.length; b++) {
                // If the ingredient in the database found matches the ingredient in the state
                if (foods[b].meal == result[a].meal && result[a].mainMeal) {
                  let mealMap = {
                    "Breakfast": "Lunch",
                    "Lunch": "PMSnack",
                    "PMSnack": "Dinner",
                    "Dinner": "NightSnack",
                    "NightSnack": "Breakfast",
                  }

                  let sugarValueList = [];

                  // Get the sugar value for the meal after the meal that the ingredient is in
                  for (let j = 0; j < foods[b]['usedMeals'].length; j++) {
                    let usedMealId = foods[b]['usedMeals'][j];
                    let usedMealName = usedMealId.split("meal")[1].replace(/[0-9]/g, '');
                    let restOfTheId = usedMealId.split(usedMealName)[0];

                    let nextId = `${restOfTheId}${mealMap[usedMealName]}`;

                    let currentval = 0;

                    get(`${usedMealId}metadata`).then((metadata) => {
                      if (metadata) {
                        if (metadata.dexVal) {
                          currentval = metadata.dexVal;

                          get(`${nextId}metadata`)
                      .then((result) => {
                        if (result) {
                          if (result.dexVal) {
                            sugarValueList.push(currentval - result.dexVal)
                          }
                        }
                      })
                      .then(() => {
                        // If there were any ingredients found
                        if (sugarValueList && sugarValueList.length > 0) {
                          // Get a moving average of all of the previous sugar values
                          let averages = ma(sugarValueList, sugarValueList.length);
                          let prediction = averages[sugarValueList.length - 1];

                          // Show the message
                          if (prediction > 0) {
                            amount = `${prediction} higher`
                          }

                          else {
                            amount = `${0-1*prediction} lower`
                          }

                          showAlert = true;
                          mainMealSelected = true;
                          mainMeal = a;
                        }
                      })
                        }
                      }
                    })
                  }
                }
              }
            }
          });

        }

        // Run the insulin calculator
        calculateInsulin();
      }
      else {
        // Clear the state
        showAlert = false;
        mainMeal = undefined;
        mainMealSelected = false;
        totalCarb = 0;
        setFields([{}])
      }
    })

    // Update the factors variable from the database
    get("factors").then((result) => {
      if (result) {
        factors = result;
      }
    });


  }

  const calculateInsulin = () => {
    // Get the ingredients
    get(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`).then((values) => {

      let specificItoCFactor = null;
      let specificISFFactor = null;
      let generalIToCFactor = factors.itoc;
      let generalISFFactor = factors.isf;

      // Get the specific factors
      switch (meal) {
        case "Breakfast": specificItoCFactor = factors.itocm; break;
        case "Lunch": specificItoCFactor = factors.itocl; break;
        case "PMSnack": specificItoCFactor = factors.itoca; break;
        case "Dinner": specificItoCFactor = factors.itocd; break;
        case "NightSnack": specificItoCFactor = factors.itoce; break;
      }

      switch (meal) {
        case "Breakfast": specificISFFactor = factors.isfm; break;
        case "Lunch": specificISFFactor = factors.isfl; break;
        case "PMSnack": specificISFFactor = factors.isfa; break;
        case "Dinner": specificISFFactor = factors.isfd; break;
        case "NightSnack": specificISFFactor = factors.isfe; break;
      }

      // If there aren't any specific factors, use the general ones
      if (!specificItoCFactor) { specificItoCFactor = generalIToCFactor };
      if (!specificISFFactor) { specificISFFactor = generalISFFactor };

      // If there are no factors, skip all steps and show the user a message
      if (!generalIToCFactor || !generalISFFactor) {
        settingsMissing = true;
      }

      // Calculate the total carbs
      totalCarb = 0;
      for (let i = 0; i < values.length; i++) {
        if (values[i].carbs) {
          totalCarb += Number(values[i].carbs);
        }
      };

      // Get the dexcom values
      get("readings").then((result) => {
        readings = result;


        let dexVal = readings[0].value;

        sugarValue = dexVal;

        let threshold = null;

        // Set the threshold
        switch (meal) {
          case "Breakfast": threshold = 100; break;
          case "Lunch": threshold = 100; break;
          case "PMSnack": threshold = 100; break;
          case "Dinner": threshold = 100; break;
          case "NightSnack": threshold = 120; break;
        }

        // Calculate the food units and round to 2 places
        foodUnits = String((totalCarb / specificItoCFactor).toFixed(2));

        // Check if correction is needed
        if (dexVal > threshold) {
          // Calculate the correction factor and round to 2 places
          correction = String(((dexVal - threshold) / specificISFFactor).toFixed(2));
        }
        else {
          correction = '0';
        }

        // Calculate the total insulin
        totalUnits = String((Number(foodUnits) + Number(correction)).toFixed(2));

        // Show the user a message if there are no settings to use to calculate
        if (String(foodUnits) == "NaN") {
          foodUnits = "Not Available"
        }

        if (String(correction) == "NaN") {
          correction = "Not Available"
        }

        if (String(totalUnits) == "NaN") {
          totalUnits = "Not Available"
        }

      }).then(() => {

        // Set the metadata to the database 
        setObj(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}metadata`, {
          dexVal: sugarValue,
          totalCarb: totalCarb,
        })

        // Update the screen rendering
        forceUpdate()

      });
    });
  }

  // What happens when an ingredient is changed
  function handleChange(i, type, value) {

    // If there is no value to update, skip function
    if (value == null || value == undefined) {
      return
    }

    // Get the ingredients from the state
    const values = [...fields];

    // Remove noise from data
    if (type === "meal") {
      value = value.title;
    }

    // Update the value
    values[i][type] = value;


    // Get all ingredients 
    get("meals").then(function (result) {

      let foods = result;

      let id = `meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`

      // Loop through all ingredients in the state
      for (let a = 0; a < foods.length; a++) {
        // if the ingredient is found
        if (values && foods[a]['meal'] == values[i]['meal']) {

          // If the current ingredient is being used as a main meal
          if (type === "mainMeal") {
            if (value && !foods[a]['usedMeals'].includes(id)) {
              // Update the foods list to add the current meal's id to the list of meals the food is a mainmeal in
              foods[a]["usedMeals"].push(id)
            }
            else if (!value) {
              let index = foods[a]['usedMeals'].indexOf(id);
              if (index > -1) {
                foods[a]['usedMeals'].splice(index, 1);
                showAlert = false;
              }
            }

            // Get the sugar value for the next meal
            if (value) {
              let mealMap = {
                "Breakfast": "Lunch",
                "Lunch": "PMSnack",
                "PMSnack": "Dinner",
                "Dinner": "NightSnack",
                "NightSnack": "Breakfast",
              }

              let sugarValueList = [];

              for (let j = 0; j < foods[a]['usedMeals'].length; j++) {
                let usedMealId = foods[a]['usedMeals'][j];
                let usedMealName = usedMealId.split("meal")[1].replace(/[0-9]/g, '');
                let restOfTheId = usedMealId.split(usedMealName)[0];

                let nextId = `${restOfTheId}${mealMap[usedMealName]}`;

                let currentval = 0;

                    get(`${usedMealId}metadata`).then((metadata) => {
                      if (metadata) {
                        if (metadata.dexVal) {
                          currentval = metadata.dexVal;

                          get(`${nextId}metadata`)
                      .then((result) => {
                        if (result) {
                          if (result.dexVal) {
                            sugarValueList.push(currentval - result.dexVal)
                          }
                        }
                      })
                      .then(() => {
                        // If there were any ingredients found
                        if (sugarValueList && sugarValueList.length > 0) {
                          // Get a moving average of all of the previous sugar values
                          let averages = ma(sugarValueList, sugarValueList.length);
                          let prediction = averages[sugarValueList.length - 1];

                          // Show the message
                          if (prediction > 0) {
                            amount = `${prediction} higher`
                          }

                          else {
                            amount = `${0-1*prediction} lower`
                          }

                      showAlert = true;
                    }


                  })

              }

            }
          });

        }
      }

      // Update the foods database
      setObj("meals", foods);
      // Update the state
      setFields(values);

      // Update the meals database then calculate the insulin
      setObj(id, values).then(() => calculateInsulin());

          }
        }
      }
    });


  }

  // When a new ingredient is added
  function handleAdd() {
    const values = [...fields];
    // Add a new blank set
    values.push({ meal: null, carbs: null, unit: null });

    // Update the state and database
    setFields(values);
    setObj(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`, values);
  }

  // What happens when a delete button is clicked
  function handleRemove(i) {
    const values = [...fields];
    // Remove the selected ingredient
    values.splice(i, 1);
    // Update the state and database
    setFields(values);
    setObj(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`, values).then(() => calculateInsulin())
  }

  // Update the dropdown data every time the user comes back to this screen from another
  React.useEffect(() => {
    const setDropDownListData = () => {
      let meals = [];
      let carbFood = [];

      get("meals").then(function (result) {
        for (let i = 0; i < Object.keys(result).length; i++) {
          meals.push({ id: String(i + 2), title: result[String(i)].meal });

          carbFood.push(result[String(i)]);
        }

        get("recipes").then((result) => {
          let iterId = meals.length;
          for (let i = 0; i < result.length; i++) {
            meals.push({ id: String(iterId + 2), title: result[i].name });

            carbFood.push({
              meal: result[i].name,
              carbs: String((Number(result[i].carbs) / Number(result[i].serving)).toFixed()),
              unit: result[i].unit
            });

            iterId += 1;
          }

        })

        setFilterList(meals);
        setMealsList(carbFood);

      });
      return filterList;
    }

    const refreshData = navigation.addListener('focus', () => {
      setDropDownListData();
      setShowInsulinEditor(false);
    })
    return refreshData;
  }, [navigation]);


  // Show the date picker when the user clicks on the date
  const showDatePicker = () => {
    setShow(true);
  }

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
          middleContent="Insulin"
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
      

      {!showInsulinEditor &&
          <ScrollView>

            <TouchableOpacity onPress={() => { meal = ("Breakfast"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Breakfast"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { meal = ("Lunch"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Lunch"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { meal = ("PMSnack"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Afternoon Snack"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { meal = ("Dinner"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Dinner"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { meal = ("NightSnack"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Night Snack"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>


          </ScrollView>
      }

      {showInsulinEditor &&
        <ScrollView>
          <View style={{ paddingVertical: 10 }}>
            <Button style={{marginHorizontal: 20}} status="primary" text={date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()} onPress={showDatePicker} />
          </View>

          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={false}
              display="default"
              onChange={(e, selectedDate) => {
                // Update the date
                setDate(selectedDate || date);
                setShow(false);
                fetchMeals();
              }}
            />
          )}

          <Button style={{marginHorizontal: 20}} text="All Meal Options" status="primary" onPress={() => { setShowInsulinEditor(false) }} />

          {fields.map((field, idx) => {

            // Get meal title 
            let mealTitle = "";

            if (field) {
              if (field.meal) {
                mealTitle = field.meal;
              }
            }

            return (
              <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    {showAlert && mainMeal == idx &&
                      <Text style={{marginBottom: 10}}>Your sugar level went ~{amount} when previously eating this meal.</Text>
                    }
                    <AutocompleteDropdown
                      textInputProps={{
                        "value": mealTitle,
                      }}
                      showClear={true}
                      clearOnFocus={false}
                      closeOnBlur={false}
                      closeOnSubmit={true}
                      dataSet={filterList}
                      onChangeText={e => handleChange(idx, "meal", e)}
                      onClear={() => handleRemove(idx)}
                      onSelectItem={(item) => {
                        if (item) {

                          let mealObj = undefined;
                          // If the ingredient is in the database
                          for (let i = 0; i < mealsList.length; i++) {
                            if (mealsList[i].meal === item.title) {
                              // Get the ingredient from the database
                              mealObj = mealsList[i]
                              let fieldset = fields
                              // Update the ingredient set
                              fieldset[idx]['serving'] = "1"
                              fieldset[idx]['carbs'] = mealObj.carbs
                              fieldset[idx]['unit'] = mealObj.unit
                              setFields(fieldset)
                              let servingSize = servingSizes;
                              servingSize[idx] = mealObj.carbs;
                              setServingSizes(servingSize)
                            }
                          }

                          if (!mealObj) {
                            return
                          }
                          // Make sure to update the database too
                          handleChange(idx, "meal", item);
                        }
                      }
                      }
                    />
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      placeholder="Servings"
                      onChangeText={e => {
                        if (servingSizes[idx]) {
                          let fieldset = fields
                          fieldset[idx]['carbs'] = String(Number(e) * servingSizes[idx])
                          setFields(fieldset)
                        }
                        handleChange(idx, "serving", e)
                      }}
                      value={field.serving}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      placeholder="Carbs"
                      onChangeText={e => handleChange(idx, "carbs", e)}
                      value={field.carbs}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      placeholder="Unit"
                      onChangeText={e => handleChange(idx, "unit", e)}
                      value={field.unit}
                    />
                  </View>

                  <View>
                    <HStack spacing={10} style={{marginBottom: 10}}>          
                    <CheckBox 
                    disabled={mainMealSelected && mainMeal != idx}
                    value={mainMeal == idx || field['mainMeal']}
                    onValueChange={(value) => {
                      // Update the check to reflect the toggle's current state
                      mainMealSelected = value
                      if (value) {
                        mainMeal = idx
                      }
                      else {
                        mainMeal = undefined
                      }
                      handleChange(idx, "mainMeal", value)

                    }}
                     />
                      <Text fontSize="lg">Main Meal</Text>
                    </HStack>
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
            );
          })}

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


          {settingsMissing &&
            <Text style={{marginHorizontal: 20, marginVertical: 10}}>
              Please make sure your values are updated under the settings tab.
            </Text>
          }

          <Section style={{ marginBottom: 20, marginHorizontal: 20 }}>
            <SectionContent>
              <View>
              <Text fontSize="lg" style={{ textAlign: 'center' }}>
                Glucose Value: {sugarValue}
              </Text>
              </View>
              <View>
              <Text fontSize="lg" style={{ textAlign: 'center' }}>
                Total Carbs: {totalCarb}
              </Text>
              </View>
              <View>
              <Text fontSize="lg" style={{ textAlign: 'center' }} color={foodUnits == "Not Available" ? "#ff0000" : "#000000"}>
                Food Units: {foodUnits}
              </Text>
              </View>
              <View>
              <Text fontSize="lg" style={{ textAlign: 'center' }} color={correction == "Not Available" ? "#ff0000" : "#000000"}>
                Correction Units: {correction}
              </Text>
              </View>
              <View>
              <Text fontSize="lg" style={{ textAlign: 'center' }} color={totalUnits == "Not Available" ? "#ff0000" : "#000000"}>
                Total Units: {totalUnits}
              </Text>
            </View>
            </SectionContent>
          </Section>
          </ScrollView>
        }

    </Layout>
    </KeyboardAvoidingView>

  );
}
