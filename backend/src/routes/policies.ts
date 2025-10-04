import express from 'express';
import { policiesService } from '../services/policies';
import { PolicySearchRequest } from '../types';

const router = express.Router();

// Get all policies
router.get('/', async (req, res) => {
  try {
    const policies = await policiesService.getAll();
    res.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies'
    });
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await policiesService.getById(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy'
    });
  }
});

// Search policies with advanced filtering
router.post('/search', async (req, res) => {
  try {
    const searchRequest: PolicySearchRequest = req.body;

    // Validate search request
    if (searchRequest.limit && (searchRequest.limit < 1 || searchRequest.limit > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100'
      });
    }

    const policies = await policiesService.search(searchRequest);

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      searchCriteria: searchRequest
    });
  } catch (error) {
    console.error('Error searching policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search policies'
    });
  }
});

// Get policies by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const policies = await policiesService.getByCategory(category);

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      category
    });
  } catch (error) {
    console.error('Error fetching policies by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies by category'
    });
  }
});

// Get policies by source
router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const policies = await policiesService.getBySource(source);

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      source
    });
  } catch (error) {
    console.error('Error fetching policies by source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies by source'
    });
  }
});

// Get policies by dosha
router.get('/dosha/:dosha', async (req, res) => {
  try {
    const { dosha } = req.params;

    if (!['vata', 'pitta', 'kapha'].includes(dosha)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dosha type. Must be vata, pitta, or kapha'
      });
    }

    const policies = await policiesService.getByDosha(dosha as 'vata' | 'pitta' | 'kapha');

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      dosha
    });
  } catch (error) {
    console.error('Error fetching policies by dosha:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies by dosha'
    });
  }
});

// Get policies for specific conditions
router.post('/conditions', async (req, res) => {
  try {
    const { conditions } = req.body;

    if (!Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conditions must be a non-empty array'
      });
    }

    const policies = await policiesService.getByConditions(conditions);

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      conditions
    });
  } catch (error) {
    console.error('Error fetching policies by conditions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policies by conditions'
    });
  }
});

// Get seasonal policies
router.get('/season/:season', async (req, res) => {
  try {
    const { season } = req.params;

    if (!['spring', 'summer', 'monsoon', 'autumn', 'winter'].includes(season)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid season. Must be spring, summer, monsoon, autumn, or winter'
      });
    }

    const policies = await policiesService.getBySeason(season as 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter');

    res.json({
      success: true,
      data: policies,
      count: policies.length,
      season
    });
  } catch (error) {
    console.error('Error fetching seasonal policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seasonal policies'
    });
  }
});

// Check diet plan compliance
router.post('/compliance/:dietPlanId/:patientId', async (req, res) => {
  try {
    const { dietPlanId, patientId } = req.params;

    const compliance = await policiesService.checkCompliance(dietPlanId, patientId);

    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    console.error('Error checking compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check diet plan compliance'
    });
  }
});

// Get policy statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await policiesService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching policy statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy statistics'
    });
  }
});

// Create new policy (admin only)
router.post('/', async (req, res) => {
  try {
    const policyData = req.body;

    // Basic validation
    if (!policyData.title || !policyData.category || !policyData.source) {
      return res.status(400).json({
        success: false,
        error: 'Title, category, and source are required'
      });
    }

    const newPolicy = await policiesService.create(policyData);

    res.status(201).json({
      success: true,
      data: newPolicy,
      message: 'Policy created successfully'
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create policy'
    });
  }
});

// Update policy (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await policiesService.update(id, updateData);

    res.json({
      success: true,
      message: 'Policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update policy'
    });
  }
});

// Delete policy (admin only - soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await policiesService.delete(id);

    res.json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete policy'
    });
  }
});

export default router;