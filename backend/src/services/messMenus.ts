import { FirestoreService } from './firestore';
import { MessMenu } from '../types';

export const messMenusService = {
  // Get all mess menus
  getAll: () => FirestoreService.getAll<MessMenu>('messMenus'),

  // Get mess menu by ID
  getById: (id: string) => FirestoreService.getById<MessMenu>('messMenus', id),

  // Get mess menus by hospital
  getByHospital: (hospitalId: string) =>
    FirestoreService.getAll<MessMenu>('messMenus', (query) =>
      query.where('hospitalId', '==', hospitalId)
    ),

  // Get mess menu by date and hospital
  getByDateAndHospital: (date: Date, hospitalId: string) =>
    FirestoreService.getAll<MessMenu>('messMenus', (query) =>
      query.where('date', '==', date).where('hospitalId', '==', hospitalId)
    ),

  // Create mess menu
  create: (data: Omit<MessMenu, 'id'>) => FirestoreService.create<MessMenu>('messMenus', data),

  // Update mess menu
  update: (id: string, data: Partial<Omit<MessMenu, 'id'>>) =>
    FirestoreService.update<MessMenu>('messMenus', id, data),

  // Delete mess menu
  delete: (id: string) => FirestoreService.delete('messMenus', id),
};