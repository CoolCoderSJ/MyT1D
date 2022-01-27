import * as React from "react"
import {
  Box,
  Text,
  Heading,
  VStack,
  FormControl,
  Button,
  HStack,
  Center,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Collapse,
  ScrollView,
  Alert,
  IconButton,
  CloseIcon,
} from "native-base";
import Database from '../db/handler.js';

db = new Database("settings")


console.disableYellowBox = true;

const Settings = () => {
  const [savedSettings, setSettings] = React.useState({});

  const [showitoc, setShowitoc] = React.useState(false);
  const handleToggleitoc = () => setShowitoc(!showitoc);

  const [showisf, setShowisf] = React.useState(false);
  const handleToggleisf = () => setShowisf(!showisf);

  const [showAlert, setShowAlert] = React.useState(false);

  function load_values() {
  db.get("factors")
  .then(factors => {
    console.log("factors", factors);
  setSettings({
    ...savedSettings,
    itoc: factors.itoc,
    itocm: factors.itocm,
    itocl: factors.itocl,
    itoca: factors.itoca,
    itocd: factors.itocd,
    itoce: factors.itoce,
    isf: factors.isf,
    isfm: factors.isfm,
    isfl: factors.isfl,
    isfa: factors.isfa,
    isfd: factors.isfd,
    isfe: factors.isfe,
  })
  })
  .catch(error => {
    setSettings({
      ...savedSettings,
      itoc:  0,
      itocm: 0,
      itocl: 0,
      itoca: 0,
      itocd: 0,
      itoce: 0,
      isf:   0,
      isfm:  0,
      isfl:  0,
      isfa:  0,
      isfd:  0,
      isfe:  0,
    })
  })
}

console.log(savedSettings)
if (!savedSettings) {
  console.log("loading values")
  load_values();
  }

  const onSave = () => {
    db.set('factors', {
      "name": "factors",
      "itoc": savedSettings.itoc,
      "itocm": savedSettings.itocm,
      "itocl": savedSettings.itocl,
      "itoca": savedSettings.itoca,
      "itocd": savedSettings.itocd,
      "itoce": savedSettings.itoce,
      "isf": savedSettings.isf,
      "isfm": savedSettings.isfm,
      "isfl": savedSettings.isfl,
      "isfa": savedSettings.isfa,
      "isfd": savedSettings.isfd,
      "isfe": savedSettings.isfe,
    })
    .then(() => {
    setShowAlert(true);
    });
  };


  return (
    <ScrollView contentContainerStyle={{flexGrow:1}}>
    <Center flex={1} px="3">
    <Box safeArea p="2" py="2" w="90%" maxW="290" h="90%">
      <Heading
        size="lg"
        fontWeight="600"
        color="coolGray.800"
        _dark={{
          color: "warmGray.50",
        }}
      >
        Settings
      </Heading>

      <Collapse isOpen={showAlert}>
        <Alert w="100%" status={"success"}>
            <VStack space={2} flexShrink={1} w="100%">
              <HStack flexShrink={1} space={2} justifyContent="space-between">
                <HStack space={2} flexShrink={1}>
                  <Alert.Icon mt="1" />
                  <Text fontSize="md" color="coolGray.800">
                    Successfully Saved!
                  </Text>
                </HStack>
                <IconButton
                  variant="unstyled"
                  icon={<CloseIcon size="3" color="coolGray.600" />}
                  onPress={() => setShowAlert(false)}
                />
              </HStack>
            </VStack>
          </Alert>
          </Collapse>


      <VStack space={10} mt="5">
        <FormControl>
          <FormControl.Label>I:C Ratio</FormControl.Label>
            <NumberInput value={savedSettings.itoc} onChange={(value) => setSettings({ ...savedSettings, itoc: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <Collapse isOpen={showitoc}>
        <FormControl>
          <FormControl.Label>I:C Ratio - Morning</FormControl.Label>
            <NumberInput value={savedSettings.itocm} onChange={(value) => setSettings({ ...savedSettings, itocm: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>I:C Ratio - Lunch</FormControl.Label>
            <NumberInput value={savedSettings.itocl} onChange={(value) => setSettings({ ...savedSettings, itocl: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>I:C Ratio - Midday Snack</FormControl.Label>
            <NumberInput value={savedSettings.itoca} onChange={(value) => setSettings({ ...savedSettings, itoca: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>I:C Ratio - Dinner</FormControl.Label>
            <NumberInput value={savedSettings.itocd} onChange={(value) => setSettings({ ...savedSettings, itocd: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>I:C Ratio - Night Snack</FormControl.Label>
            <NumberInput value={savedSettings.itoce} onChange={(value) => setSettings({ ...savedSettings, itoce: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>
        </Collapse>

        <Button size="sm" colorScheme="indigo" onPress={handleToggleitoc}>
        <Text color="white">{showitoc ? 'Hide' : 'Show'} Individual Meal Values</Text>
      </Button>

        <FormControl>
        <FormControl.Label>Insulin Sensitivity Factor</FormControl.Label>
            <NumberInput value={savedSettings.isf} onChange={(value) => setSettings({ ...savedSettings, isf: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>


        <Collapse isOpen={showisf}>
        <FormControl>
          <FormControl.Label>ISF - Morning</FormControl.Label>
            <NumberInput value={savedSettings.isfm} onChange={(value) => setSettings({ ...savedSettings, isfm: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>ISF - Lunch</FormControl.Label>
            <NumberInput value={savedSettings.isfl} onChange={(value) => setSettings({ ...savedSettings, isfl: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>ISF - Midday Snack</FormControl.Label>
            <NumberInput value={savedSettings.isfa} onChange={(value) => setSettings({ ...savedSettings, isfa: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>ISF - Dinner</FormControl.Label>
            <NumberInput value={savedSettings.isfd} onChange={(value) => setSettings({ ...savedSettings, isfd: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>

        <FormControl>
          <FormControl.Label>ISF - Night Snack</FormControl.Label>
            <NumberInput value={savedSettings.isfe} onChange={(value) => setSettings({ ...savedSettings, isfe: value })}>
                <NumberInputField />
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            </NumberInput>
        </FormControl>
        </Collapse>

        <Button size="sm" colorScheme="indigo" onPress={handleToggleisf}>
        <Text color="white">{showisf ? 'Hide' : 'Show'} Individual Meal Values</Text>
      </Button>


        <Button mt="2" colorScheme="indigo" onPress={onSave}>
          Save!
        </Button>
      </VStack>
    </Box>
    </Center>
    </ScrollView>
  )
}

export default () => {
  return (
    <Settings />
  )
}
