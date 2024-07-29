import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentCoords } from "../utils/utils";
import { useAppContext } from "./AppProvider";
import { setUpScreenStyles as styles } from "./styles";

function SetupScreen({ navigation }) {
  const [inputDistance, setInputDistance] = useState("200");
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDistanceTooltip, setShowDistanceTooltip] = useState(false);
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  const { setOfficeLocation } = useAppContext();

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
      }
    };

    requestPermissions();
  }, []);

  const setOfficeLocationHandler = async () => {
    try {
      const currentCoords = await getCurrentCoords();
      const officeLocation = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
      };

      console.log(
        "officeLocation from setupscreen handler: " +
          JSON.stringify(officeLocation)
      );
      await AsyncStorage.setItem(
        "officeLocation",
        JSON.stringify(officeLocation)
      );

      setOfficeLocation(officeLocation);

      Alert.alert("Office location set!");
    } catch (error) {
      Alert.alert("Unable to get current location");
      console.error("Error setting office location:", error);
    }
  };

  const saveAllowedDistance = async () => {
    const distanceValue = Number(inputDistance);

    if (isNaN(distanceValue) || distanceValue <= 0) {
      Alert.alert("Please enter a valid distance greater than zero.");
      return;
    }

    await AsyncStorage.setItem("allowedDistanceMeters", String(distanceValue));
    Alert.alert("Allowed distance saved!");
  };

  const navigateToHome = () => {
    navigation.navigate("Home");
  };

  const handleTimeChange = async (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setNotificationTime(selectedTime);

      const timeString = selectedTime.toTimeString().slice(0, 5);
      await AsyncStorage.setItem("notificationTime", timeString);

      Alert.alert("Notification time saved!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Setup Your App</Text>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.button}
          onPress={setOfficeLocationHandler}
        >
          <Text style={styles.buttonText}>Set Office Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Allowed Distance (meters)"
            keyboardType="numeric"
            value={inputDistance}
            onChangeText={setInputDistance}
          />
        </View>
        {showDistanceTooltip && (
          <Text style={styles.infoText}>
            Range is the maximum distance from the office location within which
            you can mark your attendance.
          </Text>
        )}
        <TouchableOpacity style={styles.button} onPress={saveAllowedDistance}>
          <Text style={styles.buttonText}>Save Range (in Meters)</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowDistanceTooltip(!showDistanceTooltip)}
          >
            <Text style={styles.infoButtonText}>ℹ️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.timePickerContainer}>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.buttonText}>
              {notificationTime.toTimeString().slice(0, 5)}
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowTimeTooltip(!showTimeTooltip)}
            >
              <Text style={styles.infoButtonText}>ℹ️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          {showTimeTooltip && (
            <Text style={styles.infoText}>
              You can set a time for a daily reminder. The app will send you a
              notification at this time every day.
            </Text>
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={notificationTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={navigateToHome}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

export default SetupScreen;
