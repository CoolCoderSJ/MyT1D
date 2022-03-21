import * as React from "react"
import { StyleSheet, TextInput } from "react-native";
import { Ionicons } from '@expo/vector-icons';
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
  Switch,
  Alert,
  Collapse,
} from "native-base";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker';
import { ma } from 'moving-averages';
import { useNavigation } from '@react-navigation/native';


const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

let foodUnits = "";
let correction = "";
let totalUnits = "";
let meal = "";
let factors = {};
let readings = [];
let sugarValue = 0;
let totalCarb = 0;

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
});

let mainMealSelected = false
let mainMeal = undefined

let showAlert = false;
let amount = "";

let settingsMissing = false;

export default function App() {
  const navigation = useNavigation();

  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [fields, setFields] = React.useState([{}]);

  const [filterText, setFilterText] = React.useState('');
  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);

  const [servingSizes, setServingSizes] = React.useState({});
  const [date, setDate] = React.useState(new Date());
  const [show, setShow] = React.useState(false);

  const [showInsulinEditor, setShowInsulinEditor] = React.useState(false);


  const fetchMeals = () => {
    // setFields([{}]);
    console.log(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`)
    get(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`).then((result) => {
      console.log("result", result)
      if (result) {
        console.log("Meal found in database, setting fields")

        setFields(result);

        for (let a = 0; a < result.length; a++) {
          get("meals").then((foods) => {
            if (foods) {
              for (let b = 0; b < foods.length; b++) {
                if (foods[b].meal == result[a].meal && result[a].mainMeal) {
                  let mealMap = {
                    "Breakfast": "Lunch",
                    "Lunch": "PMSnack",
                    "PMSnack": "Dinner",
                    "Dinner": "NightSnack",
                    "NightSnack": "Breakfast",
                  }

                  let sugarValueList = [];

                  for (let j = 0; j < foods[b]['usedMeals'].length; j++) {
                    let usedMealId = foods[b]['usedMeals'][j];
                    let usedMealName = usedMealId.split("meal")[1].replace(/[0-9]/g, '');
                    let restOfTheId = usedMealId.split(usedMealName)[0];

                    let nextId = `${restOfTheId}${mealMap[usedMealName]}`;

                    get(`${nextId}metadata`)
                      .then((result) => {
                        if (result) {
                          if (result.dexVal) {
                            sugarValueList.push(result.dexVal)
                          }
                        }
                      })
                      .then(() => {

                        if (sugarValueList && sugarValueList.length > 0) {
                          let averages = ma(sugarValueList, sugarValueList.length);
                          let prediction = averages[sugarValueList.length - 1];

                          if (prediction > 100) {
                            amount = `${prediction - 100} higher`
                          }

                          else {
                            amount = `${100 - prediction} lower`
                          }

                          showAlert = true;
                          mainMealSelected = true;
                        }
                      })
                  }
                }
              }
            }
          });

        }

        calculateInsulin();
      }
      else {
        showAlert = false;
        mainMeal = undefined;
        mainMealSelected = false;
        totalCarb = 0;
        console.log("Meal not found in database, setting fields to empty")
        setFields([{}])
      }
    })

    get("factors").then((result) => {
      if (result) {
        factors = result;
      }
    });


  }

  const calculateInsulin = () => {
    get(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`).then((values) => {

      let specificItoCFactor = null;
      let specificISFFactor = null;
      let generalIToCFactor = factors.itoc;
      let generalISFFactor = factors.isf;


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

      if (!specificItoCFactor) { specificItoCFactor = generalIToCFactor };
      if (!specificISFFactor) { specificISFFactor = generalISFFactor };

      if (!generalIToCFactor || !generalISFFactor) {
        settingsMissing = true;
      }

      totalCarb = 0;
      for (let i = 0; i < values.length; i++) {
        if (values[i].carbs) {
          totalCarb += Number(values[i].carbs);
        }
      };

      get("readings").then((result) => {
        readings = result;


        let dexVal = readings[0].value;

        sugarValue = dexVal;

        let threshold = null;

        switch (meal) {
          case "Breakfast": threshold = 100; break;
          case "Lunch": threshold = 100; break;
          case "PMSnack": threshold = 100; break;
          case "Dinner": threshold = 100; break;
          case "NightSnack": threshold = 120; break;
        }

        foodUnits = String((totalCarb / specificItoCFactor).toFixed(2));


        if (dexVal > threshold) {
          correction = String(((dexVal - threshold) / specificISFFactor).toFixed(2));
        }
        else {
          correction = '0';
        }


        totalUnits = String((Number(foodUnits) + Number(correction)).toFixed(2));

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

        setObj(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}metadata`, {
          dexVal: sugarValue,
          totalCarb: totalCarb,
        })

        forceUpdate()

      });
    });
  }


  function handleChange(i, type, value) {


    console.log("handleChange", i, type, value);
    if (value == null || value == undefined) {
      return
    }

    const values = [...fields];

    if (type === "meal") {
      value = value.title;
    }
    values[i][type] = value;



    get("meals").then(function (result) {

      let foods = result;

      let id = `meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`

      for (let a = 0; a < foods.length; a++) {
        if (values && foods[a]['meal'] == values[i]['meal']) {


          if (type === "mainMeal") {
            if (value && !foods[a]['usedMeals'].includes(id)) {
              foods[a]["usedMeals"].push(id)
            }
            else if (!value) {
              let index = foods[a]['usedMeals'].indexOf(id);
              if (index > -1) {
                foods[a]['usedMeals'].splice(index, 1);
                showAlert = false;
              }
            }

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

                get(`${nextId}metadata`)
                  .then((result) => {
                    if (result) {
                      if (result.dexVal) {
                        sugarValueList.push(result.dexVal)
                      }
                    }
                  })
                  .then(() => {
                    if (sugarValueList && sugarValueList.length > 0) {
                      let averages = ma(sugarValueList, sugarValueList.length);
                      let prediction = averages[sugarValueList.length - 1];

                      if (prediction > 100) {
                        amount = `${prediction - 100} higher`
                      }

                      else {
                        amount = `${100 - prediction} lower`
                      }

                      showAlert = true;
                    }


                  })

              }

            }
          }

        }
      }

      setObj("meals", foods);
      setFields(values);

      setObj(id, values).then(() => calculateInsulin());

    });


  }

  function handleAdd() {
    const values = [...fields];
    values.push({ meal: null, carbs: null, unit: null });
    setFields(values);
    setObj(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`, values);
  }

  function handleRemove(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    setObj(`meal${date.getMonth() + 1}${date.getDate()}${date.getFullYear()}${meal}`, values).then(() => calculateInsulin())
  }


  React.useEffect(() => {
    const setDropDownListData = () => {
      let meals = [];
      let carbFood = [];

      get("meals").then(function (result) {
        console.log("meals RESULT --> ", result);
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
      // console.log("filter list --> ", filterList);
      return filterList;
    }

    const refreshData = navigation.addListener('focus', () => {
      setDropDownListData();
      setShowInsulinEditor(false);
    })
    return refreshData;
  }, [navigation]);



  const showDatePicker = () => {
    setShow(true);
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ padding: 40 }}>
        <Center>
          <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">

            {!showInsulinEditor &&
              <View>
                <View style={{ paddingBottom: 10 }}>
                  <Button size="lg" colorScheme="indigo" onPress={() => { meal = ("Breakfast"); fetchMeals(); setShowInsulinEditor(true) }}>
                    Breakfast
                  </Button>
                </View>

                <View style={{ paddingBottom: 10 }}>
                  <Button size="lg" colorScheme="indigo" onPress={() => { meal = ("Lunch"); fetchMeals(); setShowInsulinEditor(true) }}>
                    Lunch
                  </Button>
                </View>

                <View style={{ paddingBottom: 10 }}>
                  <Button size="lg" colorScheme="indigo" onPress={() => { meal = ("PMSnack"); fetchMeals(); setShowInsulinEditor(true) }}>
                    Afternoon Snack
                  </Button>
                </View>

                <View style={{ paddingBottom: 10 }}>
                  <Button size="lg" colorScheme="indigo" onPress={() => { meal = ("Dinner"); fetchMeals(); setShowInsulinEditor(true) }}>
                    Dinner
                  </Button>
                </View>

                <View style={{ paddingBottom: 10 }}>
                  <Button size="lg" colorScheme="indigo" onPress={() => { meal = ("NightSnack"); fetchMeals(); setShowInsulinEditor(true) }}>
                    Night Snack
                  </Button>
                </View>

              </View>
            }

            {showInsulinEditor &&
              <View>
                <View style={{ paddingBottom: 10 }}>
                  <Button size="lg" colorScheme="indigo" onPress={showDatePicker}>
                    {date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()}
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
                      fetchMeals();
                    }}
                  />
                )}

                <VStack space={10} mt="5">
                  <View style={{ paddingBottom: 20 }}>
                    <Button size="lg" colorScheme="indigo" onPress={() => { setShowInsulinEditor(false) }}>
                      All Meal Options
                    </Button>
                  </View>

                  {fields.map((field, idx) => {

                    console.log("field", field)

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

                    console.log("main meal ", mainMeal, idx)

                    return (
                      <HStack space="7">
                        <View alignItems={'flex-start'}>
                          <FormControl key={`${field}-${idx}`}>

                            <Collapse isOpen={showAlert}>
                              <Alert w="100%" status={"info"}>
                                <VStack space={2} flexShrink={1} w="100%">
                                  <HStack flexShrink={1} space={2} justifyContent="space-between">
                                    <HStack space={2} flexShrink={1}>
                                      <Alert.Icon mt="1" />
                                      <Text fontSize="md" color="coolGray.800">
                                        Your sugar level went ~{amount} when previously eating this meal.
                                      </Text>
                                    </HStack>
                                  </HStack>
                                </VStack>
                              </Alert>
                            </Collapse>


                            <FormControl.Label>Meal</FormControl.Label>

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
                                    console.log("in loop ", mealsList[i], item.title);
                                    if (mealsList[i].meal === item.title) {
                                      console.log("found meal")
                                      mealObj = mealsList[i]
                                      console.log("mealObj", mealObj)
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
                              }
                              }
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


                          <HStack alignItems="center" space={8}>
                            <Text fontSize="lg">Main Meal</Text>
                            <Switch
                              isDisabled={mainMealSelected && mainMeal != idx}
                              isChecked={mainMeal == idx || field['mainMeal']}
                              onToggle={(value) => {
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
                          </HStack>
                        </View>
                      </HStack>
                    );
                  })}

                  <Button leftIcon={<Icon
                    color='white'
                    size="8"
                    as={<Ionicons name="add-outline" />}
                  />}

                    onPress={handleAdd}
                  >Add New</Button>


                  <View style={{ paddingTop: 20, paddingBottom: 20 }}>
                    <Collapse isOpen={settingsMissing}>
                      <Alert w="100%" status={"info"}>
                        <VStack space={2} flexShrink={1} w="100%">
                          <HStack flexShrink={1} space={2} justifyContent="space-between">
                            <HStack space={2} flexShrink={1}>
                              <Alert.Icon mt="1" />
                              <Text fontSize="md" color="coolGray.800">
                                Please make sure your values are updated under the settings tab.
                              </Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </Alert>
                    </Collapse>

                    <Text fontSize="lg" style={{ textAlign: 'center' }}>
                      Glucose Value: {sugarValue}
                    </Text>

                    <Text fontSize="lg" style={{ textAlign: 'center' }}>
                      Total Carbs: {totalCarb}
                    </Text>

                    <Text fontSize="lg" style={{ textAlign: 'center' }} color={foodUnits == "Not Available" ? "#ff0000" : "#000000"}>
                      Food Units: {foodUnits}
                    </Text>
                    <Text fontSize="lg" style={{ textAlign: 'center' }} color={correction == "Not Available" ? "#ff0000" : "#000000"}>
                      Correction Units: {correction}
                    </Text>
                    <Text fontSize="lg" style={{ textAlign: 'center' }} color={totalUnits == "Not Available" ? "#ff0000" : "#000000"}>
                      Total Units: {totalUnits}
                    </Text>

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
