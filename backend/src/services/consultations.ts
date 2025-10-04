import { FirestoreService } from './firestore';
import { Consultation } from '../types';

export const consultationsService = {
  // Get all consultations
  getAll: () => FirestoreService.getAll<Consultation>('consultations'),

  // Get consultation by ID
  getById: (id: string) => FirestoreService.getById<Consultation>('consultations', id),

  // Get consultations by patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<Consultation>('consultations', (query) =>
      query.where('patientId', '==', patientId)
    ),

  // Get consultations by dietitian
  getByDietitian: (dietitianId: string) =>
    FirestoreService.getAll<Consultation>('consultations', (query) =>
      query.where('dietitianId', '==', dietitianId)
    ),

  // Create consultation
  create: (data: Omit<Consultation, 'id'>) => FirestoreService.create<Consultation>('consultations', data),

  // Update consultation
  update: (id: string, data: Partial<Omit<Consultation, 'id'>>) =>
    FirestoreService.update<Consultation>('consultations', id, data),

  // Delete consultation
  delete: (id: string) => FirestoreService.delete('consultations', id),
};