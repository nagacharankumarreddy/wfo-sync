import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import {
  calculateDistance,
  createAttendanceMessage,
  formatDate,
  getCurrentCoords,
} from "../utils/utils";
import { useAppContext } from "./AppProvider";
import { homeScreenStyles as styles } from "./styles";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function HomeScreen({ navigation }) {
  const { officeLocation } = useAppContext();
  console.log(
    "office location homescreen top: " + JSON.stringify(officeLocation)
  );
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [allowedDistanceMeters, setAllowedDistanceMeters] = useState(2);

  useFocusEffect(
    React.useCallback(() => {
      const initializeApp = async () => {
        try {
          const locationStatus =
            await Location.requestForegroundPermissionsAsync();
          if (locationStatus.status !== "granted") {
            Alert.alert("Permission to access location was denied");
            return;
          }

          const notificationStatus =
            await Notifications.requestPermissionsAsync();
          if (notificationStatus.status !== "granted") {
            Alert.alert("Permission to send notifications was denied");
            return;
          }

          const storedDistance = await AsyncStorage.getItem(
            "allowedDistanceMeters"
          );
          if (storedDistance) {
            setAllowedDistanceMeters(Number(storedDistance));
          }

          loadAttendanceHistory();
          scheduleDailyNotification();
        } catch (error) {
          console.error("Error initializing app:", error);
        }
      };

      initializeApp();

      const subscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          if (response.notification.request.content.data.screen) {
            navigation.navigate(
              response.notification.request.content.data.screen
            );
          }
        });

      return () => {
        subscription.remove();
      };
    }, [officeLocation])
  );

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

  const logAttendance = async () => {
    const today = new Date();
    const dayString = today.toLocaleString("default", { weekday: "long" });

    const newEntry = {
      id: Date.now().toString(),
      date: formatDate(today),
      day: dayString,
    };

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
      const currentCoords = await getCurrentCoords();
      if (!currentCoords || !officeLocation) {
        Alert.alert("Office location not set");
        return;
      }

      const distance = calculateDistance(currentCoords, officeLocation);

      const userInRange = distance <= allowedDistanceMeters;
      const today = new Date();
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      const existingEntry = attendanceHistory.find(
        (item) => item.date === formatDate(today)
      );

      if (existingEntry) {
        Alert.alert("Attendance already marked for today!");
        return;
      }

      if (userInRange && !isWeekend) {
        await logAttendance();
        Alert.alert(
          "Attendance marked!",
          `You are ${distance} meters from the office.`
        );
        return;
      }

      const message = createAttendanceMessage(isWeekend, userInRange, distance);
      Alert.alert("Attention", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: async () => {
            await logAttendance();
            Alert.alert("Attendance marked!");
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching manual location:", error);
    }
  };

  const scheduleDailyNotification = async () => {
    const timeString = await AsyncStorage.getItem("notificationTime");
    if (!timeString) {
      return;
    }

    const [hours, minutes] = timeString.split(":").map(Number);
    const trigger = new Date();
    trigger.setHours(hours);
    trigger.setMinutes(minutes);

    if (trigger <= new Date()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Mark Your Attendance!",
        body: "Don't forget to log your attendance today.",
        data: { screen: "Home" },
      },
      trigger,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work From Office Tracker</Text>

      <TouchableOpacity
        style={styles.attendanceButton}
        onPress={markAttendance}
      >
        <FontAwesome name="check-circle" size={24} color="white" />
        <Text style={styles.buttonText}>Mark Attendance </Text>
      </TouchableOpacity>

      <Text style={styles.historyTitle}>Attendance History</Text>
      <FlatList
        data={attendanceHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyText}>
              {item.date} - {item.day}
            </Text>
            <TouchableOpacity onPress={() => removeHistoryItem(item.id)}>
              <FontAwesome name="trash" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={styles.historySeparator}></View>
        )}
      />
    </View>
  );
}

export default HomeScreen;
