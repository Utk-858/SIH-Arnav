"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealTrackingService = void 0;
const firestore_1 = require("./firestore");
exports.mealTrackingService = {
    // Get all meal tracking records
    getAll: () => firestore_1.FirestoreService.getAll('mealTracking'),
    // Get meal tracking by ID
    getById: (id) => firestore_1.FirestoreService.getById('mealTracking', id),
    // Get meal tracking by patient
    getByPatient: (patientId) => firestore_1.FirestoreService.getAll('mealTracking', (query) => query.where('patientId', '==', patientId)),
    // Get meal tracking by diet plan
    getByDietPlan: (dietPlanId) => firestore_1.FirestoreService.getAll('mealTracking', (query) => query.where('dietPlanId', '==', dietPlanId)),
    // Create meal tracking
    create: (data) => firestore_1.FirestoreService.create('mealTracking', data),
    // Update meal tracking
    update: (id, data) => firestore_1.FirestoreService.update('mealTracking', id, data),
    // Delete meal tracking
    delete: (id) => firestore_1.FirestoreService.delete('mealTracking', id),
};
//# sourceMappingURL=mealTracking.js.map