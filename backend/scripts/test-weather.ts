#!/usr/bin/env ts-node

// Test script for Weather API integration

import { getCurrentWeather, getWeatherByCity } from '../src/services/weather';

async function testWeatherAPI() {
  console.log('Testing Weather API...');

  try {
    // Test Weather by coordinates
    console.log('Testing Weather by coordinates...');
    const weather = await getCurrentWeather(40.7128, -74.0060); // New York coordinates
    console.log('Weather Success:', weather);
  } catch (error) {
    console.log('Weather API Failed:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Test Weather by City
    console.log('Testing Weather by City...');
    const weatherCity = await getWeatherByCity('London');
    console.log('Weather by City Success:', weatherCity);
  } catch (error) {
    console.log('Weather by City Failed:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('Starting Weather API test...\n');

  await testWeatherAPI();

  console.log('\nWeather API test completed.');
}

main().catch(console.error);