"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitalsService = void 0;
const firestore_1 = require("./firestore");
exports.vitalsService = {
    // Get all vitals
    getAll: () => firestore_1.FirestoreService.getAll('vitals'),
    // Get vitals by ID
    getById: (id) => firestore_1.FirestoreService.getById('vitals', id),
    // Get vitals by patient
    getByPatient: (patientId) => firestore_1.FirestoreService.getAll('vitals', (query) => query.where('patientId', '==', patientId)),
    // Create vitals
    create: (data) => firestore_1.FirestoreService.create('vitals', data),
    // Update vitals
    update: (id, data) => firestore_1.FirestoreService.update('vitals', id, data),
    // Delete vitals
    delete: (id) => firestore_1.FirestoreService.delete('vitals', id),
};
//# sourceMappingURL=vitals.js.map