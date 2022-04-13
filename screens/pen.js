// Import the libraries needed
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import * as React from "react";
import {
  KeyboardAvoidingView, ScrollView,
  View
} from "react-native";
import {
  Button, Layout, Section, SectionContent, TextInput,
  themeColor, TopNav, useTheme, Picker, Text
} from "react-native-rapi-ui";
import { HStack, VStack } from 'react-native-stacks';





// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

let history = NaN;
let display = []
let showDiscarded = false;

export default function App() {
  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const navigation = useNavigation();
  const { isDarkmode, setTheme } = useTheme();
  const [fields, setFields] = React.useState([]);

  React.useEffect(() => {
    get("pens").then(function (result) {
        let pens = result;
    
        if (!pens) {
            setFields([]);
        }
    
        let fieldsToSet = []
    
        // Set the ingredients in the state
        for (let i = 0; i < pens.length; i++) {
            fieldsToSet.push({
            type: pens[i].type,
            location: pens[i].location,
            amount: pens[i].amount,
            notes: pens[i].notes,
            history: pens[i].history,
            takenOut: new Date(pens[i].takenOut),
            discarded: pens[i].discarded || false,
            });

            display.push({
                name: "Show",
                icon: "chevron-down-circle"
            })
        }

        console.log(fieldsToSet)
    
        setFields(fieldsToSet);
        forceUpdate()
    
    });
  }, []);

  function handleChange(i, type, value) {
    const values = [...fields];
    values[i][type] = value;
    setFields(values);
    setObj("pens", values);
  }

  function handleAdd() {
    const values = [...fields];
    values.push({ type: null, location: null, amount: null, notes: null, takenOut: new Date(), history: [], discarded: false });
    display.push({ name: "Show", icon: "chevron-down-circle" })
    setFields(values);
    forceUpdate();
  }

  function handleRemove(i, type) {

    if (type == "pen") {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    setObj("pens", values);
    }

    if (type == "log") {
        const values = [...fields];
        const history = fields[i].history;
        history.splice(i, 1);
        values[i].history = history;
        setFields(values);
        setObj("pens", values);
    }
  }

  Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }


  const items = [
    { label: 'Short Acting Insulin', value: 'Short Acting Insulin' },
    { label: 'Long Acting Insulin', value: 'Long Acting Insulin' },
];

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
          middleContent="Insulin Pen"
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
        {
            fields.map((field, idx) => {
              return (
                <View>
                  {field.discarded == false && 
                  <View>
                    <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                      <SectionContent>
                        <View style={{ marginBottom: 20 }}>
                        <Picker
                            items={items}
                            value={field.type}
                            placeholder="Pick Insulin Type"
                            onValueChange={(val) => handleChange(idx, "type", val)}
                        />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Location"
                            onChangeText={e => handleChange(idx, "location", e)}
                            defaultValue={field.location}
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Amount of units"
                            onChangeText={e => handleChange(idx, "amount", e)}
                            defaultValue={field.amount}
                            keyboardType="numeric"
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Notes"
                            onChangeText={e => handleChange(idx, "notes", e)}
                            defaultValue={field.notes}
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <Text>Started using on: {field.takenOut.toLocaleDateString()}</Text>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <Text>Will expire on: {field.takenOut.addDays(30).toLocaleDateString()}</Text>
                        </View>

                        <View>
                        <Button
                            style={{ marginTop: 10 }}
                            leftContent={
                              <Ionicons name="archive" size={20} color={themeColor.white} />
                            }
                            text="Discard"
                            status="warning"
                            type="TouchableOpacity"
                            onPress={() => { const values = [...fields]; values[idx].discarded = true; setFields(values); setObj("pens", values); forceUpdate(); }}
                          />

                          <Button
                            style={{ marginTop: 10 }}
                            leftContent={
                              <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                            }
                            text="Remove"
                            status="danger"
                            type="TouchableOpacity"
                            onPress={() => { handleRemove(idx, "pen") }}
                          />
                        </View>
                      </SectionContent>
                    </Section>

                    <View style={{marginVertical: 20}}>
                    <Button
                        style={{ marginHorizontal: 20 }}
                        leftContent={
                        <Ionicons name={display[idx].icon} size={20} color={themeColor.white} />
                        }
                        text={`${display[idx].name} History`}
                        status="primary"
                        type="TouchableOpacity"
                        onPress={() => {
                            if (display[idx].name == "Show") {
                              history = idx
                                display[idx].name = "Hide"
                                display[idx].icon = "chevron-up-circle"
                            } else {
                                history = NaN
                                display[idx].name = "Show"
                                display[idx].icon = "chevron-down-circle"
                            }
                            forceUpdate()
                        }}
                    />
                    </View>

                    {history == idx &&
                    <View style={{marginBottom: 20, marginHorizontal: 20}}>
                        <Section>
                            <SectionContent>
                                    {
                                    field.history.map((history, idx2) => {
                                      return (
                                        <HStack spacing={10} style={{
                                          display: "flex",
                                          flexDirection: "row"
                                        }}>
                                          <VStack spacing={5}>
                                            <HStack spacing={5}>
                                            <Text size="lg">{history.date}</Text>
                                            <Text size="lg">{history.units} units</Text>
                                            </HStack>
                                            <Text size="md">{history.note}</Text>
                                            </VStack>
                                            
                                            <Button
                                                style={{ marginTop: 10, alignSelf: "flex-end" }}
                                                leftContent={
                                                <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                                                }
                                                text=""
                                                status="danger"
                                                type="TouchableOpacity"
                                                onPress={() => { handleRemove(idx2, "log") }}
                                            />
                                        </HStack>
                                      )
                                    })
                                  }
                            </SectionContent>
                        </Section>
                    </View>
                }
              </View>
              }
              </View>
              )
            })
          }
          <Button
            style={{ marginBottom: 10, marginHorizontal: 20, marginTop: 50 }}
            leftContent={
              <Ionicons name="add-circle" size={20} color={themeColor.white} />
            }
            text="Add New Pen"
            status="primary"
            type="TouchableOpacity"
            onPress={handleAdd}
          />

          <Button
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
              <Ionicons name={`chevron-${showDiscarded ? "up" : "down"}-circle`} size={20} color={themeColor.white} />
            }
            text={`${showDiscarded ? "Hide" : "Show"} Discarded Pens`}
            status="primary"
            type="TouchableOpacity"
            onPress={() => {showDiscarded ? showDiscarded = false : showDiscarded = true; forceUpdate()}}
          />

          { showDiscarded &&
            fields.map((field, idx) => {
              return (
                <View>
                  {field.discarded == true && 
                  <View>
                    <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                      <SectionContent>
                        <View style={{ marginBottom: 20 }}>
                        <Picker
                            items={items}
                            value={field.type}
                            placeholder="Pick Insulin Type"
                            onValueChange={(val) => handleChange(idx, "type", val)}
                        />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Location"
                            onChangeText={e => handleChange(idx, "location", e)}
                            defaultValue={field.location}
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Amount of units"
                            onChangeText={e => handleChange(idx, "amount", e)}
                            defaultValue={field.amount}
                            keyboardType="numeric"
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Notes"
                            onChangeText={e => handleChange(idx, "notes", e)}
                            defaultValue={field.notes}
                          />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <Text>Started using on: {field.takenOut.toLocaleDateString()}</Text>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                          <Text>Expired on: {field.takenOut.addDays(30).toLocaleDateString()}</Text>
                        </View>

                        <View>

                          <Button
                            style={{ marginTop: 10 }}
                            leftContent={
                              <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                            }
                            text="Remove"
                            status="danger"
                            type="TouchableOpacity"
                            onPress={() => { handleRemove(idx, "pen") }}
                          />
                        </View>
                      </SectionContent>
                    </Section>

                    <View style={{marginVertical: 20}}>
                    <Button
                        style={{ marginHorizontal: 20 }}
                        leftContent={
                        <Ionicons name={display[idx].icon} size={20} color={themeColor.white} />
                        }
                        text={`${display[idx].name} History`}
                        status="primary"
                        type="TouchableOpacity"
                        onPress={() => {
                            if (display[idx].name == "Show") {
                              history = idx
                                display[idx].name = "Hide"
                                display[idx].icon = "chevron-up-circle"
                            } else {
                                history = NaN
                                display[idx].name = "Show"
                                display[idx].icon = "chevron-down-circle"
                            }
                            forceUpdate()
                        }}
                    />
                    </View>

                    {history == idx &&
                    <View style={{marginBottom: 20, marginHorizontal: 20}}>
                        <Section>
                            <SectionContent>
                                    {
                                    field.history.map((history, idx2) => {
                                      return (
                                        <HStack spacing={10} style={{
                                          display: "flex",
                                          flexDirection: "row"
                                        }}>
                                          <VStack spacing={5}>
                                            <HStack spacing={5}>
                                            <Text size="lg">{history.date}</Text>
                                            <Text size="lg">{history.units} units</Text>
                                            </HStack>
                                            <Text size="md">{history.note}</Text>
                                            </VStack>
                                            
                                            <Button
                                                style={{ marginTop: 10, alignSelf: "flex-end" }}
                                                leftContent={
                                                <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                                                }
                                                text=""
                                                status="danger"
                                                type="TouchableOpacity"
                                                onPress={() => { handleRemove(idx2, "log") }}
                                            />
                                        </HStack>
                                      )
                                    })
                                  }
                            </SectionContent>
                        </Section>
                    </View>
                }
              </View>
              }
              </View>
              )
            })
          }

        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>
  );
}