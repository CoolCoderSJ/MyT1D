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
  Typeahead
} from "native-base"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker';

const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}

let foodUnits = "";
let correction = "";
let totalUnits = "";
let totalUnitsRounded = "";
let meal = "";
let factors = {};
let readings = [];

const styles = StyleSheet.create({
  input: {
      height: 40,
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
  },
  });

export default function App() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [fields, setFields] = React.useState([{ }]);

  const [filterText, setFilterText] = React.useState('');
  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);

  const [servingSizes, setServingSizes] = React.useState({});
  const [date, setDate] = React.useState(new Date());
  const [show, setShow] = React.useState(false);

  const [showInsulinEditor, setShowInsulinEditor] = React.useState(false);


  const fetchMeals = () => {
    console.log(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`)
    get(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`).then((result) => {
      if (result) {
      setFields(result);
      calculateInsulin();
      }
    })

    get("factors").then((result) => {
      if (result) {
        factors = result;
      }
    });

  
}

  const calculateInsulin = () => {
    get(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`).then((values) => {

    console.log("values", values)
    console.log("meal", meal)

    let specificItoCFactor = null;
    let specificISFFactor = null;
    let generalIToCFactor = factors.itoc;
    let generalISFFactor = factors.isf;

    console.log("generalISFFactor", generalISFFactor);

    
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

    if (!specificItoCFactor) {specificItoCFactor = generalIToCFactor};
    if (!specificISFFactor) {specificISFFactor = generalISFFactor};

    let totalCarb = 0;

    for (let i=0; i<values.length; i++) {
      if (values[i].carbs) {
        totalCarb += Number(values[i].carbs);
      }
    };

    get("readings").then((result) => {
      readings = result;
    

    let dexVal = readings[0].value;
    let threshold = null;

    switch (meal) {
      case "Breakfast": threshold = 100; break;
      case "Lunch": threshold = 100; break;
      case "PMSnack": threshold = 100; break;
      case "Dinner": threshold = 100; break;
      case "NightSnack": threshold = 120; break;
    }

    foodUnits = String((totalCarb/specificItoCFactor).toFixed(2));
    if (dexVal > threshold) {
    correction = String(((dexVal-threshold)/specificISFFactor).toFixed(2));
    }
    else {
      correction = '0';
    }

    console.log("meal", meal);

    console.log("dexVal", dexVal);
    console.log("threshold", threshold);
    console.log("total carb: ", totalCarb);
    console.log("specificItoCFactor: ", specificItoCFactor);
    console.log("specificISFFactor: ", specificISFFactor);

    console.log("foodUnits: ", foodUnits);
    console.log("correction: ", correction);

    console.log("added", (Number(foodUnits) + Number(correction)))

    totalUnits = String((Number(foodUnits) + Number(correction)).toFixed(2));

    get(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}metadata`).then((insulinManual) => {
      if (insulinManual) {
        console.log(insulinManual)
        totalUnitsRounded = insulinManual.insulin;
      }
      else {
        totalUnitsRounded = String(Math.round(Number(totalUnits)));i
      }
    }).then(() => {

    console.log("totalUnits: ", totalUnits);
    console.log("totalUnitsRounded: ", totalUnitsRounded);

    setObj(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}metadata`, {
      dexVal: dexVal,
      totalCarb: totalCarb,
      insulin: totalUnitsRounded
    })

    forceUpdate()

  });
  });
});
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

    setObj(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`, values).then(() => calculateInsulin());
        
  }

  function handleAdd() {
    const values = [...fields];
    values.push({ meal: null, carbs: null, unit: null });
    setFields(values);
    setObj(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`, values);
  }

  function handleRemove(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    setObj(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`, values).then(() => calculateInsulin())
  }


  React.useMemo(() => {
    let meals = [];
    
    get("meals").then(function(result){
      for (let i=0; i<Object.keys(result).length; i++){

        meals.push({id: i+1, title: result[String(i)].meal});
      }


    setFilterList(meals);
    setMealsList(result);

    });
    
    return filterList;
  }, [filterText]);



  const showDatePicker = () => {
    setShow(true);
  }

  return (
    <ScrollView contentContainerStyle={{flexGrow:1}}>
     <View style={{padding: 40}}>
  <Center>
     <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">
     
     {!showInsulinEditor &&
     <View>
     <View style={{paddingBottom: 10}}>
     <Button size="lg" colorScheme="indigo" onPress={() => {meal = ("Breakfast"); fetchMeals(); setShowInsulinEditor(true)}}>
        Breakfast
    </Button>
    </View>

    <View style={{paddingBottom: 10}}>
     <Button size="lg" colorScheme="indigo" onPress={() => {meal = ("Lunch"); fetchMeals(); setShowInsulinEditor(true)}}>
        Lunch
    </Button>
    </View>

    <View style={{paddingBottom: 10}}>
     <Button size="lg" colorScheme="indigo" onPress={() => {meal = ("PMSnack"); fetchMeals(); setShowInsulinEditor(true)}}>
        Afternoon Snack
    </Button>
    </View>

    <View style={{paddingBottom: 10}}>
     <Button size="lg" colorScheme="indigo" onPress={() => {meal = ("Dinner"); fetchMeals(); setShowInsulinEditor(true)}}>
        Dinner
    </Button>
    </View>

    <View style={{paddingBottom: 10}}>
     <Button size="lg" colorScheme="indigo" onPress={() => {meal = ("NightSnack"); fetchMeals(); setShowInsulinEditor(true)}}>
        Night Snack
    </Button>
    </View>
     
     </View>
     }

     {showInsulinEditor &&
     <View>
     <View style={{paddingBottom: 10}}>
     <Button size="lg" colorScheme="indigo" onPress={showDatePicker}>
        {date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear()}
    </Button>
    </View>
    
     {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          is24Hour={false}
          display="default"
          onChange={(e, selectedDate) => {
            setDate(selectedDate || date);
            setShow(false);
            get(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}`).then((result) => {
              if (result) {
              setFields(result);
              calculateInsulin()
              }
              else {
                setFields([{}])
              }
            })
          }}
        />
      )}

    <Button size="lg" colorScheme="indigo" onPress={handleAdd}>
        Add Food
    </Button>

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
            <FormControl key={`${field}-${idx}`}>

            <FormControl.Label>Meal</FormControl.Label>

            <AutocompleteDropdown
              textInputProps={{
                "value": mealTitle,
              }}
              clearOnFocus={false}
              closeOnBlur={true}
              closeOnSubmit={true}
              dataSet={filterList}
              onChangeText={e => handleChange(idx, "meal", e)}
              onClear={() => handleChange(idx, "meal", "")}
              onSelectItem={(item) => {
                if (item) {
                setFilterText(item.title);
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

            <Button size="lg" colorScheme="error" onPress={() => handleRemove(idx, field)}>
                Remove Food
            </Button>
          </FormControl>
        );
      })}

      <View style={{paddingTop: 20, paddingBottom: 20}}>
        <Text fontSize="lg" style={{textAlign: 'center'}}>
          Food Units: {foodUnits}
        </Text>
        <Text fontSize="lg" style={{textAlign: 'center'}}>
          Correction Units: {correction}
        </Text>
        <Text fontSize="lg" style={{textAlign: 'center'}}>
          Total Units: {totalUnits}
        </Text>
        <View style={{ flexDirection:'row' }}>
        <Text>I'm taking this many units of insulin today: </Text>
        <TextInput
              style={styles.input}
              placeholder={totalUnitsRounded}
              onChangeText={(e) => {
                get(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}metadata`).then((result) => {
                setObj(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}metadata`, {
                  ...result,
                  insulin: e
                })
                }).then(() => {

                get(`meal${date.getMonth()+1}${date.getDate()}${date.getFullYear()}${meal}metadata`).then((result) => {
                  console.log("INSULIN", result)
                });

                });
              }} 
            />
            </View>
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