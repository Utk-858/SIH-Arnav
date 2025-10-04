#!/usr/bin/env ts-node

// Test script for Google Cloud and Weather API integrations

import { aiService } from '../src/services/ai';
import { searchPlaces, getPlaceDetails } from '../src/services/google-cloud';

async function testGoogleCloudAPIs() {
  console.log('Testing Google Cloud APIs...');

  try {
    // Test TTS
    console.log('Testing TTS...');
    const audioBuffer = await aiService.textToSpeech('Hello, this is a test of text to speech.');
    console.log(`TTS Success: Generated ${audioBuffer.length} bytes of audio`);
  } catch (error) {
    console.log('TTS Failed:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Test Places API
    console.log('Testing Places API...');
    const places = await searchPlaces('restaurants in New York');
    console.log(`Places Search Success: Found ${places.length} places`);
  } catch (error) {
    console.log('Places API Failed:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Test Weather API
    console.log('Testing Weather API...');
    const weather = await aiService.getWeather(40.7128, -74.0060); // New York coordinates
    console.log('Weather Success:', weather);
  } catch (error) {
    console.log('Weather API Failed:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Test Weather by City
    console.log('Testing Weather by City...');
    const weatherCity = await aiService.getWeatherByCity('London');
    console.log('Weather by City Success:', weatherCity);
  } catch (error) {
    console.log('Weather by City Failed:', error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log('Starting API integration tests...\n');

  await testGoogleCloudAPIs();

  console.log('\nAPI integration tests completed.');
}

main().catch(console.error);