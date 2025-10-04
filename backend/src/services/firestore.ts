// Backend Firestore service using Firebase Admin SDK

import { db } from './firebase';

// Generic CRUD functions
export class FirestoreService {
  // Create document
  static async create<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<T> {
    try {
      const collectionRef = db.collection(collectionName);
      const docRef = await collectionRef.add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { ...data, id: docRef.id } as T;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Read single document
  static async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = db.collection(collectionName).doc(id);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Read multiple documents with optional filters
  static async getAll<T>(
    collectionName: string,
    queryBuilder?: (query: any) => any
  ): Promise<T[]> {
    try {
      let query = db.collection(collectionName);

      if (queryBuilder) {
        query = queryBuilder(query);
      }

      const querySnapshot = await query.get();
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Update document
  static async update<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>
  ): Promise<void> {
    try {
      const docRef = db.collection(collectionName).doc(id);
      await docRef.update({
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = db.collection(collectionName).doc(id);
      await docRef.delete();
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }
}

// Specific service functions for common operations
export const patientsService = {
  // Get all patients
  getAll: () => FirestoreService.getAll<Patient>('patients'),

  // Get patient by ID
  getById: (id: string) => FirestoreService.getById<Patient>('patients', id),

  // Get patients by dietitian
  getByDietitian: (dietitianId: string) =>
    FirestoreService.getAll<Patient>('patients', (query) =>
      query.where('dietitianId', '==', dietitianId)
    ),

  // Create patient
  create: (data: Omit<Patient, 'id'>) => FirestoreService.create<Patient>('patients', data),

  // Update patient
  update: (id: string, data: Partial<Omit<Patient, 'id'>>) =>
    FirestoreService.update<Patient>('patients', id, data),

  // Delete patient
  delete: (id: string) => FirestoreService.delete('patients', id),
};

// Specific service functions for hospitals
export const hospitalsService = {
  // Get all hospitals
  getAll: () => FirestoreService.getAll<Hospital>('hospitals'),

  // Get hospital by ID
  getById: (id: string) => FirestoreService.getById<Hospital>('hospitals', id),

  // Create hospital
  create: (data: Omit<Hospital, 'id'>) => FirestoreService.create<Hospital>('hospitals', data),

  // Update hospital
  update: (id: string, data: Partial<Omit<Hospital, 'id'>>) =>
    FirestoreService.update<Hospital>('hospitals', id, data),

  // Delete hospital
  delete: (id: string) => FirestoreService.delete('hospitals', id),
};

// Specific service functions for users
export const usersService = {
  // Get all users
  getAll: () => FirestoreService.getAll<User>('users'),

  // Get user by ID (uid)
  getById: (uid: string) => FirestoreService.getById<User>('users', uid),

  // Get users by role
  getByRole: (role: User['role']) =>
    FirestoreService.getAll<User>('users', (query) => query.where('role', '==', role)),

  // Get users by hospital
  getByHospital: (hospitalId: string) =>
    FirestoreService.getAll<User>('users', (query) => query.where('hospitalId', '==', hospitalId)),

  // Create user (uid as document ID)
  create: async (data: Omit<User, 'id'>) => {
    try {
      const collectionRef = db.collection('users');
      await collectionRef.doc(data.uid).set({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { ...data, id: data.uid } as User;
    } catch (error) {
      console.error(`Error creating user ${data.uid}:`, error);
      throw error;
    }
  },

  // Update user
  update: (uid: string, data: Partial<Omit<User, 'uid'>>) =>
    FirestoreService.update<User>('users', uid, data),

  // Delete user
  delete: (uid: string) => FirestoreService.delete('users', uid),
};

// Specific service functions for vitals
export const vitalsService = {
  // Get all vitals for a patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<Vitals>('vitals', (query) =>
      query.where('patientId', '==', patientId).orderBy('date', 'desc')
    ),

  // Create vitals record
  create: (data: Omit<Vitals, 'id'>) => FirestoreService.create<Vitals>('vitals', data),

  // Update vitals record
  update: (id: string, data: Partial<Omit<Vitals, 'id'>>) =>
    FirestoreService.update<Vitals>('vitals', id, data),

  // Delete vitals record
  delete: (id: string) => FirestoreService.delete('vitals', id),
};

// Specific service functions for consultations
export const consultationsService = {
  // Get all consultations
  getAll: () => FirestoreService.getAll<Consultation>('consultations', (query) => query.orderBy('date', 'desc')),

  // Get consultations for a patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<Consultation>('consultations', (query) =>
      query.where('patientId', '==', patientId).orderBy('date', 'desc')
    ),

  // Get consultations for a dietitian
  getByDietitian: (dietitianId: string) =>
    FirestoreService.getAll<Consultation>('consultations', (query) =>
      query.where('dietitianId', '==', dietitianId).orderBy('date', 'desc')
    ),

  // Create consultation
  create: (data: Omit<Consultation, 'id'>) => FirestoreService.create<Consultation>('consultations', data),

  // Update consultation
  update: (id: string, data: Partial<Omit<Consultation, 'id'>>) =>
    FirestoreService.update<Consultation>('consultations', id, data),
};

// Specific service functions for diet plans
export const dietPlansService = {
  // Get all diet plans
  getAll: () => FirestoreService.getAll<DietPlan>('dietPlans', (query) => query.orderBy('createdAt', 'desc')),

  // Get all diet plans for a patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<DietPlan>('dietPlans', (query) =>
      query.where('patientId', '==', patientId).orderBy('createdAt', 'desc')
    ),

  // Create diet plan
  create: (data: Omit<DietPlan, 'id'>) => FirestoreService.create<DietPlan>('dietPlans', data),

  // Update diet plan
  update: (id: string, data: Partial<Omit<DietPlan, 'id'>>) =>
    FirestoreService.update<DietPlan>('dietPlans', id, data),

  // Delete diet plan
  delete: (id: string) => FirestoreService.delete('dietPlans', id),
};

// Type definitions (simplified for backend)
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  dietaryHabits?: string;
  allergies?: string[];
  medicalHistory?: string;
  currentMedications?: string;
  doshaType?: 'Vata' | 'Pitta' | 'Kapha' | 'Mixed';
  hospitalId?: string;
  dietitianId?: string;
  registrationDate: Date;
  lastUpdated: Date;
}

interface User {
  id: string; // Using id for consistency with other entities
  uid: string;
  email: string;
  displayName: string;
  role: 'patient' | 'dietitian' | 'hospital-admin';
  hospitalId?: string;
  patientId?: string;
  createdAt: Date;
  lastLogin: Date;
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  adminId: string;
  createdAt: Date;
}

interface Vitals {
  id: string;
  patientId: string;
  recordedBy: string;
  date: Date;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar?: {
    fasting: number;
    postPrandial?: number;
  };
  thyroid?: {
    tsh: number;
    t3?: number;
    t4?: number;
  };
  cholesterol?: {
    total: number;
    hdl: number;
    ldl: number;
    triglycerides: number;
  };
  bmi: number;
  weight: number;
  height: number;
  temperature?: number;
  pulse?: number;
  notes?: string;
}

interface Consultation {
  id: string;
  patientId: string;
  dietitianId: string;
  date: Date;
  notes: string;
  recommendations: string;
  followUpDate?: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface DietPlan {
  id: string;
  patientId: string;
  dietitianId: string;
  title: string;
  description: string;
  dietDays: any[]; // Simplified for backend
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}