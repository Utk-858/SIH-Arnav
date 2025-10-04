import { FirestoreService } from './firestore';
import { PatientFeedback } from '../types';

export const patientFeedbackService = {
  // Get all patient feedback
  getAll: () => FirestoreService.getAll<PatientFeedback>('patientFeedback'),

  // Get patient feedback by ID
  getById: (id: string) => FirestoreService.getById<PatientFeedback>('patientFeedback', id),

  // Get patient feedback by patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<PatientFeedback>('patientFeedback', (query) =>
      query.where('patientId', '==', patientId)
    ),

  // Get patient feedback by diet plan
  getByDietPlan: (dietPlanId: string) =>
    FirestoreService.getAll<PatientFeedback>('patientFeedback', (query) =>
      query.where('dietPlanId', '==', dietPlanId)
    ),

  // Create patient feedback
  create: (data: Omit<PatientFeedback, 'id'>) => FirestoreService.create<PatientFeedback>('patientFeedback', data),

  // Update patient feedback
  update: (id: string, data: Partial<Omit<PatientFeedback, 'id'>>) =>
    FirestoreService.update<PatientFeedback>('patientFeedback', id, data),

  // Delete patient feedback
  delete: (id: string) => FirestoreService.delete('patientFeedback', id),
};