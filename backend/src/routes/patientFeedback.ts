// Patient Feedback API routes

import express from 'express';
import { patientFeedbackService } from '../services/patientFeedback';
import { redisService } from '../services/redis';

const router = express.Router();

// GET /api/patientFeedback - Get all patient feedback
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'patientFeedback:all';
    let feedback = await redisService.get(cacheKey);

    if (!feedback) {
      // Fetch from Firestore
      feedback = await patientFeedbackService.getAll();

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, feedback, 1800);
    }

    res.json({
      success: true,
      data: feedback,
      cached: feedback !== null
    });
  } catch (error: any) {
    console.error('Error fetching patient feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient feedback',
      message: error.message
    });
  }
});

// GET /api/patientFeedback/:id - Get patient feedback by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    let feedback = await redisService.getCachedPatientData(id);

    if (!feedback) {
      // Fetch from Firestore
      feedback = await patientFeedbackService.getById(id);

      if (feedback) {
        // Cache for 1 hour
        await redisService.cachePatientData(id, feedback);
      }
    }

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Patient feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback,
      cached: feedback !== null
    });
  } catch (error: any) {
    console.error('Error fetching patient feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient feedback',
      message: error.message
    });
  }
});

// GET /api/patientFeedback/patient/:patientId - Get patient feedback by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check cache first
    const cacheKey = `patientFeedback:patient:${patientId}`;
    let feedback = await redisService.get(cacheKey);

    if (!feedback) {
      // Fetch from Firestore
      feedback = await patientFeedbackService.getByPatient(patientId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, feedback, 1800);
    }

    res.json({
      success: true,
      data: feedback,
      cached: feedback !== null
    });
  } catch (error: any) {
    console.error('Error fetching patient feedback by patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient feedback',
      message: error.message
    });
  }
});

// GET /api/patientFeedback/dietPlan/:dietPlanId - Get patient feedback by diet plan
router.get('/dietPlan/:dietPlanId', async (req, res) => {
  try {
    const { dietPlanId } = req.params;

    // Check cache first
    const cacheKey = `patientFeedback:dietPlan:${dietPlanId}`;
    let feedback = await redisService.get(cacheKey);

    if (!feedback) {
      // Fetch from Firestore
      feedback = await patientFeedbackService.getByDietPlan(dietPlanId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, feedback, 1800);
    }

    res.json({
      success: true,
      data: feedback,
      cached: feedback !== null
    });
  } catch (error: any) {
    console.error('Error fetching patient feedback by diet plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient feedback',
      message: error.message
    });
  }
});

// POST /api/patientFeedback - Create new patient feedback
router.post('/', async (req, res) => {
  try {
    const feedbackData = req.body;

    // Validate required fields
    if (!feedbackData.patientId || !feedbackData.dietPlanId || !feedbackData.date ||
        !feedbackData.mealAdherence || feedbackData.energyLevel === undefined ||
        !feedbackData.digestion || feedbackData.waterIntake === undefined ||
        feedbackData.sleepQuality === undefined || !feedbackData.overallFeeling) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, dietPlanId, date, mealAdherence, energyLevel, digestion, waterIntake, sleepQuality, overallFeeling'
      });
    }

    // Validate meal adherence structure
    if (!feedbackData.mealAdherence.breakfast === undefined ||
        !feedbackData.mealAdherence.lunch === undefined ||
        !feedbackData.mealAdherence.dinner === undefined ||
        !feedbackData.mealAdherence.snacks === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Meal adherence must include breakfast, lunch, dinner, and snacks'
      });
    }

    // Validate ranges
    if (feedbackData.energyLevel < 1 || feedbackData.energyLevel > 5) {
      return res.status(400).json({
        success: false,
        error: 'Energy level must be between 1 and 5'
      });
    }

    if (feedbackData.sleepQuality < 1 || feedbackData.sleepQuality > 5) {
      return res.status(400).json({
        success: false,
        error: 'Sleep quality must be between 1 and 5'
      });
    }

    // Validate digestion
    const validDigestions = ['excellent', 'good', 'fair', 'poor', 'very_poor'];
    if (!validDigestions.includes(feedbackData.digestion)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid digestion value'
      });
    }

    // Validate overall feeling
    const validFeelings = ['much_better', 'better', 'same', 'worse', 'much_worse'];
    if (!validFeelings.includes(feedbackData.overallFeeling)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid overall feeling value'
      });
    }

    const newFeedback = await patientFeedbackService.create(feedbackData);

    // Invalidate cache
    await redisService.delete('patientFeedback:all');

    res.status(201).json({
      success: true,
      data: newFeedback,
      message: 'Patient feedback created successfully'
    });
  } catch (error: any) {
    console.error('Error creating patient feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create patient feedback',
      message: error.message
    });
  }
});

// PUT /api/patientFeedback/:id - Update patient feedback
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ranges if provided
    if (updateData.energyLevel !== undefined && (updateData.energyLevel < 1 || updateData.energyLevel > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Energy level must be between 1 and 5'
      });
    }

    if (updateData.sleepQuality !== undefined && (updateData.sleepQuality < 1 || updateData.sleepQuality > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Sleep quality must be between 1 and 5'
      });
    }

    // Validate digestion if provided
    if (updateData.digestion) {
      const validDigestions = ['excellent', 'good', 'fair', 'poor', 'very_poor'];
      if (!validDigestions.includes(updateData.digestion)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid digestion value'
        });
      }
    }

    // Validate overall feeling if provided
    if (updateData.overallFeeling) {
      const validFeelings = ['much_better', 'better', 'same', 'worse', 'much_worse'];
      if (!validFeelings.includes(updateData.overallFeeling)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid overall feeling value'
        });
      }
    }

    await patientFeedbackService.update(id, updateData);

    // Invalidate cache
    await redisService.delete(`patientFeedback:${id}`);
    await redisService.delete('patientFeedback:all');

    res.json({
      success: true,
      message: 'Patient feedback updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating patient feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update patient feedback',
      message: error.message
    });
  }
});

// DELETE /api/patientFeedback/:id - Delete patient feedback
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await patientFeedbackService.delete(id);

    // Invalidate cache
    await redisService.delete(`patientFeedback:${id}`);
    await redisService.delete('patientFeedback:all');

    res.json({
      success: true,
      message: 'Patient feedback deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting patient feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete patient feedback',
      message: error.message
    });
  }
});

export default router;