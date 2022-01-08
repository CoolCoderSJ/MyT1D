import * as React from 'react';
import {
  NativeBaseProvider,
  Button,
  Box,
  HamburgerIcon,
  Pressable,
  Heading,
  VStack,
  Text,
  Center,
  HStack,
  Divider,
  Icon,
} from 'native-base';
import PouchDB from 'pouchdb-react-native'
import axios from 'axios';

export default function App() {
    const db = new PouchDB('readings')
const logindb = new PouchDB('settings')


const [data, setData] = React.useState({});
    

logindb.get("login").then(function (loginInfo) {
    setData({
        ...data,
        username: loginInfo.login.username,
        password: loginInfo.login.password
    })
})

  axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/AuthenticatePublisherAccount", {
    "accountName": data.username,
    "password": data.password,
    "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
})
.then((response) => {

const account_id = response.data;
axios.post("https://share2.dexcom.com/ShareWebServices/Services/General/LoginPublisherAccountById", {
    "accountId": account_id,
    "password": data.password,
    "applicationId": "d89443d2-327c-4a6f-89e5-496bbb0317db",
})
.then((response) => {
const session_id = response.data;

axios.post(`https://share2.dexcom.com/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${session_id}&minutes=1440&maxCount=36`)
.then((response) => {
response = response.data;

let readings = []
for (let i=0; i<response.length; i++) {
    readings.push({
        value: response[i].Value,
        trend: response[i].Trend
    })
}

db.get("readings")
.then(doc => {
  db.put({
    "_id": "readings",
    "_rev": doc['_rev'],
    readings: readings
  })
})
.catch(() => {
  db.put({
    "_id": "readings",
    readings: readings
  })
})


console.log("readings pushed")
})
.catch(error => console.error(error.response))
})
.catch(error => console.error(error.response))
})
.catch(error => console.error(error.response))



  return (
    <Center>
    <Text mt="12" fontSize="18">Hi :D</Text>
  </Center>
  );
}