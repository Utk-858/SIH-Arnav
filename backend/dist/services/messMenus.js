"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messMenusService = void 0;
const firestore_1 = require("./firestore");
exports.messMenusService = {
    // Get all mess menus
    getAll: () => firestore_1.FirestoreService.getAll('messMenus'),
    // Get mess menu by ID
    getById: (id) => firestore_1.FirestoreService.getById('messMenus', id),
    // Get mess menus by hospital
    getByHospital: (hospitalId) => firestore_1.FirestoreService.getAll('messMenus', (query) => query.where('hospitalId', '==', hospitalId)),
    // Get mess menu by date and hospital
    getByDateAndHospital: (date, hospitalId) => firestore_1.FirestoreService.getAll('messMenus', (query) => query.where('date', '==', date).where('hospitalId', '==', hospitalId)),
    // Create mess menu
    create: (data) => firestore_1.FirestoreService.create('messMenus', data),
    // Update mess menu
    update: (id, data) => firestore_1.FirestoreService.update('messMenus', id, data),
    // Delete mess menu
    delete: (id) => firestore_1.FirestoreService.delete('messMenus', id),
};
//# sourceMappingURL=messMenus.js.map