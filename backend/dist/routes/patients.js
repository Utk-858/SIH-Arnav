"use strict";
// Patients API routes
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firestore_1 = require("../services/firestore");
const redis_1 = require("../services/redis");
const router = express_1.default.Router();
// GET /api/patients - Get all patients
router.get('/', async (req, res) => {
    try {
        // Check cache first
        const cacheKey = 'patients:all';
        let patients = await redis_1.redisService.get(cacheKey);
        if (!patients) {
            // Fetch from Firestore
            patients = await firestore_1.patientsService.getAll();
            // Cache for 30 minutes
            await redis_1.redisService.setWithTTL(cacheKey, patients, 1800);
        }
        res.json({
            success: true,
            data: patients,
            cached: patients !== null
        });
    }
    catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patients',
            message: error.message
        });
    }
});
// GET /api/patients/:id - Get patient by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check cache first
        let patient = await redis_1.redisService.getCachedPatientData(id);
        if (!patient) {
            // Fetch from Firestore
            patient = await firestore_1.patientsService.getById(id);
            if (patient) {
                // Cache for 1 hour
                await redis_1.redisService.cachePatientData(id, patient);
            }
        }
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }
        res.json({
            success: true,
            data: patient,
            cached: patient !== null
        });
    }
    catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patient',
            message: error.message
        });
    }
});
// GET /api/patients/dietitian/:dietitianId - Get patients by dietitian
router.get('/dietitian/:dietitianId', async (req, res) => {
    try {
        const { dietitianId } = req.params;
        // Check cache first
        const cacheKey = `patients:dietitian:${dietitianId}`;
        let patients = await redis_1.redisService.get(cacheKey);
        if (!patients) {
            // Fetch from Firestore
            patients = await firestore_1.patientsService.getByDietitian(dietitianId);
            // Cache for 30 minutes
            await redis_1.redisService.setWithTTL(cacheKey, patients, 1800);
        }
        res.json({
            success: true,
            data: patients,
            cached: patients !== null
        });
    }
    catch (error) {
        console.error('Error fetching patients by dietitian:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patients',
            message: error.message
        });
    }
});
// POST /api/patients - Create new patient
router.post('/', async (req, res) => {
    try {
        const patientData = req.body;
        // Validate required fields
        if (!patientData.name || !patientData.age || !patientData.gender) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, age, gender'
            });
        }
        // Generate unique code if not provided
        if (!patientData.code) {
            patientData.code = `PAT${Date.now().toString().slice(-6)}`;
        }
        const newPatient = await firestore_1.patientsService.create(patientData);
        // Invalidate cache
        await redis_1.redisService.delete('patients:all');
        res.status(201).json({
            success: true,
            data: newPatient,
            message: 'Patient created successfully'
        });
    }
    catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create patient',
            message: error.message
        });
    }
});
// PUT /api/patients/:id - Update patient
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        await firestore_1.patientsService.update(id, updateData);
        // Invalidate cache
        await redis_1.redisService.delete(`patient:${id}`);
        await redis_1.redisService.delete('patients:all');
        res.json({
            success: true,
            message: 'Patient updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update patient',
            message: error.message
        });
    }
});
// DELETE /api/patients/:id - Delete patient
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await firestore_1.patientsService.delete(id);
        // Invalidate cache
        await redis_1.redisService.delete(`patient:${id}`);
        await redis_1.redisService.delete('patients:all');
        res.json({
            success: true,
            message: 'Patient deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete patient',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=patients.js.map