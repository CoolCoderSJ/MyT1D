// Import the libraries needed
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";


// Initialize the database functions
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

// Initialize the variables
let recipeId = NaN;
let recipes = [];
let filterAllowed = []
let mealDB = []
let recipeDB = []

// Update the recipes variable from the database
get("recipes").then((result) => {
  if (result) {
    recipes = result;
    for (let i = 0; i < recipes.length; i++) {
      filterAllowed.push(i);
    };
  }
})


export default function App() {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);
  const [fields, setFields] = React.useState([{}]);

  const [servingSizes, setServingSizes] = React.useState({});

  const [showMealEditor, setShowMealEditor] = React.useState(false);


  const fetchMeals = () => {
    // If the recipeId is not in the list of recipes (new recipe)
    if (recipeId > recipes.length - 1) {
      // Add an empty recipe
      recipes.push({
        name: "",
        meals: []
      })
    }


    // If the recipe was found, set the state
    if (recipes[recipeId]) {
      setFields(recipes[recipeId]['meals']);
    }

    // Show the recipe editor
    setShowMealEditor(true)

    let totalcarbs = 0;
    for (let i = 0; i < recipes[recipeId].meals.length; i++) {
      if (recipes[recipeId].meals[i].carbs) {
        totalcarbs += Number(recipes[recipeId].meals[i].carbs);
      }
    }

    // Set the metadata in the database
    recipes[recipeId]['carbs'] = totalcarbs;
    forceUpdate()

  }

  // Create a style object for inputs
  const styles = StyleSheet.create({
    input: {
      height: 40,
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
    },
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


  // What to do when anything changes
  function handleChange(i, type, value) {

    // Skip the function if the value is empty
    if (value == null || value == undefined) {
      return
    }


    // Update the state
    const values = [...fields];
    values[i][type] = value;
    setFields(values);

    // Update the database
    recipes[recipeId]['meals'] = values;

    if (value) {
      setObj(`recipes`, recipes);
    }

    // Calculate the carbs
    calculateCarbs()

  }

  // What to do when a new ingredient is added
  function handleAdd() {
    const values = [...fields];
    // Add a new empty set to the state
    values.push({ meal: null, carbs: null, unit: null });
    setFields(values);

    recipes[recipeId]['meals'] = values;

    filterAllowed.push(values.length - 1);

    calculateCarbs()
  }

  // What to do when the remove button is clicked
  function handleRemove(i) {
    const values = [...fields];
    // Remove the item from the state
    values.splice(i, 1);
    setFields(values);
    // Remove the item from the database
    recipes[recipeId]['meals'] = values;
    setObj(`recipes`, recipes);
    // Calculate the carbs
    calculateCarbs()
  }

  // What to do when a user comes back to the screen
  React.useEffect(() => {
    const setDropDownList = () => {
      let meals = [];
      let carbFood = [];

      // Update the recipes variable from the database
      get("recipes").then((result) => {
        if (result) {
          recipes = result;
          for (let i = 0; i < recipes.length; i++) {
            filterAllowed.push(i);
          };
        }
      })

      get("meals").then((result) => { mealDB = result });
      get("recipes").then((result) => { recipeDB = result });

      // Update the drop down list
      get("meals").then(function (result) {
        for (let i = 0; i < Object.keys(result).length; i++) {
          meals.push({ id: i + 1, title: result[String(i)].meal });

          carbFood.push(result[String(i)]);
        }

        get("recipes").then((result) => {
          for (let i = meals.length; i < Object.keys(result).length + 1; i++) {
            meals.push({ id: i + 1, title: result[i - 1].name });

            carbFood.push({
              meal: result[i - 1].name,
              carbs: String((Number(result[i - 1].carbs) / Number(result[i - 1].serving)).toFixed()),
              unit: result[i - 1].unit
            });
          }

          setFilterList(meals);

          setMealsList(carbFood);
          // Force update the list
          forceUpdate();
        })

        // Calculate carbs
        calculateCarbs()

      });

    };

    const refreshData = navigation.addListener('focus', () => {
      setDropDownList();
      setShowMealEditor(false);
    })
    return refreshData;
  }, [navigation]);

  // Calculate the carbs
  function calculateCarbs() {
    let totalcarbs = 0;
    for (let i = 0; i < recipes[recipeId].meals.length; i++) {
      if (recipes[recipeId].meals[i].carbs) {
        totalcarbs += Number(recipes[recipeId].meals[i].carbs);
      }
    }

    // Set the metadata in the database
    recipes[recipeId]['carbs'] = totalcarbs;
    forceUpdate()
    setObj(`recipes`, recipes);
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
          middleContent="Recipes"
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
          {!showMealEditor &&
            <View>
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
                    let values = recipes;
                    let allowed = []
                    for (let i = 0; i < values.length; i++) {
                      if (values[i].name.toLowerCase().includes(e.toLowerCase())) {
                        allowed.push(i);
                      }
                    }
                    filterAllowed = allowed;
                    forceUpdate();
                  }}
                />
              </View>

              {recipes.map((recipe, idx) => {
                return (
                  <View>
                    {filterAllowed.includes(idx) &&
                      <View>
                        <TouchableOpacity onPress={() => { recipeId = idx; fetchMeals() }}>
                          <View style={styles.listItem}>
                            <Text fontWeight="medium">{recipe.name}</Text>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={isDarkmode ? themeColor.white : themeColor.black}
                            />
                          </View>
                        </TouchableOpacity>
                        <Button
                          style={{ marginTop: 10, marginHorizontal: 20, marginBottom: 20 }}
                          leftContent={
                            <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                          }
                          text="Remove this recipe"
                          status="danger"
                          type="TouchableOpacity"
                          onPress={() => { recipes.splice(idx, 1); setObj('recipes', recipes); forceUpdate() }}
                        />
                      </View>
                    }
                  </View>
                )
              }
              )}
              <Button
                style={{ marginVertical: 10, marginHorizontal: 20 }}
                leftContent={
                  <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
                }
                text="Add New Recipe"
                status="primary"
                type="TouchableOpacity"
                onPress={() => {
                  recipeId = recipes.length;
                  fetchMeals();
                  get("recipes").then((result) => {
                  });
                }}
              />
            </View>
          }


          {showMealEditor &&
            <View>

              <View style={{ paddingBottom: 20 }}>
                <Button style={{ marginHorizontal: 20, marginVertical: 10 }} status="primary" text="All Recipes" onPress={() => {
                  for (let i = 0; i < recipes.length; i++) {
                    if (recipes[i]['name'] == "") {
                      recipes.splice(i, 1);
                    }
                  }

                  setShowMealEditor(false)
                }} />
              </View>

              <Section style={{ paddingBottom: 20, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      onChangeText={(value) => {
                        recipes[recipeId]['name'] = value;
                        setObj(`recipes`, recipes);
                      }}
                      defaultValue={recipes[recipeId]['name']}
                      placeholder="Recipe Name"
                    />
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      onChangeText={(value) => {
                        recipes[recipeId]['serving'] = value;
                        setObj(`recipes`, recipes);
                        calculateCarbs()
                      }}
                      defaultValue={recipes[recipeId]['serving']}
                      placeholder="Servings"
                    />
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      onChangeText={(value) => {
                        recipes[recipeId]['unit'] = value;
                        setObj(`recipes`, recipes);
                      }}
                      defaultValue={recipes[recipeId]['unit']}
                      placeholder="Units (Plate, Bowl, Bag, etc.)"
                    />

                  </View>
                </SectionContent>
              </Section>

              {fields.map((field, idx) => {
                return (
                  <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                    <SectionContent>
                      <React.Fragment style={{ marginBottom: 20 }}>
                        <AutocompleteDropdown
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
                            placeholder: "Ingredient Name",
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
                            color: isDarkmode ? themeColor.white : themeColor.dark,
                          }}
                          renderItem={(item, text) => (
                            <Text style={{ color: isDarkmode ? themeColor.white : themeColor.dark, padding: 15 }}>{item.title}</Text>
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

                              // loop through all of the meals from the database
                              for (let i = 0; i < mealsList.length; i++) {
                                if (mealsList[i].meal === item.title) {
                                  mealObj = mealsList[i]
                                  let fieldset = fields

                                  // set the meal object to the field in the state
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

                              handleChange(idx, "meal", item.title);


                              let meals = [];

                              // reset the dropdown list to show all of the meals
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
                          placeholder="Serving Size"
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

                      <View style={{ marginBottom: 20 }}>
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

              <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ paddingTop: 20, paddingBottom: 20 }}>
                    <Text fontSize="lg" style={{ textAlign: 'center' }}>Total Carbs: {recipes[recipeId]['carbs']}</Text>
                    <Text fontSize="lg" style={{ textAlign: 'center' }}>Carbs Per Serving: {(Number(recipes[recipeId]['carbs']) / Number(recipes[recipeId]['serving'])).toFixed(2)}</Text>
                  </View>
                </SectionContent>
              </Section>
            </View>
          }

        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>

  );
}
