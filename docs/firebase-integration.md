# Firebase Firestore Integration Guide

This guide explains how to use Firebase Firestore as the backend for your SolveAI application.

## Setup

Firebase is already configured in your project. The configuration is in `src/lib/firebase.ts`.

## Firestore Service Functions

The `src/lib/firestore.ts` file provides a comprehensive set of CRUD operations and real-time listeners.

### Generic CRUD Operations

```typescript
import { FirestoreService } from '@/lib/firestore';

// Create a document
const newPatient = await FirestoreService.create('patients', {
  name: 'John Doe',
  age: 30,
  gender: 'Male',
  code: 'PAT001'
});

// Read a document
const patient = await FirestoreService.getById('patients', 'patient-id');

// Read multiple documents
const allPatients = await FirestoreService.getAll('patients');

// Update a document
await FirestoreService.update('patients', 'patient-id', {
  age: 31
});

// Delete a document
await FirestoreService.delete('patients', 'patient-id');
```

### Specific Service Functions

Pre-built services for common operations:

```typescript
import { patientsService, dietPlansService, consultationsService } from '@/lib/firestore';

// Patients
const patients = await patientsService.getAll();
const patient = await patientsService.getById('patient-id');
const newPatient = await patientsService.create({
  name: 'Jane Doe',
  age: 25,
  gender: 'Female',
  code: 'PAT002'
});

// Diet Plans
const dietPlans = await dietPlansService.getByPatient('patient-id');
const newPlan = await dietPlansService.create({
  patientId: 'patient-id',
  dietitianId: 'dietitian-id',
  title: 'Weight Loss Plan',
  description: 'Low calorie diet plan',
  dietDays: [...],
  isActive: true
});

// Consultations
const consultations = await consultationsService.getByPatient('patient-id');
const newConsultation = await consultationsService.create({
  patientId: 'patient-id',
  dietitianId: 'dietitian-id',
  date: new Date(),
  notes: 'Initial consultation',
  recommendations: 'Follow the diet plan',
  status: 'scheduled'
});
```

## Real-time Listeners

Subscribe to real-time updates:

```typescript
import { patientsService } from '@/lib/firestore';

useEffect(() => {
  // Subscribe to all patients
  const unsubscribe = patientsService.subscribe((patients) => {
    setPatients(patients);
  });

  // Subscribe to patients for a specific dietitian
  const unsubscribeFiltered = patientsService.subscribe(
    (patients) => setPatients(patients),
    'dietitian-id'
  );

  return () => {
    unsubscribe();
    unsubscribeFiltered();
  };
}, []);
```

## Firebase Authentication

The `src/lib/auth.ts` file provides authentication functions.

### Basic Authentication

```typescript
import { authService } from '@/lib/auth';

// Sign up
const userCredential = await authService.signUp('email@example.com', 'password', 'Display Name');

// Sign in
const userCredential = await authService.signIn('email@example.com', 'password');

// Sign out
await authService.signOut();

// Reset password
await authService.resetPassword('email@example.com');
```

### Using the Auth Hook

```typescript
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    return <div>Welcome, {user.displayName}!</div>;
  }

  return <div>Please sign in</div>;
}
```

### Listening to Auth State Changes

```typescript
import { authService } from '@/lib/auth';

useEffect(() => {
  const unsubscribe = authService.onAuthStateChange((user) => {
    if (user) {
      console.log('User is signed in:', user.email);
    } else {
      console.log('User is signed out');
    }
  });

  return unsubscribe;
}, []);
```

## Data Models

Define your data models in `src/lib/types.ts`:

```typescript
export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  code: string;
  dietitianId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DietPlan = {
  id: string;
  patientId: string;
  dietitianId: string;
  title: string;
  description: string;
  dietDays: DietDay[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
};

export type Consultation = {
  id: string;
  patientId: string;
  dietitianId: string;
  date: Date;
  notes: string;
  recommendations: string;
  followUpDate?: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
};
```

## Firestore Security Rules

Set up Firestore security rules in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Patients can read/write their own data
    match /patients/{patientId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         request.auth.uid == resource.data.dietitianId);
    }

    // Dietitians can read patients assigned to them
    match /dietPlans/{planId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.dietitianId;
    }

    // Consultations
    match /consultations/{consultationId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.patientId ||
         request.auth.uid == resource.data.dietitianId);
    }
  }
}
```

## Error Handling

All service functions include try-catch blocks and will throw errors that you should handle:

```typescript
try {
  const patients = await patientsService.getAll();
  setPatients(patients);
} catch (error) {
  console.error('Failed to fetch patients:', error);
  // Show error message to user
}
```

## Offline Support

Firestore automatically handles offline data synchronization. When the device comes back online, changes are synced automatically.

## Best Practices

1. **Use TypeScript types** for all data operations
2. **Handle errors gracefully** in your UI
3. **Use real-time listeners** for dynamic data
4. **Implement proper security rules** in production
5. **Use batch operations** for multiple writes
6. **Index fields** that you query frequently

## Example Component

Here's how to use the services in a React component:

```typescript
import { useState, useEffect } from 'react';
import { patientsService } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import type { Patient } from '@/lib/types';

function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates
    const unsubscribe = patientsService.subscribe(
      (patientData) => {
        setPatients(patientData);
        setLoading(false);
      },
      user.uid // Filter by dietitian
    );

    return unsubscribe;
  }, [user]);

  const addPatient = async () => {
    try {
      await patientsService.create({
        name: 'New Patient',
        age: 30,
        gender: 'Male',
        code: 'PAT003',
        dietitianId: user?.uid
      });
    } catch (error) {
      console.error('Failed to add patient:', error);
    }
  };

  if (loading) return <div>Loading patients...</div>;

  return (
    <div>
      <button onClick={addPatient}>Add Patient</button>
      {patients.map(patient => (
        <div key={patient.id}>
          {patient.name} - {patient.code}
        </div>
      ))}
    </div>
  );
}
```

This integration provides a robust, scalable backend solution for your SolveAI application.