import * as React from "react"
import { Dimensions, StyleSheet, TextInput } from "react-native";
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Link,
  Button,
  HStack,
  Center,
  NativeBaseProvider,
  CircularProgress,
  Container,
  Spinner,
  View,
  Hidden,
  ScrollView,
  Typeahead,
  Input,
  Icon,
  Pressable
} from "native-base"
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker';

const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}

const styles = StyleSheet.create({
  input: {
      height: 40,
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
  },
  });

let recipeId = NaN;
let recipes = [{ name: "", meals: [] }];

get("recipes").then((result) => {
    if (result) {
    recipes = result;
    }
})

export default function App() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);
  const [fields, setFields] = React.useState([{ }]);

  const [servingSizes, setServingSizes] = React.useState({});

  const [showMealEditor, setShowMealEditor] = React.useState(false);


  const fetchMeals = () => {
      if (recipeId > recipes.length-1) {
          recipes.push({
                name: "",
                meals: []
          })
      }

      if (recipes[recipeId]) {
      setFields(recipes[recipeId]['meals']);
      }

      setShowMealEditor(true)
      console.log("recipes", recipes);
    }

  function handleChange(i, type, value) {

    console.log("handleChange", i, type, value);
    if (value == null || value == undefined) { 
      return
    }
    
    if (value) {
    if (type === "meal") {
      value = value.title;
    }
    }

    const values = [...fields];
    values[i][type] = value;
    setFields(values);

    recipes[recipeId]['meals'] = values;
    setObj(`recipes`, recipes);
    calculateCarbs()
        
  }

  function handleAdd() {
    const values = [...fields];
    values.push({ meal: null, carbs: null, unit: null });
    setFields(values);

    recipes[recipeId]['meals'] = values;
    setObj(`recipes`, recipes);
    calculateCarbs()
  }

  function handleRemove(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    
    recipes[recipeId]['meals'] = values;
    setObj(`recipes`, recipes);
    calculateCarbs()
  }


  React.useMemo(() => {
    let meals = [];
    let carbFood = [];
    
    get("meals").then(function(result){
      for (let i=0; i<Object.keys(result).length; i++){
        meals.push({id: i+1, title: result[String(i)].meal});

        carbFood.push(result[String(i)]);
      }

      get("recipes").then((result) => {
        for (let i=meals.length; i<Object.keys(result).length+1; i++){
          meals.push({id: i+1, title: result[i-1].name});

          carbFood.push({
            meal: result[i-1].name,
            carbs: String((Number(result[i-1].carbs)/Number(result[i-1].serving)).toFixed()),
            unit: result[i-1].unit
          });
        }

        console.log("meals", meals);
        setFilterList(meals);
        setMealsList(carbFood);
      })

    calculateCarbs()

    });

  }, []);

  function calculateCarbs() {
      let totalcarbs = 0;
        for (let i=0; i<fields.length; i++) {
            console.log("fields", fields[i]);
            if (fields[i].carbs) {
                totalcarbs += fields[i].carbs;
            }
        }
        recipes[recipeId]['carbs'] = totalcarbs;
        setObj(`recipes`, recipes);
  }




  return (
    <ScrollView contentContainerStyle={{flexGrow:1}}>
     <View style={{padding: 40}}>
  <Center>
     <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">
     
     {!showMealEditor &&
        <VStack space={10} mt="5">

     {recipes.map((recipe, idx) => {
         console.log(idx)

            return (
              <HStack space={3}>
     <View>
     <Button w="100%" size="lg" colorScheme="indigo" onPress={() => {recipeId = idx; fetchMeals()}}>
        {recipe.name}
    </Button>
    </View>

    <Button size="sm" colorScheme="error" onPress={() => {recipes.splice(idx, 1); setObj('recipes', recipes); forceUpdate()}} variant="outline">
    Remove
          </Button>
    </HStack>
            )
     })}
     <Button size="lg" colorScheme="indigo" onPress={() => {recipeId = recipes.length; fetchMeals();}} variant="outline">
      <Icon
            color='primary.500'
            size="8"
            as={<Ionicons name="add-outline" />}
          />
          </Button>
     </VStack>
     }

     {showMealEditor &&
     <View>

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
        <View style={{paddingBottom: 20}}>
        <Button size="lg" colorScheme="indigo" onPress={() => {setShowMealEditor(false)}}>
                All Recipes
            </Button>
            </View>


    <VStack space={10} mt="5">
    {
        console.log(fields)
    }
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
          <HStack space="7">
          <View alignItems={'flex-start'}>
            <FormControl key={`${field}-${idx}`}>

            <FormControl.Label>Meal</FormControl.Label>

            <AutocompleteDropdown
              textInputProps={{
                "value": mealTitle,
              }}
              clearOnFocus={false}
              closeOnBlur={false}
              closeOnSubmit={true}
              dataSet={filterList}
              onChangeText={e => handleChange(idx, "meal", e)}
              onClear={() => handleChange(idx, "meal", "")}
              onSelectItem={(item) => {
                if (item) {
                let mealObj = mealsList[item.id-1];
                let fieldset = fields
                fieldset[idx]['serving'] = "1"
                fieldset[idx]['carbs'] = mealObj.carbs
                fieldset[idx]['unit'] = mealObj.unit
                setFields(fieldset)
                let servingSize = servingSizes;
                servingSize[idx] = mealObj.carbs;
                setServingSizes(servingSize)
                }
                handleChange(idx, "meal", item);
                }
              }
            />

            <FormControl.Label>Serving Amount (1, 0.75, 0.5, etc.)</FormControl.Label>
            <TextInput
              style={styles.input}
              onChangeText={e => {
                if (servingSizes[idx]) {
                  let fieldset = fields
                  fieldset[idx]['carbs'] = String(Number(e)*servingSizes[idx])
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

      <Button size="lg" colorScheme="indigo" onPress={handleAdd} variant="outline">
      <Icon
            color='primary.500'
            size="8"
            as={<Ionicons name="add-outline" />}
          />
          </Button>

      <View style={{paddingTop: 20, paddingBottom: 20}}>
      <Text fontSize="lg" style={{textAlign: 'center'}}>Total Carbs: {recipes[recipeId]['carbs']}</Text>
      <Text fontSize="lg" style={{textAlign: 'center'}}>Carbs Per Serving: {(Number(recipes[recipeId]['carbs'])/Number(recipes[recipeId]['serving'])).toFixed(2)}</Text>
      </View>
      </VStack>
      </View>
     }
      </Box>
  </Center>
  </View>
  </ScrollView>

  );
}