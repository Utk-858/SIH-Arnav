import { FirestoreService } from './firestore';
import { Vitals } from '../types';

export const vitalsService = {
  // Get all vitals
  getAll: () => FirestoreService.getAll<Vitals>('vitals'),

  // Get vitals by ID
  getById: (id: string) => FirestoreService.getById<Vitals>('vitals', id),

  // Get vitals by patient
  getByPatient: (patientId: string) =>
    FirestoreService.getAll<Vitals>('vitals', (query) =>
      query.where('patientId', '==', patientId)
    ),

  // Create vitals
  create: (data: Omit<Vitals, 'id'>) => FirestoreService.create<Vitals>('vitals', data),

  // Update vitals
  update: (id: string, data: Partial<Omit<Vitals, 'id'>>) =>
    FirestoreService.update<Vitals>('vitals', id, data),

  // Delete vitals
  delete: (id: string) => FirestoreService.delete('vitals', id),
};