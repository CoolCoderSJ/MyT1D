import * as React from "react"
import { Dimensions } from "react-native";
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Input,
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
  useTypeahead, 
  Typeahead,
} from "native-base"
import AsyncStorage from '@react-native-async-storage/async-storage';

const set = async (key, value) => {  try {    await AsyncStorage.setItem(key, value)  } catch (e) {   console.log(e)  } }
const setObj = async (key, value) => {  try {    const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue)  } catch (e) {    console.log(e)  } }
const get = async (key) => {  try {    const value = await AsyncStorage.getItem(key); if(value !== null) { try {return JSON.parse(value)} catch {return value} }  } catch(e) {    console.log(e)  }}


export default function App() {

  const [filterText, setFilterText] = React.useState('');
  const [filterList, setFilterList] = React.useState([]);

  const filteredItems = React.useMemo(() => {
    let meals = [];
    
    get("meals").then(function(result){
      for (let i=0; i<Object.keys(result).length; i++){

        meals.push({id: i+1, value: result[String(i)].meal});
      }


    console.log(meals);
    console.log("filtered", meals.filter(
      (item) => item.value.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    ));

    setFilterList(meals.filter(
      (item) => item.value.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    ));

    });
    
    console.log("filter list", filterList);

    return filterList;
  }, [filterText]);


  return (
    <Center>
    <Typeahead
        options={filteredItems}
        onChange={setFilterText}
        getOptionKey={(item) => item.id}
        getOptionLabel={(item) => item.value}
        placeholder="Food name..."
      />
  </Center>
  );
}