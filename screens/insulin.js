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

  const filteredItems = React.useMemo(() => {
    let meals = [];
    
    get("meals").then(function(result){
      for (let i=0; i<Object.keys(result).length; i++){

        meals.push({id: i+1, title: result[String(i)].meal});
      }


    console.log(meals);

    setFilterList(meals);

    });
    
    console.log("filter list", filterList);

    return filterList;
  }, [filterText]);


  return (
  <Center>
     <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">
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
                setFilterText(item.title);

              }}
            />

            <FormControl.Label>Serving Amount (1, 0.75, 0.5, etc.)</FormControl.Label>
            <TextInput
              style={styles.input}
              onChangeText={e => handleChange(idx, "serving", e)}
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

  );
}
