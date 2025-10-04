// Meal Tracking API routes

import express from 'express';
import { mealTrackingService } from '../services/mealTracking';
import { redisService } from '../services/redis';

const router = express.Router();

// GET /api/mealTracking - Get all meal tracking records
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'mealTracking:all';
    let mealTracking = await redisService.get(cacheKey);

    if (!mealTracking) {
      // Fetch from Firestore
      mealTracking = await mealTrackingService.getAll();

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, mealTracking, 1800);
    }

    res.json({
      success: true,
      data: mealTracking,
      cached: mealTracking !== null
    });
  } catch (error: any) {
    console.error('Error fetching meal tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal tracking',
      message: error.message
    });
  }
});

// GET /api/mealTracking/:id - Get meal tracking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    let mealTrack = await redisService.get(id);

    if (!mealTrack) {
      // Fetch from Firestore
      mealTrack = await mealTrackingService.getById(id);

      if (mealTrack) {
        // Cache for 1 hour
        await redisService.setWithTTL(id, mealTrack, 3600);
      }
    }

    if (!mealTrack) {
      return res.status(404).json({
        success: false,
        error: 'Meal tracking record not found'
      });
    }

    res.json({
      success: true,
      data: mealTrack,
      cached: mealTrack !== null
    });
  } catch (error: any) {
    console.error('Error fetching meal tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal tracking',
      message: error.message
    });
  }
});

// GET /api/mealTracking/patient/:patientId - Get meal tracking by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check cache first
    const cacheKey = `mealTracking:patient:${patientId}`;
    let mealTracking = await redisService.get(cacheKey);

    if (!mealTracking) {
      // Fetch from Firestore
      mealTracking = await mealTrackingService.getByPatient(patientId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, mealTracking, 1800);
    }

    res.json({
      success: true,
      data: mealTracking,
      cached: mealTracking !== null
    });
  } catch (error: any) {
    console.error('Error fetching meal tracking by patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal tracking',
      message: error.message
    });
  }
});

// GET /api/mealTracking/dietPlan/:dietPlanId - Get meal tracking by diet plan
router.get('/dietPlan/:dietPlanId', async (req, res) => {
  try {
    const { dietPlanId } = req.params;

    // Check cache first
    const cacheKey = `mealTracking:dietPlan:${dietPlanId}`;
    let mealTracking = await redisService.get(cacheKey);

    if (!mealTracking) {
      // Fetch from Firestore
      mealTracking = await mealTrackingService.getByDietPlan(dietPlanId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, mealTracking, 1800);
    }

    res.json({
      success: true,
      data: mealTracking,
      cached: mealTracking !== null
    });
  } catch (error: any) {
    console.error('Error fetching meal tracking by diet plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal tracking',
      message: error.message
    });
  }
});

// POST /api/mealTracking - Create new meal tracking record
router.post('/', async (req, res) => {
  try {
    const trackingData = req.body;

    // Validate required fields
    if (!trackingData.patientId || !trackingData.dietPlanId || !trackingData.mealId ||
        !trackingData.mealType || !trackingData.scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, dietPlanId, mealId, mealType, scheduledDate'
      });
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    if (!validMealTypes.includes(trackingData.mealType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid meal type. Must be one of: breakfast, lunch, dinner, snacks'
      });
    }

    // Set default status if not provided
    if (!trackingData.status) trackingData.status = 'scheduled';

    const newTracking = await mealTrackingService.create(trackingData);

    // Invalidate cache
    await redisService.delete('mealTracking:all');

    res.status(201).json({
      success: true,
      data: newTracking,
      message: 'Meal tracking record created successfully'
    });
  } catch (error: any) {
    console.error('Error creating meal tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meal tracking',
      message: error.message
    });
  }
});

// PUT /api/mealTracking/:id - Update meal tracking record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await mealTrackingService.update(id, updateData);

    // Invalidate cache
    await redisService.delete(`mealTracking:${id}`);
    await redisService.delete('mealTracking:all');

    res.json({
      success: true,
      message: 'Meal tracking record updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating meal tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update meal tracking',
      message: error.message
    });
  }
});

// DELETE /api/mealTracking/:id - Delete meal tracking record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await mealTrackingService.delete(id);

    // Invalidate cache
    await redisService.delete(`mealTracking:${id}`);
    await redisService.delete('mealTracking:all');

    res.json({
      success: true,
      message: 'Meal tracking record deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting meal tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete meal tracking',
      message: error.message
    });
  }
});

export default router;