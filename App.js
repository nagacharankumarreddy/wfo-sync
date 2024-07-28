import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, View } from "react-native";
import "react-native-gesture-handler";
import HomeScreen from "./components/HomeScreen";
import SetupScreen from "./components/SetupScreen";

const Stack = createStackNavigator();

function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const isSetupCompleted = await AsyncStorage.getItem("officeLocation");
        setInitialRoute(isSetupCompleted ? "Home" : "Setup");
      } catch (error) {
        console.error("Error checking setup status:", error);
      }
    };

    checkSetupStatus();
  }, []);

  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            headerRight: () => (
              <Button
                onPress={() => navigation.navigate("Setup")}
                title="Setup"
              />
            ),
          })}
        />
        <Stack.Screen name="Setup" component={SetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
