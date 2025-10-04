// Diet Plans API routes

import express from 'express';
import { dietPlansService } from '../services/dietPlans';
import { notificationsService, notificationHelpers } from '../services/notifications';
import { redisService } from '../services/redis';
import { patientsService } from '../services/firestore';
import { PDFService } from '../services/pdfService';

const router = express.Router();

// GET /api/dietPlans - Get all diet plans
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'dietPlans:all';
    let dietPlans = await redisService.get(cacheKey);

    if (!dietPlans) {
      // Fetch from Firestore
      dietPlans = await dietPlansService.getAll();

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, dietPlans, 1800);
    }

    res.json({
      success: true,
      data: dietPlans,
      cached: dietPlans !== null
    });
  } catch (error: any) {
    console.error('Error fetching diet plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diet plans',
      message: error.message
    });
  }
});

// GET /api/dietPlans/:id - Get diet plan by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    let dietPlan = await redisService.get(id);

    if (!dietPlan) {
      // Fetch from Firestore
      dietPlan = await dietPlansService.getById(id);

      if (dietPlan) {
        // Cache for 1 hour
        await redisService.setWithTTL(id, dietPlan, 3600);
      }
    }

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found'
      });
    }

    res.json({
      success: true,
      data: dietPlan,
      cached: dietPlan !== null
    });
  } catch (error: any) {
    console.error('Error fetching diet plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diet plan',
      message: error.message
    });
  }
});

// GET /api/dietPlans/patient/:patientId - Get diet plans by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check cache first
    const cacheKey = `dietPlans:patient:${patientId}`;
    let dietPlans = await redisService.get(cacheKey);

    if (!dietPlans) {
      // Fetch from Firestore
      dietPlans = await dietPlansService.getByPatient(patientId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, dietPlans, 1800);
    }

    res.json({
      success: true,
      data: dietPlans,
      cached: dietPlans !== null
    });
  } catch (error: any) {
    console.error('Error fetching diet plans by patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diet plans',
      message: error.message
    });
  }
});

// GET /api/dietPlans/dietitian/:dietitianId - Get diet plans by dietitian
router.get('/dietitian/:dietitianId', async (req, res) => {
  try {
    const { dietitianId } = req.params;

    // Check cache first
    const cacheKey = `dietPlans:dietitian:${dietitianId}`;
    let dietPlans = await redisService.get(cacheKey);

    if (!dietPlans) {
      // Fetch from Firestore
      dietPlans = await dietPlansService.getByDietitian(dietitianId);

      // Cache for 30 minutes
      await redisService.setWithTTL(cacheKey, dietPlans, 1800);
    }

    res.json({
      success: true,
      data: dietPlans,
      cached: dietPlans !== null
    });
  } catch (error: any) {
    console.error('Error fetching diet plans by dietitian:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diet plans',
      message: error.message
    });
  }
});

// GET /api/dietPlans/:id/pdf - Export diet plan as PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch diet plan
    const dietPlan = await dietPlansService.getById(id);
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: 'Diet plan not found'
      });
    }

    // Fetch patient details
    const patient = await patientsService.getById(dietPlan.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Generate PDF
    const pdfBuffer = await PDFService.generateDietChartPDF(dietPlan, patient);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${patient.name}_diet_chart.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating diet plan PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

// POST /api/dietPlans - Create new diet plan
router.post('/', async (req, res) => {
  try {
    const planData = req.body;

    // Validate required fields
    if (!planData.patientId || !planData.dietitianId || !planData.title ||
        !planData.description || !planData.dietDays) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, dietitianId, title, description, dietDays'
      });
    }

    // Set defaults
    if (planData.isActive === undefined) planData.isActive = true;
    if (!planData.createdAt) planData.createdAt = new Date();
    if (!planData.updatedAt) planData.updatedAt = new Date();

    const newPlan = await dietPlansService.create(planData);

    // Send delivery notification to patient
    try {
      // Get patient details for notification
      const patient = await patientsService.getById(planData.patientId);
      if (patient) {
        const notificationData = notificationHelpers.createDietPlanDelivery(
          planData.patientId, // Assuming patientId is the user ID
          newPlan.id,
          planData.title
        );
        await notificationsService.create(notificationData);
      }
    } catch (error) {
      console.error('Error creating diet plan delivery notification:', error);
      // Don't fail the request if notification fails
    }

    // Invalidate cache
    await redisService.delete('dietPlans:all');

    res.status(201).json({
      success: true,
      data: newPlan,
      message: 'Diet plan created successfully'
    });
  } catch (error: any) {
    console.error('Error creating diet plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create diet plan',
      message: error.message
    });
  }
});

// PUT /api/dietPlans/:id - Update diet plan
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if we're activating the diet plan
    let wasActivated = false;
    if (updateData.isActive === true) {
      const existingPlan = await dietPlansService.getById(id);
      if (existingPlan && !existingPlan.isActive) {
        wasActivated = true;
      }
    }

    // Update timestamp
    updateData.updatedAt = new Date();

    await dietPlansService.update(id, updateData);

    // Send activation notification if plan was just activated
    if (wasActivated) {
      try {
        const updatedPlan = await dietPlansService.getById(id);
        if (updatedPlan) {
          const notificationData = notificationHelpers.createDietPlanActivation(
            updatedPlan.patientId, // Assuming patientId is the user ID
            updatedPlan.id,
            updatedPlan.title
          );
          await notificationsService.create(notificationData);
        }
      } catch (error) {
        console.error('Error creating diet plan activation notification:', error);
        // Don't fail the request if notification fails
      }
    }

    // Invalidate cache
    await redisService.delete(`dietPlans:${id}`);
    await redisService.delete('dietPlans:all');

    res.json({
      success: true,
      message: 'Diet plan updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating diet plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update diet plan',
      message: error.message
    });
  }
});

// DELETE /api/dietPlans/:id - Delete diet plan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await dietPlansService.delete(id);

    // Invalidate cache
    await redisService.delete(`dietPlans:${id}`);
    await redisService.delete('dietPlans:all');

    res.json({
      success: true,
      message: 'Diet plan deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting diet plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete diet plan',
      message: error.message
    });
  }
});

export default router;