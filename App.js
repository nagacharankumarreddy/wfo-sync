import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "./styles";
import { getDistanceFromLatLonInMeters } from "./utils";

export default function App() {
  const [location, setLocation] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [intervalId, setIntervalId] = useState(null);

  const [allowedDistanceMeters, setAllowedDistanceMeters] = useState(2);
  const [inputDistance, setInputDistance] = useState("2");

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        console.log("Current Location:", currentLocation.coords);
        setLocation(currentLocation.coords);

        const storedOfficeLocation = await AsyncStorage.getItem(
          "officeLocation"
        );
        if (storedOfficeLocation) {
          setOfficeLocation(JSON.parse(storedOfficeLocation));
        }

        const storedDistance = await AsyncStorage.getItem(
          "allowedDistanceMeters"
        );
        if (storedDistance) {
          setAllowedDistanceMeters(Number(storedDistance));
          setInputDistance(storedDistance);
        }

        loadAttendanceHistory();

        return () => {
          if (intervalId) {
            clearInterval(intervalId);
            console.log("Interval cleared");
          }
        };
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (officeLocation) {
      const id = setInterval(async () => {
        try {
          const { coords: latestCoords } =
            await Location.getCurrentPositionAsync({});
          setLocation(latestCoords);
          checkProximity(latestCoords);
        } catch (error) {
          console.error("Error fetching location:", error);
        }
      }, 10000);

      setIntervalId(id);
      console.log("Interval started");
    }
  }, [officeLocation]);

  const setOfficeLocationHandler = async () => {
    if (location) {
      if (officeLocation) {
        Alert.alert("Office location already set!");
        return;
      }

      const newOfficeLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setOfficeLocation(newOfficeLocation);
      await AsyncStorage.setItem(
        "officeLocation",
        JSON.stringify(newOfficeLocation)
      );
      Alert.alert("Office location set!");
      console.log("Office Location:", newOfficeLocation);
    } else {
      Alert.alert("Unable to get current location");
    }
  };

  const resetOfficeLocationHandler = async () => {
    await AsyncStorage.removeItem("officeLocation");
    setOfficeLocation(null);
    Alert.alert("Office location reset!");
    console.log("Office location reset");
  };

  const checkProximity = (currentCoords) => {
    if (currentCoords && officeLocation) {
      const distance = getDistanceFromLatLonInMeters(
        currentCoords.latitude,
        currentCoords.longitude,
        officeLocation.latitude,
        officeLocation.longitude
      );

      const isInRange = distance <= allowedDistanceMeters;
      const status = isInRange ? "In Range" : "Out of Range";

      logAttendance(status);
    }
  };

  const logAttendance = async (status) => {
    const timestamp = new Date().toLocaleString();
    const newEntry = { id: Date.now().toString(), timestamp, status };

    const updatedHistory = [newEntry, ...attendanceHistory];
    setAttendanceHistory(updatedHistory);

    try {
      await AsyncStorage.setItem(
        "attendanceHistory",
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const markAttendance = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const currentCoords = currentLocation.coords;

      if (currentCoords && officeLocation) {
        const distance = getDistanceFromLatLonInMeters(
          currentCoords.latitude,
          currentCoords.longitude,
          officeLocation.latitude,
          officeLocation.longitude
        );

        console.log("Manual Mark Distance:", distance);

        if (distance <= allowedDistanceMeters) {
          logAttendance("Manual Entry");
          Alert.alert(
            "Attendance manually marked!",
            `You are ${distance.toFixed(2)} meters from the office.`
          );
        } else {
          Alert.alert(
            "You are not within the allowed distance from the office location!",
            `You are ${distance.toFixed(2)} meters away.`
          );
        }
      } else {
        Alert.alert("Office location not set");
      }
    } catch (error) {
      console.error("Error fetching manual location:", error);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem("attendanceHistory");
      if (storedHistory) {
        setAttendanceHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const removeHistoryItem = async (id) => {
    const updatedHistory = attendanceHistory.filter((item) => item.id !== id);
    setAttendanceHistory(updatedHistory);

    try {
      await AsyncStorage.setItem(
        "attendanceHistory",
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Error removing history item:", error);
    }
  };

  const saveAllowedDistance = async () => {
    const distanceValue = Number(inputDistance);

    if (isNaN(distanceValue) || distanceValue <= 0) {
      Alert.alert("Please enter a valid distance greater than zero.");
      return;
    }

    setAllowedDistanceMeters(distanceValue);

    try {
      await AsyncStorage.setItem(
        "allowedDistanceMeters",
        String(distanceValue)
      );
      Alert.alert("Allowed distance saved!");
    } catch (error) {
      console.error("Error saving allowed distance:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work From Office Tracker</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.subtitle}>Set Allowed Range (meters):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={inputDistance}
          onChangeText={(value) => setInputDistance(value)}
        />
        <Button title="Save Range" onPress={saveAllowedDistance} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Set Office Location"
          onPress={setOfficeLocationHandler}
        />
        <Button
          title="Reset Office Location"
          onPress={resetOfficeLocationHandler}
        />
      </View>

      {officeLocation && (
        <>
          <Text style={styles.subtitle}>Office Location:</Text>
          <Text>Latitude: {officeLocation.latitude.toFixed(4)}</Text>
          <Text>Longitude: {officeLocation.longitude.toFixed(4)}</Text>
        </>
      )}

      <Button title="Mark Attendance Manually" onPress={markAttendance} />

      <Text style={styles.historyTitle}>Attendance History</Text>
      <FlatList
        data={attendanceHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItemContainer}>
            <Text style={styles.historyItem}>
              {item.timestamp} - {item.status}
            </Text>
            <TouchableOpacity onPress={() => removeHistoryItem(item.id)}>
              <Text style={styles.removeButton}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
