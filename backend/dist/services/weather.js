"use strict";
// Weather service using WeatherAPI.com
// Provides current weather data for location-based diet recommendations
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentWeather = getCurrentWeather;
exports.getWeatherByCity = getWeatherByCity;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '../../.env') });
const weatherApiKey = process.env.WEATHER_API_KEY;
const baseUrl = process.env.WEATHER_API_BASE_URL || 'http://api.weatherapi.com/v1';
if (!weatherApiKey) {
    console.warn('WEATHER_API_KEY not set, weather service will not work');
}
async function getCurrentWeather(lat, lon) {
    try {
        if (!weatherApiKey) {
            throw new Error('Weather API key not configured');
        }
        const response = await axios_1.default.get(`${baseUrl}/current.json`, {
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
    }
    catch (error) {
        console.error('Weather API error:', error);
        return null; // Return null as fallback
    }
}
async function getWeatherByCity(city) {
    try {
        if (!weatherApiKey) {
            throw new Error('Weather API key not configured');
        }
        const response = await axios_1.default.get(`${baseUrl}/current.json`, {
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
    }
    catch (error) {
        console.error('Weather API error:', error);
        return null;
    }
}
//# sourceMappingURL=weather.js.map