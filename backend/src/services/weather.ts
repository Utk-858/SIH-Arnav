// Weather service using WeatherAPI.com
// Provides current weather data for location-based diet recommendations

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const weatherApiKey = process.env.WEATHER_API_KEY;
const baseUrl = process.env.WEATHER_API_BASE_URL || 'http://api.weatherapi.com/v1';

if (!weatherApiKey) {
  console.warn('WEATHER_API_KEY not set, weather service will not work');
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
  location: string;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    if (!weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    const response = await axios.get(`${baseUrl}/current.json`, {
      params: {
        key: weatherApiKey,
        q: `${lat},${lon}`,
        aqi: 'no',
      },
    });

    const data = response.data;
    return {
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      description: data.current.condition.text,
      windSpeed: data.current.wind_kph / 3.6, // Convert kph to m/s
      location: data.location.name,
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null; // Return null as fallback
  }
}

export async function getWeatherByCity(city: string): Promise<WeatherData | null> {
  try {
    if (!weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    const response = await axios.get(`${baseUrl}/current.json`, {
      params: {
        key: weatherApiKey,
        q: city,
        aqi: 'no',
      },
    });

    const data = response.data;
    return {
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      description: data.current.condition.text,
      windSpeed: data.current.wind_kph / 3.6, // Convert kph to m/s
      location: data.location.name,
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}