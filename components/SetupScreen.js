import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { setUpScreenStyles as styles } from "./styles";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function SetupScreen({ navigation }) {
  const [inputDistance, setInputDistance] = useState("2");
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      const currentLocation = await Location.getCurrentPositionAsync({});
      const officeLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      await AsyncStorage.setItem(
        "officeLocation",
        JSON.stringify(officeLocation)
      );
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

  const saveNotificationTime = async () => {
    const timeString = notificationTime.toTimeString().slice(0, 5);
    await AsyncStorage.setItem("notificationTime", timeString);
    Alert.alert("Notification time saved!");
  };

  const navigateToHome = () => {
    navigation.navigate("Home");
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setNotificationTime(selectedTime);
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
        <TextInput
          style={styles.input}
          placeholder="Allowed Distance (meters)"
          keyboardType="numeric"
          value={inputDistance}
          onChangeText={setInputDistance}
        />
        <TouchableOpacity style={styles.button} onPress={saveAllowedDistance}>
          <Text style={styles.buttonText}>Save Range (in Meters)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.timePickerContainer}>
          <Text style={styles.timePickerLabel}>Notification Time:</Text>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.buttonText}>
              {notificationTime.toTimeString().slice(0, 5)}
            </Text>
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={notificationTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={saveNotificationTime}>
          <Text style={styles.buttonText}>Save Notification Time</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={navigateToHome}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

export default SetupScreen;
