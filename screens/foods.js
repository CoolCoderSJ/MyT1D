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
} from "native-base"
import Database from '../db/handler.js';

db = new Database("meals");

export default function App() {
    const [fields, setFields] = React.useState([{ value: null }]);

    db.get("meals").then(function(result){
        let meals = result;

        for (let i=0; i<Object.keys(meals).length; i++){
            fields.push({ 
                meal: meals[Object.keys(meals)[i].meal],
                carbs: meals[Object.keys(meals)[i].carbs],
                unit: meals[Object.keys(meals)[i].unit]
             });
        }

        handleRemove(0);

        console.log(meals, fields)
    });


    function handleChange(i, type, value) {
      const values = [...fields];
      values[i][type] = value;
      setFields(values);
      
      db.get("meals").then(function(result){
        let meals = result;

        console.log("db", meals)

        meals[i] = {
            meal: fields[i].meal,
            carbs: fields[i].carbs,
            unit: fields[i].unit
        };

        console.log("w/o db", meals)
        db.set("meals", meals)
        .then(() => {
            db.set("meals", meals).then(() => {
                console.log("meals updated");
            });
        });
      });

    }
  
    function handleAdd() {
      const values = [...fields];
      values.push({ meal: null, carbs: null, unit: null });
      setFields(values);
    }
  
    function handleRemove(i) {
      const values = [...fields];
      values.splice(i, 1);
      setFields(values);
    }
  

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
            <TextInput
              placeholder="Meal name"
              style={styles.input}
              onChangeText={e => handleChange(idx, "meal", e)}
              value={field.meal}
            />
            <TextInput
              placeholder="Carbs"
              style={styles.input}
              onChangeText={e => handleChange(idx, "carbs", e)}
              value={field.carbs}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Unit (e.g. cup, oz, etc.)"
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