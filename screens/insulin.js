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


export default function App() {
  const [fields, setFields] = React.useState([{ }]);



  function handleChange(i, type, value) {
    const values = [...fields];
    values[i][type] = value;
    setFields(values);
    
    // get("insulin").then(function(result){
    //   let meals = result;
      
    //   if (!meals) {
    //       meals = {};
    // }

    //   meals[i] = {
    //       meal: fields[i].meal,
    //       carbs: fields[i].carbs,
    //       unit: fields[i].unit
    //   };

    //   setObj("insulin", meals)
    //   .then(() => {
    //       console.log("meals updated");
    //   });
    // });

  }

  function handleAdd() {
    const values = [...fields];
    values.push({ meal: null, carbs: null, unit: null });
    setFields(values);
    setObj("insulin", values);
  }

  function handleRemove(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    setObj("insulin", values);
  }


  const [filterText, setFilterText] = React.useState('');
  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);

  React.useMemo(() => {
    let meals = [];
    
    get("meals").then(function(result){
      for (let i=0; i<Object.keys(result).length; i++){

        meals.push({id: i+1, title: result[String(i)].meal});
      }


    console.log(meals);

    setFilterList(meals);
    setMealsList(result);

    });
    
    console.log("filter list", filterList);

    return filterList;
  }, [filterText]);


  const [servingSizes, setServingSizes] = React.useState({});
  const [date, setDate] = React.useState(new Date());
  const [show, setShow] = React.useState(false);

  const showDatePicker = () => {
    setShow(true);
  }

  return (
    <ScrollView contentContainerStyle={{flexGrow:1}}>
     <View style={{padding: 40}}>
  <Center>
     <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">
     
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
          }}
        />
      )}

    <Button size="lg" colorScheme="indigo" onPress={handleAdd}>
        Add Food
    </Button>

    <VStack space={10} mt="5">
        {
            console.log("inside", fields)
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

        return (
            <FormControl key={`${field}-${idx}`}>

            <FormControl.Label>Meal</FormControl.Label>

            <AutocompleteDropdown
              clearOnFocus={false}
              closeOnBlur={true}
              closeOnSubmit={true}
              dataSet={filterList}
              onChangeText={e => handleChange(idx, "meal", e)}
              onSelectItem={(item) => {
                if (item) {
                  console.log("item", item);
                setFilterText(item.title);
                let mealObj = mealsList[item.id-1];
                console.log("mealobj", mealObj)
                let fieldset = fields
                console.log("fieldset", fieldset)
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
                console.log(servingSizes)
                if (servingSizes[idx]) {
                  let fieldset = fields
                  console.log(Number(e), servingSizes[idx])
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
      </VStack>
      </Box>
  </Center>
  </View>
  </ScrollView>

  );
}