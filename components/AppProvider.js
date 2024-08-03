import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [officeLocation, setOfficeLocation] = useState(null);

  useEffect(() => {
    const loadOfficeLocation = async () => {
      try {
        const storedLocation = await AsyncStorage.getItem("officeLocation");
        if (storedLocation) {
          setOfficeLocation(JSON.parse(storedLocation));
        }
      } catch (error) {
        console.error("Error loading office location:", error);
      }
    };

    loadOfficeLocation();
  }, []);

  return (
    <AppContext.Provider value={{ officeLocation, setOfficeLocation }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
