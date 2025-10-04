// Consultations API routes

import express from 'express';
import { consultationsService } from '../services/consultations';
import { redisService } from '../services/redis';

const router = express.Router();

// GET /api/consultations - Get all consultations
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'consultations:all';
    let consultations = await redisService.get(cacheKey);

    if (!consultations) {
      // Fetch from Firestore
      consultations = await consultationsService.getAll();

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, consultations, 1800);
    }

    res.json({
      success: true,
      data: consultations,
      cached: consultations !== null
    });
  } catch (error: any) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations',
      message: error.message
    });
  }
});

// GET /api/consultations/:id - Get consultation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    let consultation = await redisService.get(id);

    if (!consultation) {
      // Fetch from Firestore
      consultation = await consultationsService.getById(id);

      if (consultation) {
        // Cache for 1 hour
        await redisService.setWithTTL(id, consultation, 3600);
      }
    }

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found'
      });
    }

    res.json({
      success: true,
      data: consultation,
      cached: consultation !== null
    });
  } catch (error: any) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation',
      message: error.message
    });
  }
});

// GET /api/consultations/patient/:patientId - Get consultations by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check cache first
    const cacheKey = `consultations:patient:${patientId}`;
    let consultations = await redisService.get(cacheKey);

    if (!consultations) {
      // Fetch from Firestore
      consultations = await consultationsService.getByPatient(patientId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, consultations, 1800);
    }

    res.json({
      success: true,
      data: consultations,
      cached: consultations !== null
    });
  } catch (error: any) {
    console.error('Error fetching consultations by patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations',
      message: error.message
    });
  }
});

// GET /api/consultations/dietitian/:dietitianId - Get consultations by dietitian
router.get('/dietitian/:dietitianId', async (req, res) => {
  try {
    const { dietitianId } = req.params;

    // Check cache first
    const cacheKey = `consultations:dietitian:${dietitianId}`;
    let consultations = await redisService.get(cacheKey);

    if (!consultations) {
      // Fetch from Firestore
      consultations = await consultationsService.getByDietitian(dietitianId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, consultations, 1800);
    }

    res.json({
      success: true,
      data: consultations,
      cached: consultations !== null
    });
  } catch (error: any) {
    console.error('Error fetching consultations by dietitian:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations',
      message: error.message
    });
  }
});

// POST /api/consultations - Create new consultation
router.post('/', async (req, res) => {
  try {
    const consultationData = req.body;

    // Validate required fields
    if (!consultationData.patientId || !consultationData.dietitianId ||
        !consultationData.date || !consultationData.notes || !consultationData.recommendations) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, dietitianId, date, notes, recommendations'
      });
    }

    // Validate status
    const validStatuses = ['scheduled', 'completed', 'cancelled'];
    if (consultationData.status && !validStatuses.includes(consultationData.status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: scheduled, completed, cancelled'
      });
    }

    // Set default status if not provided
    if (!consultationData.status) consultationData.status = 'scheduled';

    const newConsultation = await consultationsService.create(consultationData);

    // Invalidate cache
    await redisService.delete('consultations:all');

    res.status(201).json({
      success: true,
      data: newConsultation,
      message: 'Consultation created successfully'
    });
  } catch (error: any) {
    console.error('Error creating consultation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create consultation',
      message: error.message
    });
  }
});

// PUT /api/consultations/:id - Update consultation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: scheduled, completed, cancelled'
        });
      }
    }

    await consultationsService.update(id, updateData);

    // Invalidate cache
    await redisService.delete(`consultations:${id}`);
    await redisService.delete('consultations:all');

    res.json({
      success: true,
      message: 'Consultation updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating consultation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consultation',
      message: error.message
    });
  }
});

// DELETE /api/consultations/:id - Delete consultation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await consultationsService.delete(id);

    // Invalidate cache
    await redisService.delete(`consultations:${id}`);
    await redisService.delete('consultations:all');

    res.json({
      success: true,
      message: 'Consultation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting consultation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete consultation',
      message: error.message
    });
  }
});

export default router;