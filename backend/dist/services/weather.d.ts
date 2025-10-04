export interface WeatherData {
    temperature: number;
    humidity: number;
    description: string;
    windSpeed: number;
    location: string;
}
export declare function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null>;
export declare function getWeatherByCity(city: string): Promise<WeatherData | null>;
//# sourceMappingURL=weather.d.ts.map