import { FirestoreService } from './firestore';
import { MealTracking } from '../types';

export const mealTrackingService = {
  // Get all meal tracking records
  getAll: () => FirestoreService.getAll<MealTracking>('mealTracking'),

  // Get meal tracking by ID
  getById: (id: string) => FirestoreService.getById<MealTracking>('mealTracking', id),

  // Get meal tracking by patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<MealTracking>('mealTracking', (query) =>
      query.where('patientId', '==', patientId)
    ),

  // Get meal tracking by diet plan
  getByDietPlan: (dietPlanId: string) =>
    FirestoreService.getAll<MealTracking>('mealTracking', (query) =>
      query.where('dietPlanId', '==', dietPlanId)
    ),

  // Create meal tracking
  create: (data: Omit<MealTracking, 'id'>) => FirestoreService.create<MealTracking>('mealTracking', data),

  // Update meal tracking
  update: (id: string, data: Partial<Omit<MealTracking, 'id'>>) =>
    FirestoreService.update<MealTracking>('mealTracking', id, data),

  // Delete meal tracking
  delete: (id: string) => FirestoreService.delete('mealTracking', id),
};