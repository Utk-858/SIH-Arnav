"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientFeedbackService = void 0;
const firestore_1 = require("./firestore");
exports.patientFeedbackService = {
    // Get all patient feedback
    getAll: () => firestore_1.FirestoreService.getAll('patientFeedback'),
    // Get patient feedback by ID
    getById: (id) => firestore_1.FirestoreService.getById('patientFeedback', id),
    // Get patient feedback by patient
    getByPatient: (patientId) => firestore_1.FirestoreService.getAll('patientFeedback', (query) => query.where('patientId', '==', patientId)),
    // Get patient feedback by diet plan
    getByDietPlan: (dietPlanId) => firestore_1.FirestoreService.getAll('patientFeedback', (query) => query.where('dietPlanId', '==', dietPlanId)),
    // Create patient feedback
    create: (data) => firestore_1.FirestoreService.create('patientFeedback', data),
    // Update patient feedback
    update: (id, data) => firestore_1.FirestoreService.update('patientFeedback', id, data),
    // Delete patient feedback
    delete: (id) => firestore_1.FirestoreService.delete('patientFeedback', id),
};
//# sourceMappingURL=patientFeedback.js.map