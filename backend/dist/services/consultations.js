"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationsService = void 0;
const firestore_1 = require("./firestore");
exports.consultationsService = {
    // Get all consultations
    getAll: () => firestore_1.FirestoreService.getAll('consultations'),
    // Get consultation by ID
    getById: (id) => firestore_1.FirestoreService.getById('consultations', id),
    // Get consultations by patient
    getByPatient: (patientId) => firestore_1.FirestoreService.getAll('consultations', (query) => query.where('patientId', '==', patientId)),
    // Get consultations by dietitian
    getByDietitian: (dietitianId) => firestore_1.FirestoreService.getAll('consultations', (query) => query.where('dietitianId', '==', dietitianId)),
    // Create consultation
    create: (data) => firestore_1.FirestoreService.create('consultations', data),
    // Update consultation
    update: (id, data) => firestore_1.FirestoreService.update('consultations', id, data),
    // Delete consultation
    delete: (id) => firestore_1.FirestoreService.delete('consultations', id),
};
//# sourceMappingURL=consultations.js.map