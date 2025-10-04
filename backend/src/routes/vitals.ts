// Vitals API routes

import express from 'express';
import { vitalsService } from '../services/vitals';
import { redisService } from '../services/redis';

const router = express.Router();

// GET /api/vitals - Get all vitals
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'vitals:all';
    let vitals = await redisService.get(cacheKey);

    if (!vitals) {
      // Fetch from Firestore
      vitals = await vitalsService.getAll();

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, vitals, 1800);
    }

    res.json({
      success: true,
      data: vitals,
      cached: vitals !== null
    });
  } catch (error: any) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vitals',
      message: error.message
    });
  }
});

// GET /api/vitals/:id - Get vitals by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    let vitals = await redisService.get(id);

    if (!vitals) {
      // Fetch from Firestore
      vitals = await vitalsService.getById(id);

      if (vitals) {
        // Cache for 1 hour
        await redisService.setWithTTL(id, vitals, 3600);
      }
    }

    if (!vitals) {
      return res.status(404).json({
        success: false,
        error: 'Vitals not found'
      });
    }

    res.json({
      success: true,
      data: vitals,
      cached: vitals !== null
    });
  } catch (error: any) {
    console.error('Error fetching vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vitals',
      message: error.message
    });
  }
});

// GET /api/vitals/patient/:patientId - Get vitals by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check cache first
    const cacheKey = `vitals:patient:${patientId}`;
    let vitals = await redisService.get(cacheKey);

    if (!vitals) {
      // Fetch from Firestore
      vitals = await vitalsService.getByPatient(patientId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, vitals, 1800);
    }

    res.json({
      success: true,
      data: vitals,
      cached: vitals !== null
    });
  } catch (error: any) {
    console.error('Error fetching vitals by patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vitals',
      message: error.message
    });
  }
});

// POST /api/vitals - Create new vitals
router.post('/', async (req, res) => {
  try {
    const vitalsData = req.body;

    // Validate required fields
    if (!vitalsData.patientId || !vitalsData.recordedBy || !vitalsData.date ||
        !vitalsData.bloodPressure || !vitalsData.bmi || !vitalsData.weight || !vitalsData.height) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, recordedBy, date, bloodPressure, bmi, weight, height'
      });
    }

    // Validate blood pressure structure
    if (!vitalsData.bloodPressure.systolic || !vitalsData.bloodPressure.diastolic) {
      return res.status(400).json({
        success: false,
        error: 'Blood pressure must include systolic and diastolic values'
      });
    }

    const newVitals = await vitalsService.create(vitalsData);

    // Invalidate cache
    await redisService.delete('vitals:all');

    res.status(201).json({
      success: true,
      data: newVitals,
      message: 'Vitals created successfully'
    });
  } catch (error: any) {
    console.error('Error creating vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vitals',
      message: error.message
    });
  }
});

// PUT /api/vitals/:id - Update vitals
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await vitalsService.update(id, updateData);

    // Invalidate cache
    await redisService.delete(`vitals:${id}`);
    await redisService.delete('vitals:all');

    res.json({
      success: true,
      message: 'Vitals updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vitals',
      message: error.message
    });
  }
});

// DELETE /api/vitals/:id - Delete vitals
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await vitalsService.delete(id);

    // Invalidate cache
    await redisService.delete(`vitals:${id}`);
    await redisService.delete('vitals:all');

    res.json({
      success: true,
      message: 'Vitals deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vitals',
      message: error.message
    });
  }
});

export default router;