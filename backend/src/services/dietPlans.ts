import { FirestoreService } from './firestore';
import { DietPlan } from '../types';

export const dietPlansService = {
  // Get all diet plans
  getAll: () => FirestoreService.getAll<DietPlan>('dietPlans'),

  // Get diet plan by ID
  getById: (id: string) => FirestoreService.getById<DietPlan>('dietPlans', id),

  // Get diet plans by patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<DietPlan>('dietPlans', (query) =>
      query.where('patientId', '==', patientId)
    ),

  // Get diet plans by dietitian
  getByDietitian: (dietitianId: string) =>
    FirestoreService.getAll<DietPlan>('dietPlans', (query) =>
      query.where('dietitianId', '==', dietitianId)
    ),

  // Create diet plan
  create: (data: Omit<DietPlan, 'id'>) => FirestoreService.create<DietPlan>('dietPlans', data),

  // Update diet plan
  update: (id: string, data: Partial<Omit<DietPlan, 'id'>>) =>
    FirestoreService.update<DietPlan>('dietPlans', id, data),

  // Delete diet plan
  delete: (id: string) => FirestoreService.delete('dietPlans', id),
};