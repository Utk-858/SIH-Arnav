"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dietPlansService = void 0;
const firestore_1 = require("./firestore");
exports.dietPlansService = {
    // Get all diet plans
    getAll: () => firestore_1.FirestoreService.getAll('dietPlans'),
    // Get diet plan by ID
    getById: (id) => firestore_1.FirestoreService.getById('dietPlans', id),
    // Get diet plans by patient
    getByPatient: (patientId) => firestore_1.FirestoreService.getAll('dietPlans', (query) => query.where('patientId', '==', patientId)),
    // Get diet plans by dietitian
    getByDietitian: (dietitianId) => firestore_1.FirestoreService.getAll('dietPlans', (query) => query.where('dietitianId', '==', dietitianId)),
    // Create diet plan
    create: (data) => firestore_1.FirestoreService.create('dietPlans', data),
    // Update diet plan
    update: (id, data) => firestore_1.FirestoreService.update('dietPlans', id, data),
    // Delete diet plan
    delete: (id) => firestore_1.FirestoreService.delete('dietPlans', id),
};
//# sourceMappingURL=dietPlans.js.map