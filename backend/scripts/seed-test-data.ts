#!/usr/bin/env ts-node

// Comprehensive test data seeding script for Ayurvedic Diet Management System
// Uses direct Firestore access

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase with default credentials (same as backend server)
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Use default credentials (for development with Firebase CLI)
  console.log('⚠️ Using default credentials');
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

import { hospitalsService, usersService, patientsService, vitalsService, consultationsService, dietPlansService } from '../src/services/firestore';

const sampleHospitals = [
  {
    name: 'City Ayurvedic Hospital',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    phone: '+91-80-1234-5678',
    email: 'admin@cityayurveda.com',
    adminId: 'hospital-admin-1',
    createdAt: new Date(),
  },
  {
    name: 'Regional Ayurvedic Center',
    address: '456 Health Street, Mumbai, Maharashtra 400001',
    phone: '+91-22-9876-5432',
    email: 'admin@regionalayurveda.com',
    adminId: 'hospital-admin-2',
    createdAt: new Date(),
  },
];

const sampleDietitians = [
  {
    uid: 'dietitian-1',
    email: 'dr.priya@cityayurveda.com',
    displayName: 'Dr. Priya Sharma',
    role: 'dietitian' as const,
    hospitalId: '', // Will be set after hospitals are created
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'dietitian-2',
    email: 'dr.rajesh@cityayurveda.com',
    displayName: 'Dr. Rajesh Kumar',
    role: 'dietitian' as const,
    hospitalId: '', // Will be set after hospitals are created
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'dietitian-3',
    email: 'dr.meera@regionalayurveda.com',
    displayName: 'Dr. Meera Patel',
    role: 'dietitian' as const,
    hospitalId: '', // Will be set after hospitals are created
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'dietitian-4',
    email: 'dr.arjun@regionalayurveda.com',
    displayName: 'Dr. Arjun Singh',
    role: 'dietitian' as const,
    hospitalId: '', // Will be set after hospitals are created
    createdAt: new Date(),
    lastLogin: new Date(),
  },
  {
    uid: 'dietitian-5',
    email: 'dr.kavita@cityayurveda.com',
    displayName: 'Dr. Kavita Reddy',
    role: 'dietitian' as const,
    hospitalId: '', // Will be set after hospitals are created
    createdAt: new Date(),
    lastLogin: new Date(),
  },
];

const samplePatients = [
  {
    name: 'Amit Kumar',
    age: 45,
    gender: 'Male' as const,
    email: 'amit.kumar@email.com',
    phone: '+91-9876543210',
    address: '789 Park Street, Bangalore',
    emergencyContact: {
      name: 'Sunita Kumar',
      phone: '+91-9876543211',
      relationship: 'Wife',
    },
    dietaryHabits: 'Vegetarian, prefers spicy food',
    allergies: ['Peanuts'],
    medicalHistory: 'Hypertension, Type 2 Diabetes',
    currentMedications: 'Metformin 500mg, Amlodipine 5mg',
    doshaType: 'Pitta' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-01-15'),
    lastUpdated: new Date(),
  },
  {
    name: 'Priya Sharma',
    age: 32,
    gender: 'Female' as const,
    email: 'priya.sharma@email.com',
    phone: '+91-9876543212',
    address: '456 Residency Road, Bangalore',
    emergencyContact: {
      name: 'Rajesh Sharma',
      phone: '+91-9876543213',
      relationship: 'Husband',
    },
    dietaryHabits: 'Vegetarian, light eater',
    allergies: [],
    medicalHistory: 'Anxiety, Insomnia',
    currentMedications: 'Ashwagandha, Brahmi',
    doshaType: 'Vata' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-02-20'),
    lastUpdated: new Date(),
  },
  {
    name: 'Rajesh Patel',
    age: 55,
    gender: 'Male' as const,
    email: 'rajesh.patel@email.com',
    phone: '+91-9876543214',
    address: '321 Marine Drive, Mumbai',
    emergencyContact: {
      name: 'Meera Patel',
      phone: '+91-9876543215',
      relationship: 'Wife',
    },
    dietaryHabits: 'Non-vegetarian, heavy eater',
    allergies: ['Shellfish'],
    medicalHistory: 'Obesity, High Cholesterol',
    currentMedications: 'Atorvastatin 10mg',
    doshaType: 'Kapha' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-01-10'),
    lastUpdated: new Date(),
  },
  {
    name: 'Anjali Singh',
    age: 28,
    gender: 'Female' as const,
    email: 'anjali.singh@email.com',
    phone: '+91-9876543216',
    address: '654 Bandra West, Mumbai',
    emergencyContact: {
      name: 'Vikram Singh',
      phone: '+91-9876543217',
      relationship: 'Brother',
    },
    dietaryHabits: 'Vegetarian, follows intermittent fasting',
    allergies: ['Dairy'],
    medicalHistory: 'PCOS, Irregular periods',
    currentMedications: 'None',
    doshaType: 'Mixed' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-03-05'),
    lastUpdated: new Date(),
  },
  {
    name: 'Vikram Reddy',
    age: 42,
    gender: 'Male' as const,
    email: 'vikram.reddy@email.com',
    phone: '+91-9876543218',
    address: '987 Jubilee Hills, Hyderabad',
    emergencyContact: {
      name: 'Lakshmi Reddy',
      phone: '+91-9876543219',
      relationship: 'Wife',
    },
    dietaryHabits: 'Vegetarian, prefers South Indian food',
    allergies: [],
    medicalHistory: 'GERD, Acid reflux',
    currentMedications: 'Pantoprazole 40mg',
    doshaType: 'Pitta' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-02-15'),
    lastUpdated: new Date(),
  },
  {
    name: 'Kavita Jain',
    age: 38,
    gender: 'Female' as const,
    email: 'kavita.jain@email.com',
    phone: '+91-9876543220',
    address: '147 MG Road, Pune',
    emergencyContact: {
      name: 'Amit Jain',
      phone: '+91-9876543221',
      relationship: 'Husband',
    },
    dietaryHabits: 'Jain vegetarian, avoids root vegetables',
    allergies: [],
    medicalHistory: 'Thyroid disorder',
    currentMedications: 'Thyroxine 50mcg',
    doshaType: 'Vata' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-01-25'),
    lastUpdated: new Date(),
  },
  {
    name: 'Suresh Gupta',
    age: 50,
    gender: 'Male' as const,
    email: 'suresh.gupta@email.com',
    phone: '+91-9876543222',
    address: '258 Connaught Place, Delhi',
    emergencyContact: {
      name: 'Rekha Gupta',
      phone: '+91-9876543223',
      relationship: 'Wife',
    },
    dietaryHabits: 'Vegetarian, prefers Punjabi food',
    allergies: ['Eggs'],
    medicalHistory: 'Coronary artery disease',
    currentMedications: 'Aspirin 75mg, Atorvastatin 20mg',
    doshaType: 'Kapha' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-03-10'),
    lastUpdated: new Date(),
  },
  {
    name: 'Meera Iyer',
    age: 35,
    gender: 'Female' as const,
    email: 'meera.iyer@email.com',
    phone: '+91-9876543224',
    address: '369 T Nagar, Chennai',
    emergencyContact: {
      name: 'Krishnan Iyer',
      phone: '+91-9876543225',
      relationship: 'Father',
    },
    dietaryHabits: 'Vegetarian, South Indian cuisine',
    allergies: [],
    medicalHistory: 'Migraine, Stress',
    currentMedications: 'Propranolol 40mg',
    doshaType: 'Mixed' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-02-28'),
    lastUpdated: new Date(),
  },
  {
    name: 'Arjun Nair',
    age: 29,
    gender: 'Male' as const,
    email: 'arjun.nair@email.com',
    phone: '+91-9876543226',
    address: '741 MG Road, Kochi',
    emergencyContact: {
      name: 'Latha Nair',
      phone: '+91-9876543227',
      relationship: 'Mother',
    },
    dietaryHabits: 'Non-vegetarian, Kerala cuisine',
    allergies: ['Fish'],
    medicalHistory: 'Asthma',
    currentMedications: 'Salbutamol inhaler',
    doshaType: 'Kapha' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-03-15'),
    lastUpdated: new Date(),
  },
  {
    name: 'Poonam Desai',
    age: 41,
    gender: 'Female' as const,
    email: 'poonam.desai@email.com',
    phone: '+91-9876543228',
    address: '852 Law Garden, Ahmedabad',
    emergencyContact: {
      name: 'Raj Desai',
      phone: '+91-9876543229',
      relationship: 'Husband',
    },
    dietaryHabits: 'Vegetarian, Gujarati cuisine',
    allergies: [],
    medicalHistory: 'Osteoarthritis',
    currentMedications: 'Glucosamine, Chondroitin',
    doshaType: 'Vata' as const,
    hospitalId: '', // Will be set after hospitals are created
    dietitianId: '', // Will be set after dietitians are created
    registrationDate: new Date('2024-01-30'),
    lastUpdated: new Date(),
  },
];

async function seedHospitals() {
  console.log('🏥 Seeding hospitals...');

  const createdHospitals = [];
  for (const hospital of sampleHospitals) {
    try {
      const created = await hospitalsService.create(hospital);
      createdHospitals.push(created);
      console.log(`✅ Created hospital: ${hospital.name}`);
    } catch (error) {
      console.error(`❌ Failed to create hospital: ${hospital.name}`, error);
    }
  }
  return createdHospitals;
}

async function seedDietitians(hospitals: any[]) {
  console.log('👨‍⚕️ Seeding dietitians...');

  const hospitalMap = hospitals.reduce((map, h) => {
    map[h.name] = h.id;
    return map;
  }, {} as Record<string, string>);

  const createdDietitians = [];
  for (const dietitian of sampleDietitians) {
    try {
      // Assign hospital based on email domain
      if (dietitian.email.includes('cityayurveda')) {
        dietitian.hospitalId = hospitalMap['City Ayurvedic Hospital'];
      } else if (dietitian.email.includes('regionalayurveda')) {
        dietitian.hospitalId = hospitalMap['Regional Ayurvedic Center'];
      }

      await usersService.create(dietitian);
      createdDietitians.push(dietitian);
      console.log(`✅ Created dietitian: ${dietitian.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to create dietitian: ${dietitian.displayName}`, error);
    }
  }
  return createdDietitians;
}

async function seedPatients(hospitals: any[], dietitians: any[]) {
  console.log('👥 Seeding patients...');

  const hospitalMap = hospitals.reduce((map, h) => {
    map[h.name] = h.id;
    return map;
  }, {} as Record<string, string>);

  const dietitianMap = dietitians.reduce((map, d) => {
    map[d.hospitalId] = map[d.hospitalId] || [];
    map[d.hospitalId].push(d.uid);
    return map;
  }, {} as Record<string, string[]>);

  const createdPatients = [];
  for (let i = 0; i < samplePatients.length; i++) {
    const patient = samplePatients[i];
    try {
      // Assign hospital (alternate between hospitals)
      const hospitalIndex = i % hospitals.length;
      patient.hospitalId = hospitals[hospitalIndex].id;

      // Assign dietitian from the same hospital
      const hospitalDietitians = dietitianMap[patient.hospitalId] || [];
      if (hospitalDietitians.length > 0) {
        patient.dietitianId = hospitalDietitians[i % hospitalDietitians.length];
      }

      // Generate unique code
      const patientWithCode = { ...patient, code: `PAT${Date.now().toString().slice(-6)}${i}` };

      const created = await patientsService.create(patientWithCode);
      createdPatients.push(created);
      console.log(`✅ Created patient: ${patient.name}`);
    } catch (error) {
      console.error(`❌ Failed to create patient: ${patient.name}`, error);
    }
  }
  return createdPatients;
}

async function seedVitals(patients: any[]) {
  console.log('📊 Seeding vitals data...');

  const vitalsData = patients.map((patient, index) => ({
    patientId: patient.id,
    recordedBy: patient.dietitianId || 'system-admin',
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    bloodPressure: {
      systolic: 110 + Math.floor(Math.random() * 40), // 110-150
      diastolic: 70 + Math.floor(Math.random() * 20), // 70-90
    },
    bloodSugar: patient.medicalHistory?.includes('Diabetes') ? {
      fasting: 90 + Math.floor(Math.random() * 60), // 90-150
      postPrandial: 140 + Math.floor(Math.random() * 80), // 140-220
    } : undefined,
    bmi: 18 + Math.random() * 12, // 18-30
    weight: 50 + Math.random() * 40, // 50-90 kg
    height: 150 + Math.random() * 30, // 150-180 cm
    temperature: 36.5 + Math.random() * 1.5, // 36.5-38
    pulse: 60 + Math.floor(Math.random() * 40), // 60-100
    notes: `Routine checkup for ${patient.name}`,
  }));

  for (const vitals of vitalsData) {
    try {
      await vitalsService.create(vitals);
      console.log(`✅ Created vitals for patient ID: ${vitals.patientId}`);
    } catch (error) {
      console.error(`❌ Failed to create vitals for patient ID: ${vitals.patientId}`, error);
    }
  }
}

async function seedConsultations(patients: any[]) {
  console.log('📅 Seeding consultations...');

  const consultationsData = patients.map((patient, index) => ({
    patientId: patient.id,
    dietitianId: patient.dietitianId || 'dietitian-1',
    date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date within last 60 days
    notes: `Initial consultation for ${patient.name}. Patient presented with ${patient.medicalHistory || 'general health concerns'}.`,
    recommendations: `Based on ${patient.doshaType} dosha analysis, recommended dietary modifications and lifestyle changes.`,
    status: (['scheduled', 'completed', 'cancelled'] as const)[Math.floor(Math.random() * 3)],
  }));

  for (const consultation of consultationsData) {
    try {
      await consultationsService.create(consultation);
      console.log(`✅ Created consultation for patient ID: ${consultation.patientId}`);
    } catch (error) {
      console.error(`❌ Failed to create consultation for patient ID: ${consultation.patientId}`, error);
    }
  }
}

async function seedDietPlans(patients: any[]) {
  console.log('🍽️ Seeding diet plans...');

  const dietPlansData = patients.map((patient, index) => ({
    patientId: patient.id,
    dietitianId: patient.dietitianId || 'dietitian-1',
    title: `${patient.doshaType} Balancing Diet Plan`,
    description: `Customized Ayurvedic diet plan for ${patient.name} focusing on ${patient.doshaType} dosha balance.`,
    dietDays: [
      {
        day: 'Monday',
        meals: [
          {
            time: '07:00',
            name: 'Breakfast',
            items: ['Oatmeal with fruits', 'Green tea'],
            notes: 'Warm, grounding breakfast'
          },
          {
            time: '13:00',
            name: 'Lunch',
            items: ['Brown rice', 'Lentil soup', 'Mixed vegetables'],
            notes: 'Balanced midday meal'
          },
          {
            time: '19:00',
            name: 'Dinner',
            items: ['Quinoa', 'Stir-fried vegetables', 'Herbal tea'],
            notes: 'Light evening meal'
          }
        ]
      }
    ],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    isActive: true,
  }));

  for (const dietPlan of dietPlansData) {
    try {
      await dietPlansService.create(dietPlan);
      console.log(`✅ Created diet plan for patient ID: ${dietPlan.patientId}`);
    } catch (error) {
      console.error(`❌ Failed to create diet plan for patient ID: ${dietPlan.patientId}`, error);
    }
  }
}

async function seedTestData() {
  console.log('🌱 Starting comprehensive test data seeding...');

  try {
    // Seed hospitals
    const hospitals = await seedHospitals();

    // Seed dietitians
    const dietitians = await seedDietitians(hospitals);

    // Seed patients
    const patients = await seedPatients(hospitals, dietitians);

    // Seed medical data
    await seedVitals(patients);
    await seedConsultations(patients);
    await seedDietPlans(patients);

    console.log('\n📊 Seeding Summary:');
    console.log(`   🏥 Hospitals: ${hospitals.length}`);
    console.log(`   👨‍⚕️ Dietitians: ${dietitians.length}`);
    console.log(`   👥 Patients: ${patients.length}`);
    console.log(`   📊 Vitals records: ${patients.length}`);
    console.log(`   📅 Consultations: ${patients.length}`);
    console.log(`   🍽️ Diet plans: ${patients.length}`);

    console.log('\n🎉 Test data seeding completed successfully!');

  } catch (error) {
    console.error('💥 Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('✅ All test data seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test data seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestData };