import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [officeLocation, setOfficeLocation] = useState(null);

  return (
    <AppContext.Provider value={{ officeLocation, setOfficeLocation }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
