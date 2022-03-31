// Import the libraries needed
import * as React from "react"
import { StyleSheet, TextInput, KeyboardAvoidingView } from "react-native";
import {
  Box,
  Text,
  VStack,
  FormControl,
  Button,
  HStack,
  Center,
  View,
  ScrollView,
  Icon,
} from "native-base";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'
import { useNavigation } from '@react-navigation/native';

// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

// Create a style object for inputs
const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
});

// Initialize the variables
let recipeId = NaN;
let recipes = [];

// Update the recipes variable from the database
get("recipes").then((result) => {
  if (result) {
    recipes = result;
  }
})


export default function App() {
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
  }

  // What to do when anything changes
  function handleChange(i, type, value) {

    // Skip the function if the value is empty
    if (value == null || value == undefined) {
      return
    }

    // Clean the noise from the data
    if (value) {
      if (type === "meal") {
        value = value.title;
      }
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
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].carbs) {
        totalcarbs += Number(fields[i].carbs);
      }
    }
    // Set the metadata in the database
    recipes[recipeId]['carbs'] = totalcarbs;
    setObj(`recipes`, recipes);
  }




  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: 40 }}>
        <Center>
          <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">

            {!showMealEditor &&
              <VStack space={10} mt="5">

                {recipes.map((recipe, idx) => {
                  return (
                    <HStack space={3}>
                      <View>
                        <Button w="100%" size="lg" colorScheme="indigo" onPress={() => { recipeId = idx; fetchMeals() }}>
                          {recipe.name}
                        </Button>
                      </View>

                      <Button size="sm" colorScheme="error" onPress={() => { recipes.splice(idx, 1); setObj('recipes', recipes); forceUpdate() }} variant="outline">
                        Remove
                      </Button>
                    </HStack>
                  )
                })}
                <Button leftIcon={<Icon
                  color='white'
                  size="8"
                  as={<Ionicons name="add-outline" />}
                />}

                  onPress={() => { recipeId = recipes.length; fetchMeals(); }}
                >Add Recipe</Button>
              </VStack>
            }

            {showMealEditor &&
              <View>

                <View style={{ paddingBottom: 20 }}>
                  <Button size="lg" colorScheme="indigo" onPress={() => {
                    for (let i = 0; i < recipes.length; i++) {
                      if (recipes[i]['name'] == "") {
                        recipes.splice(i, 1);
                      }
                    }

                    setShowMealEditor(false)
                  }}>
                    All Recipes
                  </Button>
                </View>

                <View style={{ paddingBottom: 20 }}>
                  <TextInput
                    style={styles.input}
                    onChangeText={(value) => {
                      recipes[recipeId]['name'] = value;
                      setObj(`recipes`, recipes);
                    }}
                    defaultValue={recipes[recipeId]['name']}
                    placeholder="Recipe Name"
                  />

                  <TextInput
                    style={styles.input}
                    onChangeText={(value) => {
                      recipes[recipeId]['serving'] = value;
                      setObj(`recipes`, recipes);
                      calculateCarbs()
                    }}
                    defaultValue={recipes[recipeId]['serving']}
                    placeholder="Servings"
                  />

                  <TextInput
                    style={styles.input}
                    onChangeText={(value) => {
                      recipes[recipeId]['unit'] = value;
                      setObj(`recipes`, recipes);
                    }}
                    defaultValue={recipes[recipeId]['unit']}
                    placeholder="Units (Plate, Bowl, Bag, etc.)"
                  />

                </View>

                <VStack space={10} mt="5">
                  {fields.map((field, idx) => {

                    const styles = StyleSheet.create({
                      input: {
                        height: 40,
                        borderWidth: 1,
                        padding: 10,
                        borderRadius: 5,
                        marginBottom: 5,
                      },
                    });

                    let mealTitle = "";


                    if (field) {
                      if (field.meal) {
                        mealTitle = field.meal;
                      }
                    }

                    return (
                      <View alignItems={'flex-start'}>
                        <FormControl key={`${field}-${idx}`}>

                          <FormControl.Label>Ingredient</FormControl.Label>

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

                                for (let i = 0; i < mealsList.length; i++) {
                                  if (mealsList[i].meal === item.title) {
                                    mealObj = mealsList[i]
                                    let fieldset = fields
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

                                handleChange(idx, "meal", item);
                              }
                            }}
                          />

                          <FormControl.Label>Serving Amount (1, 0.75, 0.5, etc.)</FormControl.Label>
                          <TextInput
                            style={styles.input}
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

                          <FormControl.Label>Carbs</FormControl.Label>
                          <TextInput
                            style={styles.input}
                            onChangeText={e => handleChange(idx, "carbs", e)}
                            value={field.carbs}
                            keyboardType="numeric"
                          />

                          <FormControl.Label>Unit (e.g. cup, oz, etc.)</FormControl.Label>
                          <TextInput
                            style={styles.input}
                            onChangeText={e => handleChange(idx, "unit", e)}
                            value={field.unit}
                          />
                        </FormControl>
                      </View>
                    );
                  })}

                  <Button leftIcon={<Icon
                    color='white'
                    size="8"
                    as={<Ionicons name="add-outline" />}
                  />}

                    onPress={handleAdd}
                  >Add Ingredient</Button>

                  <View style={{ paddingTop: 20, paddingBottom: 20 }}>
                    <Text fontSize="lg" style={{ textAlign: 'center' }}>Total Carbs: {recipes[recipeId]['carbs']}</Text>
                    <Text fontSize="lg" style={{ textAlign: 'center' }}>Carbs Per Serving: {(Number(recipes[recipeId]['carbs']) / Number(recipes[recipeId]['serving'])).toFixed(2)}</Text>
                  </View>
                </VStack>
              </View>
            }
          </Box>
        </Center>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>

  );
}
