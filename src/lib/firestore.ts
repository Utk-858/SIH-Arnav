// Firestore service functions for CRUD operations

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

// Generic CRUD functions
export class FirestoreService {
  // Create document
  static async create<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<T> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
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
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
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
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
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
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listener
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = [],
    onError?: (error: Error) => void
  ): () => void {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        callback(data);
      },
      (error) => {
        console.error(`Error in real-time listener for ${collectionName}:`, error);
        onError?.(error);
      }
    );
    return unsubscribe;
  }

  // Real-time listener for single document
  static subscribeToDocument<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const docRef = doc(db, collectionName, id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          callback({ id: docSnapshot.id, ...docSnapshot.data() } as T);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`Error in real-time listener for document ${id} in ${collectionName}:`, error);
        onError?.(error);
      }
    );
    return unsubscribe;
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
    FirestoreService.getAll<Patient>('patients', [where('dietitianId', '==', dietitianId)]),

  // Create patient
  create: (data: Omit<Patient, 'id'>) => FirestoreService.create<Patient>('patients', data),

  // Update patient
  update: (id: string, data: Partial<Omit<Patient, 'id'>>) =>
    FirestoreService.update<Patient>('patients', id, data),

  // Delete patient
  delete: (id: string) => FirestoreService.delete('patients', id),

  // Subscribe to patients (real-time)
  subscribe: (callback: (patients: Patient[]) => void, dietitianId?: string) => {
    const constraints = dietitianId ? [where('dietitianId', '==', dietitianId)] : [];
    return FirestoreService.subscribeToCollection<Patient>('patients', callback, constraints);
  },
};

export const dietPlansService = {
  // Get all diet plans
  getAll: () => FirestoreService.getAll<DietPlan>('dietPlans', [orderBy('createdAt', 'desc')]),

  // Get all diet plans for a patient
  getByPatient: async (patientId: string) => {
    // Use fallback query without orderBy to avoid requiring composite index
    const allPlans = await FirestoreService.getAll<DietPlan>('dietPlans', [
      where('patientId', '==', patientId)
    ]);

    // Sort client-side (descending order by createdAt)
    return allPlans.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date((a.createdAt as any)?.seconds * 1000 || 0);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date((b.createdAt as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Create diet plan
  create: (data: Omit<DietPlan, 'id'>) => FirestoreService.create<DietPlan>('dietPlans', data),

  // Update diet plan
  update: (id: string, data: Partial<Omit<DietPlan, 'id'>>) =>
    FirestoreService.update<DietPlan>('dietPlans', id, data),

  // Delete diet plan
  delete: (id: string) => FirestoreService.delete('dietPlans', id),
};

export const consultationsService = {
  // Get all consultations
  getAll: () => FirestoreService.getAll<Consultation>('consultations', [orderBy('date', 'desc')]),

  // Get consultations for a patient
  getByPatient: async (patientId: string) => {
    const allConsultations = await FirestoreService.getAll<Consultation>('consultations', [
      where('patientId', '==', patientId)
    ]);

    // Sort client-side (descending order by date)
    return allConsultations.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date((a.date as any)?.seconds * 1000 || 0);
      const dateB = b.date instanceof Date ? b.date : new Date((b.date as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get consultations for a dietitian
  getByDietitian: async (dietitianId: string) => {
    const allConsultations = await FirestoreService.getAll<Consultation>('consultations', [
      where('dietitianId', '==', dietitianId)
    ]);

    // Sort client-side (descending order by date)
    return allConsultations.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date((a.date as any)?.seconds * 1000 || 0);
      const dateB = b.date instanceof Date ? b.date : new Date((b.date as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Create consultation
  create: (data: Omit<Consultation, 'id'>) => FirestoreService.create<Consultation>('consultations', data),

  // Update consultation
  update: (id: string, data: Partial<Omit<Consultation, 'id'>>) =>
    FirestoreService.update<Consultation>('consultations', id, data),
};

export const messMenusService = {
  // Get all mess menus for a hospital
  getByHospital: async (hospitalId: string) => {
    const allMenus = await FirestoreService.getAll<MessMenu>('messMenus', [
      where('hospitalId', '==', hospitalId)
    ]);

    // Sort client-side (descending order by date)
    return allMenus.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date((a.date as any)?.seconds * 1000 || 0);
      const dateB = b.date instanceof Date ? b.date : new Date((b.date as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get today's mess menu for a hospital
  getTodayMenu: async (hospitalId: string) => {
    // Get all active menus for the hospital and filter client-side to avoid index requirements
    const allMenus = await FirestoreService.getAll<MessMenu>('messMenus', [
      where('hospitalId', '==', hospitalId),
      where('isActive', '==', true)
    ]);

    // Filter for today's date on the client side
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allMenus.filter(menu => {
      let menuDate: Date;
      if (menu.date instanceof Date) {
        menuDate = menu.date;
      } else if (menu.date && typeof menu.date === 'object' && 'seconds' in menu.date) {
        // Firestore Timestamp
        menuDate = new Date((menu.date as any).seconds * 1000);
      } else {
        return false; // Invalid date
      }
      return menuDate >= today && menuDate < tomorrow;
    });
  },

  // Create mess menu
  create: (data: Omit<MessMenu, 'id'>) => FirestoreService.create<MessMenu>('messMenus', data),

  // Update mess menu
  update: (id: string, data: Partial<Omit<MessMenu, 'id'>>) =>
    FirestoreService.update<MessMenu>('messMenus', id, data),

  // Delete mess menu
  delete: (id: string) => FirestoreService.delete('messMenus', id),

  // Deactivate old menus and activate new one
  async setActiveMenu(hospitalId: string, menuId: string): Promise<void> {
    try {
      // First, deactivate all active menus for this hospital
      const activeMenus = await FirestoreService.getAll<MessMenu>('messMenus', [
        where('hospitalId', '==', hospitalId),
        where('isActive', '==', true)
      ]);

      // Deactivate all active menus
      const deactivatePromises = activeMenus.map(menu =>
        FirestoreService.update<MessMenu>('messMenus', menu.id, { isActive: false })
      );
      await Promise.all(deactivatePromises);

      // Activate the new menu
      await FirestoreService.update<MessMenu>('messMenus', menuId, { isActive: true });
    } catch (error) {
      console.error('Error setting active menu:', error);
      throw error;
    }
  },
};

export const vitalsService = {
  // Get all vitals for a patient
  getByPatient: async (patientId: string) => {
    // Use fallback query without orderBy to avoid requiring composite index
    const allVitals = await FirestoreService.getAll<Vitals>('vitals', [
      where('patientId', '==', patientId)
    ]);

    // Sort client-side (descending order by date)
    return allVitals.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date((a.date as any)?.seconds * 1000 || 0);
      const dateB = b.date instanceof Date ? b.date : new Date((b.date as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get latest vitals for a patient
  getLatest: (patientId: string) =>
    FirestoreService.getAll<Vitals>('vitals', [
      where('patientId', '==', patientId),
      orderBy('date', 'desc'),
      limit(1)
    ]),

  // Create vitals record
  create: (data: Omit<Vitals, 'id'>) => FirestoreService.create<Vitals>('vitals', data),

  // Update vitals record
  update: (id: string, data: Partial<Omit<Vitals, 'id'>>) =>
    FirestoreService.update<Vitals>('vitals', id, data),

  // Delete vitals record
  delete: (id: string) => FirestoreService.delete('vitals', id),
};

export const mealTrackingService = {
  // Get all meal tracking records for a patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<MealTracking>('mealTracking', [
      where('patientId', '==', patientId),
      orderBy('scheduledDate', 'desc')
    ]),

  // Get meal tracking for a specific date range
  getByDateRange: async (patientId: string, startDate: Date, endDate: Date) => {
    // Fetch all meal tracking for the patient without date filter to avoid index requirement
    const allTracking = await FirestoreService.getAll<MealTracking>('mealTracking', [
      where('patientId', '==', patientId)
    ]);

    // Filter by date range client-side
    const filtered = allTracking.filter(tracking => {
      const scheduledDate = tracking.scheduledDate instanceof Date
        ? tracking.scheduledDate
        : new Date((tracking.scheduledDate as any)?.seconds * 1000 || 0);
      return scheduledDate >= startDate && scheduledDate <= endDate;
    });

    // Sort by scheduledDate descending
    return filtered.sort((a, b) => {
      const dateA = a.scheduledDate instanceof Date ? a.scheduledDate : new Date((a.scheduledDate as any)?.seconds * 1000 || 0);
      const dateB = b.scheduledDate instanceof Date ? b.scheduledDate : new Date((b.scheduledDate as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get today's meal tracking for a patient
  getTodayMeals: async (patientId: string) => {
    // Use client-side filtering to avoid requiring composite index
    const allTracking = await FirestoreService.getAll<MealTracking>('mealTracking', [
      where('patientId', '==', patientId)
    ]);

    // Filter for today's date on the client side
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allTracking.filter(tracking => {
      const scheduledDate = tracking.scheduledDate instanceof Date
        ? tracking.scheduledDate
        : new Date((tracking.scheduledDate as any)?.seconds * 1000 || 0);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  },

  // Create meal tracking record
  create: (data: Omit<MealTracking, 'id'>) => FirestoreService.create<MealTracking>('mealTracking', data),

  // Update meal tracking record
  update: (id: string, data: Partial<Omit<MealTracking, 'id'>>) =>
    FirestoreService.update<MealTracking>('mealTracking', id, data),

  // Mark meal as given
  markAsGiven: (id: string, givenBy: string, notes?: string) =>
    FirestoreService.update<MealTracking>('mealTracking', id, {
      givenBy,
      givenAt: new Date(),
      status: 'given',
      ...(notes && { notes })
    }),

  // Mark meal as eaten
  markAsEaten: (id: string, eatenBy: 'patient' | 'family', quantity?: 'full' | 'half' | 'quarter' | 'none', notes?: string) =>
    FirestoreService.update<MealTracking>('mealTracking', id, {
      eatenBy,
      eatenAt: new Date(),
      quantity,
      status: quantity === 'none' ? 'skipped' : 'eaten',
      ...(notes && { notes })
    }),

  // Delete meal tracking record
  delete: (id: string) => FirestoreService.delete('mealTracking', id),

  // Subscribe to meal tracking updates for a patient
  subscribe: (patientId: string, callback: (meals: MealTracking[]) => void) => {
    const unsubscribe = FirestoreService.subscribeToCollection<MealTracking>(
      'mealTracking',
      (meals) => {
        // Sort client-side to avoid requiring composite index
        const sortedMeals = meals
          .filter(meal => meal.patientId === patientId)
          .sort((a, b) => {
            const dateA = a.scheduledDate instanceof Date ? a.scheduledDate : new Date((a.scheduledDate as any)?.seconds * 1000 || 0);
            const dateB = b.scheduledDate instanceof Date ? b.scheduledDate : new Date((b.scheduledDate as any)?.seconds * 1000 || 0);
            return dateB.getTime() - dateA.getTime();
          });
        callback(sortedMeals);
      },
      [where('patientId', '==', patientId)]
    );
    return unsubscribe;
  },
};

export const patientFeedbackService = {
  // Get all feedback for a patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<PatientFeedback>('patientFeedback', [
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    ]),

  // Get feedback for a date range
  getByDateRange: (patientId: string, startDate: Date, endDate: Date) =>
    FirestoreService.getAll<PatientFeedback>('patientFeedback', [
      where('patientId', '==', patientId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    ]),

  // Get today's feedback for a patient
  getTodayFeedback: (patientId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return FirestoreService.getAll<PatientFeedback>('patientFeedback', [
      where('patientId', '==', patientId),
      where('date', '>=', today),
      where('date', '<', tomorrow)
    ]);
  },

  // Create patient feedback
  create: (data: Omit<PatientFeedback, 'id'>) => FirestoreService.create<PatientFeedback>('patientFeedback', data),

  // Update patient feedback
  update: (id: string, data: Partial<Omit<PatientFeedback, 'id'>>) =>
    FirestoreService.update<PatientFeedback>('patientFeedback', id, data),

  // Delete patient feedback
  delete: (id: string) => FirestoreService.delete('patientFeedback', id),

  // Subscribe to feedback updates for a patient
  subscribe: (patientId: string, callback: (feedback: PatientFeedback[]) => void) =>
    FirestoreService.subscribeToCollection<PatientFeedback>(
      'patientFeedback',
      callback,
      [where('patientId', '==', patientId), orderBy('date', 'desc')]
    ),
};

export const usersService = {
  // Get all users
  getAll: () => FirestoreService.getAll<User>('users'),

  // Get user by ID (uid)
  getById: (uid: string) => FirestoreService.getById<User>('users', uid),

  // Get users by role
  getByRole: (role: User['role']) =>
    FirestoreService.getAll<User>('users', [where('role', '==', role)]),

  // Get users by hospital
  getByHospital: (hospitalId: string) =>
    FirestoreService.getAll<User>('users', [where('hospitalId', '==', hospitalId)]),

  // Create user (uid as document ID)
  create: async (data: User) => {
    const docRef = doc(db, 'users', data.uid);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.fromDate(data.createdAt),
      lastLogin: Timestamp.fromDate(data.lastLogin),
    });
    return data;
  },

  // Update user
  update: async (uid: string, data: Partial<Omit<User, 'uid'>>) => {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  },

  // Delete user
  delete: (uid: string) => FirestoreService.delete('users', uid),

  // Subscribe to users
  subscribe: (callback: (users: User[]) => void, constraints?: QueryConstraint[]) =>
    FirestoreService.subscribeToCollection<User>('users', callback, constraints || []),
};

export const hospitalsService = {
  // Get all hospitals
  getAll: () => FirestoreService.getAll<Hospital>('hospitals'),

  // Get hospital by ID
  getById: (id: string) => FirestoreService.getById<Hospital>('hospitals', id),

  // Get hospitals by admin
  getByAdmin: (adminId: string) =>
    FirestoreService.getAll<Hospital>('hospitals', [where('adminId', '==', adminId)]),

  // Create hospital
  create: async (data: Omit<Hospital, 'id'>) => {
    const docRef = await addDoc(collection(db, 'hospitals'), {
      ...data,
      createdAt: Timestamp.fromDate(data.createdAt),
    });
    return { ...data, id: docRef.id } as Hospital;
  },

  // Update hospital
  update: (id: string, data: Partial<Omit<Hospital, 'id'>>) =>
    FirestoreService.update<Hospital>('hospitals', id, data),

  // Delete hospital
  delete: (id: string) => FirestoreService.delete('hospitals', id),

  // Subscribe to hospitals
  subscribe: (callback: (hospitals: Hospital[]) => void, constraints?: QueryConstraint[]) =>
    FirestoreService.subscribeToCollection<Hospital>('hospitals', callback, constraints || []),
};

// Food database service for Ayurvedic food items
export const foodDatabaseService = {
  // Get all food items
  getAll: () => FirestoreService.getAll<FoodItem>('foodDatabase', [orderBy('name', 'asc')]),

  // Get food items by category
  getByCategory: (category: FoodItem['category']) =>
    FirestoreService.getAll<FoodItem>('foodDatabase', [
      where('category', '==', category),
      orderBy('name', 'asc')
    ]),

  // Search food items by name
  searchByName: (searchTerm: string) =>
    FirestoreService.getAll<FoodItem>('foodDatabase', [
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name', 'asc')
    ]),

  // Get food items suitable for a dosha
  getByDoshaSuitability: (dosha: 'Vata' | 'Pitta' | 'Kapha') =>
    FirestoreService.getAll<FoodItem>('foodDatabase', [
      where(`doshaSuitability.${dosha}`, '==', true),
      orderBy('name', 'asc')
    ]),

  // Get alternatives for a food item
  getAlternatives: async (foodId: string) => {
    const foodItem = await FirestoreService.getById<FoodItem>('foodDatabase', foodId);
    if (!foodItem || !foodItem.commonAlternatives) return [];

    // Get alternative food items
    const alternatives = await Promise.all(
      foodItem.commonAlternatives.map(altId =>
        FirestoreService.getById<FoodItem>('foodDatabase', altId)
      )
    );

    return alternatives.filter(alt => alt !== null) as FoodItem[];
  },

  // Create food item
  create: (data: Omit<FoodItem, 'id'>) => FirestoreService.create<FoodItem>('foodDatabase', data),

  // Update food item
  update: (id: string, data: Partial<Omit<FoodItem, 'id'>>) =>
    FirestoreService.update<FoodItem>('foodDatabase', id, data),

  // Delete food item
  delete: (id: string) => FirestoreService.delete('foodDatabase', id),
};

// Sample data seeding functions for development
export const seedData = {
  async seedHospitals(): Promise<Hospital[]> {
    const sampleHospitals = [
      {
        name: 'City General Hospital',
        address: '123 Main Street, City, State 12345',
        phone: '+1-555-0123',
        email: 'admin@citygeneral.com',
        adminId: 'hospital-admin-uid-1',
        createdAt: new Date(),
      },
      {
        name: 'Regional Medical Center',
        address: '456 Health Ave, Town, State 67890',
        phone: '+1-555-0456',
        email: 'admin@regionalmed.com',
        adminId: 'hospital-admin-uid-2',
        createdAt: new Date(),
      },
      {
        name: 'Ayurveda Wellness Center',
        address: '789 Harmony Blvd, Wellness City, State 11111',
        phone: '+1-555-0789',
        email: 'admin@ayurvedacenter.com',
        adminId: 'hospital-admin-uid-3',
        createdAt: new Date(),
      },
    ];

    const createdHospitals: Hospital[] = [];
    for (const hospital of sampleHospitals) {
      try {
        const created = await hospitalsService.create(hospital);
        createdHospitals.push(created);
        console.log(`✅ Seeded hospital: ${hospital.name}`);
      } catch (error) {
        console.error(`❌ Error seeding hospital ${hospital.name}:`, error);
      }
    }
    return createdHospitals;
  },

  async seedUsers(hospitals: Hospital[]) {
    const hospitalMap = hospitals.reduce((map, h) => {
      map[h.name] = h.id;
      return map;
    }, {} as Record<string, string>);

    const sampleUsers = [
      // Hospital Admins
      {
        uid: 'hospital-admin-uid-1',
        email: 'admin@citygeneral.com',
        displayName: 'Dr. Sarah Johnson',
        role: 'hospital-admin' as const,
        hospitalId: hospitalMap['City General Hospital'],
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'hospital-admin-uid-2',
        email: 'admin@regionalmed.com',
        displayName: 'Dr. Robert Davis',
        role: 'hospital-admin' as const,
        hospitalId: hospitalMap['Regional Medical Center'],
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'hospital-admin-uid-3',
        email: 'admin@ayurvedacenter.com',
        displayName: 'Dr. Priya Sharma',
        role: 'hospital-admin' as const,
        hospitalId: hospitalMap['Ayurveda Wellness Center'],
        createdAt: new Date(),
        lastLogin: new Date(),
      },

      // Dietitians
      {
        uid: 'dietitian-uid-1',
        email: 'dietitian@citygeneral.com',
        displayName: 'Dr. Michael Chen',
        role: 'dietitian' as const,
        hospitalId: hospitalMap['City General Hospital'],
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'dietitian-uid-2',
        email: 'dietitian@regionalmed.com',
        displayName: 'Dr. Emily Rodriguez',
        role: 'dietitian' as const,
        hospitalId: hospitalMap['Regional Medical Center'],
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'dietitian-uid-3',
        email: 'dietitian@ayurvedacenter.com',
        displayName: 'Dr. Arjun Patel',
        role: 'dietitian' as const,
        hospitalId: hospitalMap['Ayurveda Wellness Center'],
        createdAt: new Date(),
        lastLogin: new Date(),
      },

      // Patients
      {
        uid: 'patient-uid-1',
        email: 'alice.smith@email.com',
        displayName: 'Alice Smith',
        role: 'patient' as const,
        hospitalId: hospitalMap['City General Hospital'],
        patientId: 'PAT001',
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'patient-uid-2',
        email: 'bob.wilson@email.com',
        displayName: 'Bob Wilson',
        role: 'patient' as const,
        hospitalId: hospitalMap['Regional Medical Center'],
        patientId: 'PAT002',
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'patient-uid-3',
        email: 'carol.brown@email.com',
        displayName: 'Carol Brown',
        role: 'patient' as const,
        hospitalId: hospitalMap['Ayurveda Wellness Center'],
        patientId: 'PAT003',
        createdAt: new Date(),
        lastLogin: new Date(),
      },
      {
        uid: 'patient-uid-4',
        email: 'david.lee@email.com',
        displayName: 'David Lee',
        role: 'patient' as const,
        hospitalId: hospitalMap['City General Hospital'],
        patientId: 'PAT004',
        createdAt: new Date(),
        lastLogin: new Date(),
      },
    ];

    for (const user of sampleUsers) {
      try {
        await usersService.create(user);
        console.log(`✅ Seeded user: ${user.displayName} (${user.role})`);
      } catch (error) {
        console.error(`❌ Error seeding user ${user.displayName}:`, error);
      }
    }
  },

  async seedPatients() {
    const samplePatients = [
      {
        name: 'Alice Smith',
        code: 'PAT001',
        age: 28,
        gender: 'Female' as const,
        phone: '+1-555-1001',
        email: 'alice.smith@email.com',
        address: '123 Oak Street, City, State 12345',
        registrationDate: new Date(),
        lastUpdated: new Date(),
        dietaryHabits: 'Vegetarian, avoids dairy',
        allergies: ['Nuts', 'Shellfish'],
        doshaType: 'Vata' as const,
        emergencyContact: {
          name: 'John Smith',
          phone: '+1-555-2001',
          relationship: 'Spouse'
        },
        hospitalId: '', // Will be set after hospitals are created
        dietitianId: '',
      },
      {
        name: 'Bob Wilson',
        code: 'PAT002',
        age: 35,
        gender: 'Male' as const,
        phone: '+1-555-1002',
        email: 'bob.wilson@email.com',
        address: '456 Pine Avenue, Town, State 67890',
        registrationDate: new Date(),
        lastUpdated: new Date(),
        dietaryHabits: 'Non-vegetarian, low carb',
        allergies: ['Gluten'],
        doshaType: 'Pitta' as const,
        emergencyContact: {
          name: 'Mary Wilson',
          phone: '+1-555-2002',
          relationship: 'Wife'
        },
        hospitalId: '',
        dietitianId: '',
      },
      {
        name: 'Carol Brown',
        code: 'PAT003',
        age: 42,
        gender: 'Female' as const,
        phone: '+1-555-1003',
        email: 'carol.brown@email.com',
        address: '789 Elm Drive, Village, State 11111',
        registrationDate: new Date(),
        lastUpdated: new Date(),
        dietaryHabits: 'Vegan, gluten-free',
        allergies: ['Dairy', 'Soy'],
        doshaType: 'Kapha' as const,
        emergencyContact: {
          name: 'Tom Brown',
          phone: '+1-555-2003',
          relationship: 'Brother'
        },
        hospitalId: '',
        dietitianId: '',
      },
      {
        name: 'David Lee',
        code: 'PAT004',
        age: 31,
        gender: 'Male' as const,
        phone: '+1-555-1004',
        email: 'david.lee@email.com',
        address: '321 Maple Lane, County, State 22222',
        registrationDate: new Date(),
        lastUpdated: new Date(),
        dietaryHabits: 'Omnivore, prefers traditional foods',
        allergies: [],
        doshaType: 'Vata' as const,
        emergencyContact: {
          name: 'Lisa Lee',
          phone: '+1-555-2004',
          relationship: 'Sister'
        },
        hospitalId: '',
        dietitianId: '',
      },
    ];

    const createdPatients: Patient[] = [];
    for (const patient of samplePatients) {
      try {
        const created = await patientsService.create({
          ...patient,
          lastUpdated: new Date()
        });
        createdPatients.push(created);
        console.log(`✅ Seeded patient: ${patient.name} (${patient.code})`);
      } catch (error) {
        console.error(`❌ Error seeding patient ${patient.name}:`, error);
      }
    }
    return createdPatients;
  },

  async seedVitals(patients: Patient[]) {
    const sampleVitals = [];

    for (const patient of patients) {
      // Create multiple vitals records for each patient
      const vitalsRecords = [
        {
          patientId: patient.id,
          recordedBy: 'nurse-001',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          weight: patient.code === 'PAT001' ? 65.5 : patient.code === 'PAT002' ? 78.2 : patient.code === 'PAT003' ? 72.1 : 69.8,
          height: 165,
          bmi: patient.code === 'PAT001' ? 24.1 : patient.code === 'PAT002' ? 26.8 : patient.code === 'PAT003' ? 25.2 : 23.9,
          bloodPressure: { systolic: 120, diastolic: 80 },
          temperature: 98.6,
          pulse: 72,
          notes: 'Regular checkup - all normal',
        },
        {
          patientId: patient.id,
          recordedBy: 'nurse-001',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          weight: patient.code === 'PAT001' ? 65.2 : patient.code === 'PAT002' ? 77.9 : patient.code === 'PAT003' ? 71.8 : 69.5,
          height: 165,
          bmi: patient.code === 'PAT001' ? 23.9 : patient.code === 'PAT002' ? 26.5 : patient.code === 'PAT003' ? 25.0 : 23.7,
          bloodPressure: { systolic: 118, diastolic: 78 },
          temperature: 98.4,
          pulse: 70,
          notes: 'Improving trends observed',
        },
        {
          patientId: patient.id,
          recordedBy: 'nurse-001',
          date: new Date(), // Today
          weight: patient.code === 'PAT001' ? 64.8 : patient.code === 'PAT002' ? 77.5 : patient.code === 'PAT003' ? 71.5 : 69.2,
          height: 165,
          bmi: patient.code === 'PAT001' ? 23.7 : patient.code === 'PAT002' ? 26.2 : patient.code === 'PAT003' ? 24.8 : 23.5,
          bloodPressure: { systolic: 115, diastolic: 75 },
          temperature: 98.2,
          pulse: 68,
          notes: 'Excellent progress - following diet plan well',
        },
      ];

      sampleVitals.push(...vitalsRecords);
    }

    for (const vitals of sampleVitals) {
      try {
        await vitalsService.create(vitals);
        console.log(`✅ Seeded vitals for patient ${vitals.patientId}`);
      } catch (error) {
        console.error(`❌ Error seeding vitals for patient ${vitals.patientId}:`, error);
      }
    }
  },

  async seedPatientFeedback(patients: Patient[]) {
    const feedbackData = [];

    for (const patient of patients) {
      // Create feedback for the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

        feedbackData.push({
          patientId: patient.id,
          dietPlanId: `diet-plan-${patient.id}`,
          date: date,
          mealAdherence: {
            breakfast: Math.random() > 0.2,
            lunch: Math.random() > 0.15,
            dinner: Math.random() > 0.25,
            snacks: Math.random() > 0.3,
          },
          symptoms: i === 0 ? ['Slight headache'] : i === 2 ? ['Mild fatigue'] : [],
          energyLevel: (Math.floor(Math.random() * 3) + 3) as 1 | 2 | 3 | 4 | 5, // 3-5
          digestion: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] as any,
          waterIntake: Math.floor(Math.random() * 4) + 6, // 6-10 glasses
          sleepQuality: (Math.floor(Math.random() * 2) + 4) as 1 | 2 | 3 | 4 | 5, // 4-5
          overallFeeling: ['better', 'same', 'much_better'][Math.floor(Math.random() * 3)] as any,
          ...(i === 0 && { additionalNotes: 'Feeling more energetic after following the diet plan' }),
        });
      }
    }

    for (const feedback of feedbackData) {
      try {
        await patientFeedbackService.create(feedback);
        console.log(`✅ Seeded feedback for patient ${feedback.patientId}`);
      } catch (error) {
        console.error(`❌ Error seeding feedback for patient ${feedback.patientId}:`, error);
      }
    }
  },

  async seedDietPlans(patients: Patient[]) {
    const dietPlans = [];

    for (const patient of patients) {
      const basePlan = {
        patientId: patient.id,
        dietitianId: patient.hospitalId === 'city-general' ? 'dietitian-uid-1' : 'dietitian-uid-2',
        title: `Ayurvedic Diet Plan for ${patient.name}`,
        description: `Personalized Ayurvedic diet plan based on ${patient.doshaType} constitution and health goals.`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        dietDays: [
          {
            day: 'Monday',
            meals: [
              {
                name: 'Breakfast',
                time: '7:00 AM',
                items: ['Poha', 'Green Tea', 'Fresh Fruits'],
                notes: 'Light and energizing start to the day'
              },
              {
                name: 'Lunch',
                time: '12:30 PM',
                items: ['Khichdi', 'Mixed Vegetables', 'Buttermilk'],
                notes: 'Balanced and nourishing midday meal'
              },
              {
                name: 'Dinner',
                time: '7:00 PM',
                items: ['Roti', 'Moong Dal', 'Steamed Vegetables'],
                notes: 'Light evening meal for good digestion'
              }
            ]
          },
          {
            day: 'Tuesday',
            meals: [
              {
                name: 'Breakfast',
                time: '7:00 AM',
                items: ['Upma', 'Herbal Tea', 'Seasonal Fruits'],
                notes: 'Warming and grounding breakfast'
              },
              {
                name: 'Lunch',
                time: '12:30 PM',
                items: ['Rice', 'Sambar', 'Cucumber Raita'],
                notes: 'Traditional South Indian balanced meal'
              },
              {
                name: 'Dinner',
                time: '7:00 PM',
                items: ['Chapati', 'Paneer Curry', 'Salad'],
                notes: 'Protein-rich evening meal'
              }
            ]
          }
        ]
      };

      dietPlans.push(basePlan);
    }

    for (const plan of dietPlans) {
      try {
        await dietPlansService.create(plan);
        console.log(`✅ Seeded diet plan for patient ${plan.patientId}`);
      } catch (error) {
        console.error(`❌ Error seeding diet plan for patient ${plan.patientId}:`, error);
      }
    }
  },

  async seedAll() {
    console.log('🚀 Starting comprehensive data seeding...');

    try {
      // 1. Seed hospitals first
      console.log('\n🏥 Seeding hospitals...');
      const hospitals = await this.seedHospitals();

      // 2. Update hospital IDs in sample data
      const hospitalMap = hospitals.reduce((map, h) => {
        map[h.name] = h.id;
        return map;
      }, {} as Record<string, string>);

      // 3. Seed users
      console.log('\n👥 Seeding users...');
      await this.seedUsers(hospitals);

      // 4. Seed patients
      console.log('\n👤 Seeding patients...');
      const patients = await this.seedPatients();

      // Update patient hospital and dietitian IDs
      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const hospitalId = i < 2 ? hospitalMap['City General Hospital'] :
                          i < 3 ? hospitalMap['Regional Medical Center'] :
                          hospitalMap['Ayurveda Wellness Center'];

        await patientsService.update(patient.id, {
          hospitalId,
          dietitianId: hospitalId === hospitalMap['City General Hospital'] ? 'dietitian-uid-1' :
                       hospitalId === hospitalMap['Regional Medical Center'] ? 'dietitian-uid-2' :
                       'dietitian-uid-3'
        });
      }

      // 5. Seed vitals
      console.log('\n📊 Seeding vitals...');
      await this.seedVitals(patients);

      // 6. Seed patient feedback
      console.log('\n💬 Seeding patient feedback...');
      await this.seedPatientFeedback(patients);

      // 7. Seed diet plans
      console.log('\n🍽️ Seeding diet plans...');
      await this.seedDietPlans(patients);

      console.log('\n🎉 Data seeding completed successfully!');
      console.log(`📋 Summary:`);
      console.log(`   • Hospitals: ${hospitals.length}`);
      console.log(`   • Users: 12 (3 admins, 3 dietitians, 4 patients)`);
      console.log(`   • Patients: ${patients.length}`);
      console.log(`   • Vitals Records: ${patients.length * 3}`);
      console.log(`   • Feedback Entries: ${patients.length * 7}`);
      console.log(`   • Diet Plans: ${patients.length}`);

      return {
        hospitals,
        patients,
        success: true,
        message: 'All sample data seeded successfully!'
      };

    } catch (error) {
      console.error('❌ Error during data seeding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async clearAllData() {
    console.log('🗑️ Clearing all sample data...');

    const collections = [
      'patients', 'dietPlans', 'vitals', 'patientFeedback',
      'consultations', 'mealTracking', 'messMenus', 'users', 'hospitals'
    ];

    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`✅ Cleared collection: ${collectionName}`);
      } catch (error) {
        console.error(`❌ Error clearing collection ${collectionName}:`, error);
      }
    }

    console.log('🗑️ All data cleared successfully!');
    return { success: true };
  }
};

// Import types (you'll need to define these in your types file)
import type { Patient, DietPlan, Consultation, MessMenu, Vitals, MealTracking, PatientFeedback, FoodItem, User, Hospital } from './types';