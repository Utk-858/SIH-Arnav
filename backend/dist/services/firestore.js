"use strict";
// Backend Firestore service using Firebase Admin SDK
Object.defineProperty(exports, "__esModule", { value: true });
exports.dietPlansService = exports.consultationsService = exports.vitalsService = exports.usersService = exports.hospitalsService = exports.patientsService = exports.FirestoreService = void 0;
const firebase_1 = require("./firebase");
// Generic CRUD functions
class FirestoreService {
    // Create document
    static async create(collectionName, data) {
        try {
            const collectionRef = firebase_1.db.collection(collectionName);
            const docRef = await collectionRef.add({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return { ...data, id: docRef.id };
        }
        catch (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
            throw error;
        }
    }
    // Read single document
    static async getById(collectionName, id) {
        try {
            const docRef = firebase_1.db.collection(collectionName).doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        }
        catch (error) {
            console.error(`Error getting document ${id} from ${collectionName}:`, error);
            throw error;
        }
    }
    // Read multiple documents with optional filters
    static async getAll(collectionName, queryBuilder) {
        try {
            let query = firebase_1.db.collection(collectionName);
            if (queryBuilder) {
                query = queryBuilder(query);
            }
            const querySnapshot = await query.get();
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error(`Error getting documents from ${collectionName}:`, error);
            throw error;
        }
    }
    // Update document
    static async update(collectionName, id, data) {
        try {
            const docRef = firebase_1.db.collection(collectionName).doc(id);
            await docRef.update({
                ...data,
                updatedAt: new Date(),
            });
        }
        catch (error) {
            console.error(`Error updating document ${id} in ${collectionName}:`, error);
            throw error;
        }
    }
    // Delete document
    static async delete(collectionName, id) {
        try {
            const docRef = firebase_1.db.collection(collectionName).doc(id);
            await docRef.delete();
        }
        catch (error) {
            console.error(`Error deleting document ${id} from ${collectionName}:`, error);
            throw error;
        }
    }
}
exports.FirestoreService = FirestoreService;
// Specific service functions for common operations
exports.patientsService = {
    // Get all patients
    getAll: () => FirestoreService.getAll('patients'),
    // Get patient by ID
    getById: (id) => FirestoreService.getById('patients', id),
    // Get patients by dietitian
    getByDietitian: (dietitianId) => FirestoreService.getAll('patients', (query) => query.where('dietitianId', '==', dietitianId)),
    // Create patient
    create: (data) => FirestoreService.create('patients', data),
    // Update patient
    update: (id, data) => FirestoreService.update('patients', id, data),
    // Delete patient
    delete: (id) => FirestoreService.delete('patients', id),
};
// Specific service functions for hospitals
exports.hospitalsService = {
    // Get all hospitals
    getAll: () => FirestoreService.getAll('hospitals'),
    // Get hospital by ID
    getById: (id) => FirestoreService.getById('hospitals', id),
    // Create hospital
    create: (data) => FirestoreService.create('hospitals', data),
    // Update hospital
    update: (id, data) => FirestoreService.update('hospitals', id, data),
    // Delete hospital
    delete: (id) => FirestoreService.delete('hospitals', id),
};
// Specific service functions for users
exports.usersService = {
    // Get all users
    getAll: () => FirestoreService.getAll('users'),
    // Get user by ID (uid)
    getById: (uid) => FirestoreService.getById('users', uid),
    // Get users by role
    getByRole: (role) => FirestoreService.getAll('users', (query) => query.where('role', '==', role)),
    // Get users by hospital
    getByHospital: (hospitalId) => FirestoreService.getAll('users', (query) => query.where('hospitalId', '==', hospitalId)),
    // Create user (uid as document ID)
    create: async (data) => {
        try {
            const collectionRef = firebase_1.db.collection('users');
            await collectionRef.doc(data.uid).set({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return { ...data, id: data.uid };
        }
        catch (error) {
            console.error(`Error creating user ${data.uid}:`, error);
            throw error;
        }
    },
    // Update user
    update: (uid, data) => FirestoreService.update('users', uid, data),
    // Delete user
    delete: (uid) => FirestoreService.delete('users', uid),
};
// Specific service functions for vitals
exports.vitalsService = {
    // Get all vitals for a patient
    getByPatient: (patientId) => FirestoreService.getAll('vitals', (query) => query.where('patientId', '==', patientId).orderBy('date', 'desc')),
    // Create vitals record
    create: (data) => FirestoreService.create('vitals', data),
    // Update vitals record
    update: (id, data) => FirestoreService.update('vitals', id, data),
    // Delete vitals record
    delete: (id) => FirestoreService.delete('vitals', id),
};
// Specific service functions for consultations
exports.consultationsService = {
    // Get all consultations
    getAll: () => FirestoreService.getAll('consultations', (query) => query.orderBy('date', 'desc')),
    // Get consultations for a patient
    getByPatient: (patientId) => FirestoreService.getAll('consultations', (query) => query.where('patientId', '==', patientId).orderBy('date', 'desc')),
    // Get consultations for a dietitian
    getByDietitian: (dietitianId) => FirestoreService.getAll('consultations', (query) => query.where('dietitianId', '==', dietitianId).orderBy('date', 'desc')),
    // Create consultation
    create: (data) => FirestoreService.create('consultations', data),
    // Update consultation
    update: (id, data) => FirestoreService.update('consultations', id, data),
};
// Specific service functions for diet plans
exports.dietPlansService = {
    // Get all diet plans
    getAll: () => FirestoreService.getAll('dietPlans', (query) => query.orderBy('createdAt', 'desc')),
    // Get all diet plans for a patient
    getByPatient: (patientId) => FirestoreService.getAll('dietPlans', (query) => query.where('patientId', '==', patientId).orderBy('createdAt', 'desc')),
    // Create diet plan
    create: (data) => FirestoreService.create('dietPlans', data),
    // Update diet plan
    update: (id, data) => FirestoreService.update('dietPlans', id, data),
    // Delete diet plan
    delete: (id) => FirestoreService.delete('dietPlans', id),
};
//# sourceMappingURL=firestore.js.map