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
import Database from '../db/handler.js';

db = new Database("meals");

export default function App() {

  const [filterText, setFilterText] = React.useState('');
  const [filterList, setFilterList] = React.useState([]);

  const filteredItems = React.useMemo(() => {
    let meals = [];

    db.set("meals", {
      "White Rice": 40,
      "Brown Rice": 30,
      "Grapes": 7,
    }).then(() => {

    
    db.get("meals").then(function(result){
      for (let i=0; i<Object.keys(result).length; i++){

        meals.push({id: i+1, value: Object.keys(result)[i]});
      }


    console.log(meals);
    console.log("filtered", meals.filter(
      (item) => item.value.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    ));

    setFilterList(meals.filter(
      (item) => item.value.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    ));

    });
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