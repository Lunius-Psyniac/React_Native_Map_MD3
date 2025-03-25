import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Import correct map component based on platform
const MapView =
  Platform.OS === 'web'
    ? require('react-native-web-maps').default
    : require('react-native-maps').default;
import { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const API_KEY = '7b8c25a46d8f15fa29fe8ee42bee0d6b';
const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // Web location handling
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setLocation({ latitude, longitude });
              fetchWeather(latitude, longitude);
            },
            (error) => Alert.alert('Error', error.message)
          );
        } else {
          Alert.alert('Error', 'Geolocation not supported.');
        }
      } else {
        // Mobile location handling
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Allow location access to use this app.'
          );
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        fetchWeather(loc.coords.latitude, loc.coords.longitude);
      }
    })();
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      let response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      let data = await response.json();

      if (response.ok) {
        setWeather({
          name: data.name,
          lat: lat.toFixed(2),
          lon: lon.toFixed(2),
          temp: data.main.temp,
          pressure: data.main.pressure,
          humidity: data.main.humidity,
          description: data.weather[0].description,
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch weather data.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch weather data.');
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={{ width: width, height: height }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          scrollEnabled={true}
          zoomEnabled={true}>
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
          />
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="blue" />
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Weather"
          onPress={() => navigation.navigate('Weather', { weather })}
        />
      </View>
    </View>
  );
}

function WeatherScreen({ route, navigation }) {
  const weather = route.params.weather;

  return (
    <View style={styles.weatherOverlay}>
      <View style={styles.weatherPopup}>
        {weather ? (
          <>
            <Text style={styles.modalTitle}>{weather.name}</Text>
            <Text style={styles.modalText}>🌍 Latitude: {weather.lat}</Text>
            <Text style={styles.modalText}>📍 Longitude: {weather.lon}</Text>
            <Text style={styles.modalText}>
              🌡️ Temperature: {weather.temp}°C
            </Text>
            <Text style={styles.modalText}>
              🔵 Pressure: {weather.pressure} hPa
            </Text>
            <Text style={styles.modalText}>
              💧 Humidity: {weather.humidity}%
            </Text>
            <Text style={styles.modalText}>
              🌦️ Description: {weather.description}
            </Text>
          </>
        ) : (
          <ActivityIndicator size="large" color="blue" />
        )}
        <Button title="Close" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'transparentModal',
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Weather" component={WeatherScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    elevation: 5,
  },
  weatherOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slight dark background for visibility
  },
  weatherPopup: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'center',
  },
});
