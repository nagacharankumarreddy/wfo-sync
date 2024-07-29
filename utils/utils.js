import * as Location from "expo-location";

export const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance.toFixed(2);
};

export const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const calculateDistance = (currentCoords, officeLocation) => {
  if (!currentCoords || !officeLocation) {
    return null;
  }

  return getDistanceFromLatLonInMeters(
    currentCoords.latitude,
    currentCoords.longitude,
    officeLocation.latitude,
    officeLocation.longitude
  );
};

export const createAttendanceMessage = (isWeekend, userInRange, distance) => {
  const distanceMessage = `You are ${distance} meters away from the office.`;

  if (isWeekend) {
    return userInRange
      ? `It's the weekend. Do you still want to proceed with marking attendance?`
      : `It's the weekend and ${distanceMessage}. Do you still want to proceed with marking attendance?`;
  } else {
    return ` ${distanceMessage} Do you still want to proceed?`;
  }
};

export const getCurrentCoords = async () => {
  try {
    const currentLocation = await Location.getCurrentPositionAsync({});
    return currentLocation.coords;
  } catch (error) {
    console.error("Error fetching manual location:", error);
    return null;
  }
};
