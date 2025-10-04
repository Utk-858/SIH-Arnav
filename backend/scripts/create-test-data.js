#!/usr/bin/env node

// Simple script to create test data using the API

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function createTestPatient(index) {
  try {
    const names = ['Amit Kumar', 'Priya Sharma', 'Rajesh Patel', 'Anjali Singh', 'Vikram Reddy', 'Kavita Jain', 'Suresh Gupta', 'Meera Iyer', 'Arjun Nair', 'Poonam Desai'];
    const genders = ['Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female', 'Male', 'Female'];
    const doshas = ['Vata', 'Pitta', 'Kapha', 'Mixed'];

    const patientData = {
      name: names[index],
      age: 25 + index * 5,
      gender: genders[index],
      code: `PAT${Date.now().toString().slice(-6)}${index}`,
      email: `patient${index}@example.com`,
      phone: `+91-98765432${10 + index}`,
      address: `Address ${index + 1}`,
      dietaryHabits: 'Vegetarian',
      allergies: [],
      medicalHistory: 'None',
      currentMedications: 'None',
      doshaType: doshas[index % doshas.length],
      registrationDate: new Date(),
      lastUpdated: new Date()
    };

    const response = await axios.post(`${API_BASE_URL}/patients`, patientData);
    console.log(`✅ Created test patient ${index + 1}:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error(`❌ Failed to create test patient ${index + 1}:`, error.response?.data || error.message);
  }
}

async function main() {
  console.log('Creating test data...');
  for (let i = 0; i < 10; i++) {
    await createTestPatient(i);
  }
  console.log('Test data creation completed!');
}

main().catch(console.error);