// Patients API routes

import express from 'express';
import { patientsService } from '../services/firestore';
import { redisService } from '../services/redis';

const router = express.Router();

// GET /api/patients - Get all patients
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'patients:all';
    let patients = await redisService.get(cacheKey);

    if (!patients) {
      // Fetch from Firestore
      patients = await patientsService.getAll();

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, patients, 1800);
    }

    res.json({
      success: true,
      data: patients,
      cached: patients !== null
    });
  } catch (error: any) {
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
    let patient = await redisService.getCachedPatientData(id);

    if (!patient) {
      // Fetch from Firestore
      patient = await patientsService.getById(id);

      if (patient) {
        // Cache for 1 hour
        await redisService.cachePatientData(id, patient);
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
  } catch (error: any) {
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
    let patients = await redisService.get(cacheKey);

    if (!patients) {
      // Fetch from Firestore
      patients = await patientsService.getByDietitian(dietitianId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, patients, 1800);
    }

    res.json({
      success: true,
      data: patients,
      cached: patients !== null
    });
  } catch (error: any) {
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

    const newPatient = await patientsService.create(patientData);

    // Invalidate cache
    await redisService.delete('patients:all');

    res.status(201).json({
      success: true,
      data: newPatient,
      message: 'Patient created successfully'
    });
  } catch (error: any) {
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

    await patientsService.update(id, updateData);

    // Invalidate cache
    await redisService.delete(`patient:${id}`);
    await redisService.delete('patients:all');

    res.json({
      success: true,
      message: 'Patient updated successfully'
    });
  } catch (error: any) {
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

    await patientsService.delete(id);

    // Invalidate cache
    await redisService.delete(`patient:${id}`);
    await redisService.delete('patients:all');

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patient',
      message: error.message
    });
  }
});

export default router;