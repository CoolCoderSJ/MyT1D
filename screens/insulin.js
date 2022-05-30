// Import the libraries needed
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { ma } from 'moving-averages';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Alert } from "react-native";
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button,
  CheckBox, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme, Picker
} from "react-native-rapi-ui";
import { HStack } from 'react-native-stacks';
import { Dimensions } from 'react-native';
import axios from 'axios';


// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }


// Initialize all of the variables
let foodUnits = "";
let correction = "";
let totalUnits = "";
let unitsRounded = 0;
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
let lastSugarValue = "Not recorded";
let allMeals = [];
let mealFilter = [];
let mealDB = [];
let recipeDB = [];
let insulinPenSelected = null;
let penOptions = []
let date = new Date();

export default function App() {
  const navigation = useNavigation();

  // Initialize the state
  const { isDarkmode, setTheme } = useTheme();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [fields, setFields] = React.useState([{}]);

  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);

  const [servingSizes, setServingSizes] = React.useState({});
  const [show, setShow] = React.useState(false);

  const [showInsulinEditor, setShowInsulinEditor] = React.useState(false);
  const [showSearchScreen, setshowSearchScreen] = React.useState(false);


  const fetchMeals = (mealid = undefined) => {
    let idtofetch = null;
    // If a meal id to fetch is not specified, generate an id using the current set date and the current set meal
    if (mealid) {
      idtofetch = mealid
    }
    else {
      idtofetch = `meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`
    }

    // Fetch the ingredients from a database
    get(idtofetch).then((result) => {
      
      if (result) {
        // Set the state to the ingredients found
        setFields(result);
        forceUpdate()

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
                    let nextId = `${usedMealId.split(".")[0]}.${usedMealId.split(".")[1]}.${usedMealId.split(".")[2]}.${usedMealId.split(".")[3]}.${mealMap[usedMealId.split(".")[4]]}`;

                    let currentval = 0;


                    // Get the current sugar value for the meal
                    get(`${usedMealId}metadata`).then((metadata) => {
                      if (metadata) {
                        if (metadata.dexVal) {
                          currentval = metadata.dexVal;

                          // Get the next meal's sugar value
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
                                  amount = `${prediction} mg/dl higher`
                                }

                                else {
                                  amount = `${0 - 1 * prediction} mg/dl lower`
                                }

                                // Show the alert
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
        forceUpdate();
      }
      else {
        // Clear the state
        showAlert = false;
        mainMeal = undefined;
        mainMealSelected = false;
        totalCarb = 0;
        foodUnits = 0;
        totalUnits = correction
        setFields([{}])
      }
    })

    // Update the factors variable from the database
    get("factors").then((result) => {
      if (result) {
        factors = result;
      }
    });

    forceUpdate()
  }

  const calculateInsulin = (preDefinedSugarVal) => {
    // Get the ingredients
    get(`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`).then((values) => {

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

        if (preDefinedSugarVal) {
          sugarValue = preDefinedSugarVal;
          console.log('predefined', preDefinedSugarVal, sugarValue)
        }

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
        if (sugarValue > threshold) {
          // Calculate the correction factor and round to 2 places
          correction = String(((sugarValue - threshold) / specificISFFactor).toFixed(2));
        }
        else {
          correction = '0';
        }

        // Calculate the total insulin
        totalUnits = String((Number(foodUnits) + Number(correction)).toFixed(2));
        unitsRounded = String(Math.round(Number(totalUnits)));

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

        get(`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}metadata`).then((metadata) => {
          if (metadata) {
            if (metadata.dexVal) {
              lastSugarValue = metadata.dexVal;
              forceUpdate()
            }
          }
        });

        // Update the screen rendering
        forceUpdate()

      })
    });
  }

  // When the method to specifically save the metadata is called
  const updateInsulinDB = () => {

      // Calculate carbs
      totalCarb = 0;
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].carbs) {
          totalCarb += Number(fields[i].carbs);
        }
      };

      lastSugarValue = sugarValue;

      forceUpdate();

      // Set the metadata to the database 
      setObj(`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}metadata`, {
        dexVal: sugarValue,
        totalCarb: totalCarb,
      })
      get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/${`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}metadata`}`, {
        dexVal: sugarValue,
        totalCarb: totalCarb,
      })}});

  }

  // What happens when an ingredient is changed
  function handleChange(i, type, value) {

    // If there is no value to update, skip function
    if (value == null || value == undefined) {
      return
    }

    // Get the ingredients from the state
    const values = [...fields];

    // Update the value
    values[i][type] = value;

    // Update the state
    setFields(values);

    let id = `meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`

    // Update the meals database then calculate the insulin
    setObj(id, values).then(() => calculateInsulin());
    get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/${id}`, values)}});

    // Get all ingredients 
    get("meals").then(function (result) {

      let foods = result;

      let id = `meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`

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

              // Make a list where all sugar values for the meals will be stored
              let sugarValueList = [];

              // Loop through all meals in the used meals list attached to the food
              for (let j = 0; j < foods[a]['usedMeals'].length; j++) {
                let usedMealId = foods[a]['usedMeals'][j];

                // Get the sugar value for the meal
                let nextId = `${usedMealId.split(".")[0]}.${usedMealId.split(".")[1]}.${usedMealId.split(".")[2]}.${usedMealId.split(".")[3]}.${mealMap[usedMealId.split(".")[4]]}`;

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
                              amount = `${prediction} mg/dl higher`
                            }

                            else {
                              amount = `${0 - 1 * prediction} mg/dl lower`
                            }

                            showAlert = true;
                          }


                        })

                    }

                  }
                });

              }
            }

          }
        }
      }

      // Update the foods database
      setObj("meals", foods);
      get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/meals`, foods)}});

      // Update the state
      setFields(values);

      // Update the meals database then calculate the insulin
      setObj(id, values).then(() => calculateInsulin());
      get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/${id}`, values)}});

    })

    forceUpdate();

  }

  // When a new ingredient is added
  function handleAdd() {
    const values = [...fields];
    // Add a new blank set
    values.push({ meal: null, carbs: null, unit: null });

    // Update the state and database
    setFields(values);
    setObj(`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`, values);
    get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/${`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`}`, values)}});
  }

  // What happens when a delete button is clicked
  function handleRemove(i) {
    const values = [...fields];
    // Remove the selected ingredient
    values.splice(i, 1);
    // Update the state and database
    setFields(values);
    setObj(`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`, values).then(() => calculateInsulin())
    get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/${`meal.${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}.${meal}`}`, values)}});
  }

  // Update the dropdown data every time the user comes back to this screen from another
  React.useEffect(() => {
    const setDropDownListData = () => {

      // Set the date to the current date
      date = new Date();

      penOptions = []
      get('pens').then((result) => {
        for (let i=0; i<result.length; i++) {
          if (!result[i].discarded) {
          penOptions.push({label: result[i].type + " | " + result[i].location + " | " + (result[i].notes || "No note") + " - " + result[i].amount, value: i})
          }
        }
      })
      forceUpdate();

      // Set the ingredients to a variable, later used for search
      get("meals").then((result) => { mealDB = result });
      get("recipes").then((result) => { recipeDB = result });

      // Make a list of all of the ingredients ever used in any meal
      // Used later for searching
      getAll().then(function (result) {
        allMeals = [];

        // For each database key
        for (let i = 0; i < result.length; i++) {
          // If the key refers to a meal
          if (result[i].includes("meal") && !result[i].includes("metadata") && result != "meals") {
            get(result[i]).then(function (data) {
              if (data && !result[i].includes("meals") && (result[i].includes("Breakfast") || result[i].includes("Lunch") || result[i].includes("PMSnack") || result[i].includes("Dinner") || result[i].includes("NightSnack"))) {
                for (let a = 0; a < data.length; a++) {
                  // Add it to the list
                  let obj = {
                    meal: data[a].meal,
                    carbs: data[a].carbs,
                    mealid: result[i],
                  }
                  allMeals.push(obj);
                }
              }
            });
          }
        }
      });

      // Fetch ingredients and recipes to show in the dropdown
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

  // Create a style object for the main menu selections
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


        {!showInsulinEditor && !showSearchScreen &&
          <ScrollView>

            <TouchableOpacity onPress={() => { date = new Date(); meal = ("Breakfast"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Breakfast"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { date = new Date(); meal = ("Lunch"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Lunch"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { date = new Date(); meal = ("PMSnack"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Afternoon Snack"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { date = new Date(); meal = ("Dinner"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Dinner"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { date = new Date(); meal = ("NightSnack"); fetchMeals(); setShowInsulinEditor(true) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Night Snack"}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowInsulinEditor(false); 
            
            // Update the variables for the search screen

            // Make a list of all of the ingredients ever used in any meal
            // Used for searching
            getAll().then(function (result) {
              allMeals = [];

              // For each database key
              for (let i = 0; i < result.length; i++) {
                // If the key refers to a meal
                if (result[i].includes("meal") && !result[i].includes("metadata") && result != "meals") {
                  get(result[i]).then(function (data) {
                    if (data && !result[i].includes("meals") && (result[i].includes("Breakfast") || result[i].includes("Lunch") || result[i].includes("PMSnack") || result[i].includes("Dinner") || result[i].includes("NightSnack"))) {
                      for (let a = 0; a < data.length; a++) {
                        // Add it to the list
                        let obj = {
                          meal: data[a].meal,
                          carbs: data[a].carbs,
                          mealid: result[i],
                        }
                        allMeals.push(obj);
                      }
                    }
                  });
                }
              }
            }).then(() => {mealFilter = []}).then(() => { setshowSearchScreen(true);}) }}>
              <View style={styles.listItem}>
                <Text fontWeight="medium">{"Search All Meals"}</Text>
                <Ionicons
                  name="search-circle"
                  size={20}
                  color={isDarkmode ? themeColor.white : themeColor.black}
                />
              </View>
            </TouchableOpacity>


          </ScrollView>
        }

        {showInsulinEditor && !showSearchScreen &&
          <ScrollView>
              <View style={{ marginHorizontal: 20, marginVertical: 20 }}>
              <Button style={{ marginHorizontal: 20 }} text={(date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear()} status="primary" onPress={() => { if (show == true) {setShow(false)} else {setShow(true)} }} />

              {show && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        is24Hour={true}
                        onChange={(evt, selectedDate) => {
                          // Update the date
                          date = selectedDate || date
                          setShow(false);
                          fetchMeals();
                          forceUpdate();
                        }}
                      />
                    )}
              </View>

            <Button style={{ marginHorizontal: 20 }} text="All Meal Options" status="primary" onPress={() => { setShowInsulinEditor(false) }} />

            <Text size="h3" style={{ marginHorizontal: 20, textAlign: "center", marginVertical: 20 }}>{meal}</Text>

            {fields.map((field, idx) => {



              if (field['mainMeal'] == true) {
                mainMealSelected = true;
                mainMeal = idx;
              }


              return (
                <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                  <SectionContent>
                    <React.Fragment>
                      {showAlert && mainMeal == idx &&
                        <Text style={{ marginBottom: 10 }}>On average after this meal, your sugar went ~{amount} than anticipated.</Text>
                      }

                      <AutocompleteDropdown
                        suggestionsListMaxHeight={Dimensions.get("window").height * 0.15}
                        textInputProps={{
                          onChangeText: e => {
                            handleChange(idx, "meal", e);
                            // Fetch ingredients and recipes to show in the dropdown
                            let meals = [];

                            if (mealDB) {
                            for (let i = 0; i < Object.keys(mealDB).length; i++) {
                              if (mealDB[String(i)].meal.includes(e)) {
                                meals.push({ id: String(i + 2), title: mealDB[String(i)].meal });
                              }
                            }
                          }

                            let iterId = meals.length;
                            if (recipeDB) {
                            for (let i = 0; i < recipeDB.length; i++) {
                              if (recipeDB[i].name.includes(e)) {
                                meals.push({ id: String(iterId + 2), title: recipeDB[i].name });
                                iterId += 1;
                              }
                            }
                            }
  
                            setFilterList(meals);
                            forceUpdate()
                          },
                          value: field.meal,
                          placeholder: "Food Name",
                          style: {
                            color: isDarkmode ? themeColor.white : themeColor.dark,
                            backgroundColor: isDarkmode ? "#262834" : themeColor.white,
                            borderColor: isDarkmode ? "#60647e" : "#d8d8d8",
                            borderWidth: 1,
                            borderRadius: 8,
                            flexDirection: "row",
                            paddingHorizontal: 20,
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontFamily: "Ubuntu_400Regular",
                          }
                        }}

                        rightButtonsContainerStyle={{
                          backgroundColor: isDarkmode ? "#262834" : themeColor.white,
                          borderColor: isDarkmode ? "#60647e" : "#d8d8d8",
                          borderWidth: 1,
                          borderRadius: 8,
                        }}
                        suggestionsListContainerStyle={{
                          backgroundColor: isDarkmode ? "#262834" : themeColor.white,
                          elevation: 10
                        }}
                        containerStyle={{ flexGrow: 1, flexShrink: 1, }}
                        renderItem={(item, text) => (
                          <Text style={{ color: isDarkmode ? themeColor.white : themeColor.dark, padding: 15, zIndex: 5 }}>{item.title}</Text>
                        )}
                        showClear={true}
                        clearOnFocus={false}
                        closeOnBlur={false}
                        closeOnSubmit={true}
                        dataSet={filterList}
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

                                if (mealObj.carbs != Infinity) {
                                fieldset[idx]['carbs'] = mealObj.carbs
                                }
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
                            handleChange(idx, "meal", item.title);
                            
                            let meals = [];
                      
                            get("meals").then(function (result) {
                              for (let i = 0; i < Object.keys(result).length; i++) {
                                meals.push({ id: String(i + 2), title: result[String(i)].meal });
                              }
                      
                              get("recipes").then((result) => {
                                let iterId = meals.length;
                                for (let i = 0; i < result.length; i++) {
                                  meals.push({ id: String(iterId + 2), title: result[i].name });
                                  iterId += 1;
                                }
                      
                              })
                      
                              setFilterList(meals);
                          })
                          
                        }
                        }}
                      />
                    </React.Fragment>

                    <View style={{ marginVertical: 20 }}>
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
                        defaultValue={field.serving}
                        keyboardType="numeric"
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
                        placeholder="Unit"
                        onChangeText={e => handleChange(idx, "unit", e)}
                        defaultValue={field.unit}
                      />
                    </View>

                    <View>
                      <HStack spacing={10} style={{ marginBottom: 10 }}>
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
              text="Add New Food"
              status="primary"
              type="TouchableOpacity"
              onPress={handleAdd}
            />


            {settingsMissing &&
              <Text style={{ marginHorizontal: 20, marginVertical: 10 }}>
                Please make sure your values are updated under the settings tab.
              </Text>
            }

            <Section style={{ marginBottom: 20, marginHorizontal: 20 }}>
              <SectionContent>
                <View style={{marginBottom: 10}}>

                  <Text fontSize="lg" style={{ textAlign: 'left', marginBottom: 5 }}>
                    Current Glucose Value:
                  </Text>
                  <TextInput
                    placeholder="Current Glucose Value"
                    keyboardType="numeric"
                    onChangeText={e => {console.log("e", e); sugarValue = e; calculateInsulin(e)}}
                    defaultValue={String(sugarValue)}
                  />
                </View>
                <View style={{marginBottom: 15}}>
                  <Text fontSize="lg" style={{ textAlign: 'left' }}>
                    Last Recorded Glucose Value: {lastSugarValue}
                  </Text>
                </View>
                <View style={{marginBottom: 15}}>
                  <Text fontSize="lg" style={{ textAlign: 'left' }}>
                    Total Carbs: {totalCarb}
                  </Text>
                </View>
                <View style={{marginBottom: 5}}>
                  <Text fontSize="lg" style={{ textAlign: 'left' }} color={foodUnits == "Not Available" ? "#ff0000" : "#000000"}>
                    Food Units: {foodUnits}
                  </Text>
                </View>
                <View style={{marginBottom: 5}}>
                  <Text fontSize="lg" style={{ textAlign: 'left' }} color={correction == "Not Available" ? "#ff0000" : "#000000"}>
                    Correction Units: {correction}
                  </Text>
                </View>
                <View style={{marginBottom: 5}}>
                  <Text fontSize="lg" style={{ textAlign: 'left' }} color={totalUnits == "Not Available" ? "#ff0000" : "#000000"}>
                    Total Units: {totalUnits}
                  </Text>
                </View>
                <View style={{ marginVertical: 10 }}>
                  <Button style={{ marginHorizontal: 20, marginVertical: 10 }} text="Update Metadata in the Database" status="primary" onPress={() => { updateInsulinDB(); }} />
                </View>
              </SectionContent>
            </Section>

            <Section style={{ marginBottom: 20, marginHorizontal: 20 }}>
            <SectionContent>
              <View style={{marginBottom: 20}}>
                <Text fontSize="lg" style={{ textAlign: 'center' }}>Take Insulin</Text>
              </View>
              <View style={{marginBottom: 20}}>
              <Picker
                  items={penOptions}
                  value={insulinPenSelected}
                  placeholder="Pick Insulin Pen"
                  onValueChange={(val) => insulinPenSelected = val}
              />
              </View>
              <View style={{marginBottom: 20}}>
                <TextInput
                  placeholder="Amount of insulin to take"
                  onChangeText={e => {
                    unitsRounded = e;
                  }}
                  defaultValue={unitsRounded}
                  keyboardType="numeric"
                  />
              </View>
              <View style={{marginBottom: 20}}>
                <Button
                leftContent={
                  <Ionicons name="medical" size={20} color={themeColor.white} />
                }
                text="Take Insulin"
                status="primary"
                type="TouchableOpacity"
                onPress={() => { 
                  get("pens").then(result => {
                    let penData = result
                    let insulinPen = penData[insulinPenSelected];
                    let history = insulinPen.history;
                    history.push({
                      date: date.toLocaleDateString() + " " + date.toLocaleTimeString(),
                      units: unitsRounded,
                      note: "Taken at " + meal
                    })

                    insulinPen.history = history;
                    insulinPen.amount = String(insulinPen.amount - Number(unitsRounded) - Number(penData[insulinPenSelected].autoDiscard));
                    penData[insulinPenSelected] = insulinPen;
                    setObj("pens", penData);
                    get("login").then(res => {if (res) {loginInfo = res; axios.post(`https://database.myt1d.repl.co/${loginInfo.username}/${loginInfo.password}/pens`, penData)}});
                    Alert.alert(
                      "Success", 
                      "Insulin taken successfully!",
                      [
                        { 
                          text: "OK"
                        }
                      ]
                      );
                  })
                 }}
                />
              </View>
            </SectionContent>
            </Section>
          </ScrollView>
        }

        {showSearchScreen && !showInsulinEditor &&
          <ScrollView>
            <Button style={{ marginHorizontal: 20, marginVertical: 10 }} text="All Options" status="primary" onPress={() => { setShowInsulinEditor(false); setshowSearchScreen(false); }} />

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
                  if (e == "") {
                    mealFilter = []
                    forceUpdate();
                    return
                  }
                  mealFilter = [];

                  // Loop through all of the ingredients and add the ones that match the search term to a filter list
                  for (let i = 0; i < allMeals.length; i++) {
                    if (allMeals[i].meal.toLowerCase().includes(e.toLowerCase())) {

                      let date = new Date(allMeals[i].mealid.split(".")[3], Number(allMeals[i].mealid.split(".")[1]) - 1, allMeals[i].mealid.split(".")[2])
                      mealFilter.push({
                        title: allMeals[i].meal,
                        carb: allMeals[i].carbs,
                        mealid: allMeals[i].mealid,
                        date: date,
                        meal: allMeals[i].mealid.split(".")[4],
                      })
                    }
                  }
                  forceUpdate();
                }}
              />
            </View>


            {mealFilter.map((field, idx) => {
              return (
                <Section key={idx} style={{ marginBottom: 20, marginHorizontal: 20 }}>
                  <SectionContent>
                    <View style={{ marginBottom: 20 }}>
                      <Text size="h3">{field.title}</Text>
                    </View>
                    <View style={{ marginBottom: 20 }}>
                      <Text size="lg">Carbs: {field.carb}</Text>
                    </View>
                    <View style={{ marginBottom: 20 }}>
                      <Text size="md">{field.date.toLocaleDateString()} - {field.meal}</Text>
                    </View>
                    <View style={{ marginBottom: 20 }}>
                      <Button
                        style={{ marginTop: 10 }}
                        leftContent={
                          <Ionicons name="arrow-forward-circle" size={20} color={themeColor.white} />
                        }
                        text="Visit Meal"
                        status="primary"
                        type="TouchableOpacity"
                        onPress={() => { date = field.date; meal = field.mealid.split(".")[4]; fetchMeals(field.mealid); setShowInsulinEditor(true); setshowSearchScreen(false); }}
                      />
                    </View>
                  </SectionContent>
                </Section>
              );
            })}

          </ScrollView>
        }

      </Layout>
    </KeyboardAvoidingView>

  );
}
