// Foods API routes - IFCT integration

import express from 'express';
import ifctService from '../services/ifct';
import { FoodSearchRequest, NutrientRangeRequest } from '../types';

const router = express.Router();

// GET /api/foods/search - Search foods by name
router.get('/search', async (req, res) => {
  try {
    const { query, limit } = req.query as { query: string; limit?: string };

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required and must be at least 2 characters'
      });
    }

    const limitNum = Math.min(parseInt(limit || '10'), 50); // Max 50 results

    const foods = ifctService.findFood(query.trim());

    // Limit results
    const limitedFoods = foods.slice(0, limitNum);

    res.json({
      success: true,
      data: limitedFoods,
      count: limitedFoods.length,
      total: foods.length,
      query: query.trim()
    });
  } catch (error: any) {
    console.error('Error searching foods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search foods',
      message: error.message
    });
  }
});

// GET /api/foods/nutrient - Query foods by nutrient ranges
router.get('/nutrient', async (req, res) => {
  try {
    const { nutrient, min, max, limit } = req.query as {
      nutrient: string;
      min: string;
      max: string;
      limit?: string;
    };

    if (!nutrient) {
      return res.status(400).json({
        success: false,
        error: 'Nutrient parameter is required'
      });
    }

    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    const limitNum = Math.min(parseInt(limit || '10'), 50); // Max 50 results

    if (isNaN(minVal) || isNaN(maxVal)) {
      return res.status(400).json({
        success: false,
        error: 'Min and max must be valid numbers'
      });
    }

    if (minVal > maxVal) {
      return res.status(400).json({
        success: false,
        error: 'Min value cannot be greater than max value'
      });
    }

    const foods = ifctService.findByNutrient(nutrient, minVal, maxVal);

    // Limit results
    const limitedFoods = foods.slice(0, limitNum);

    res.json({
      success: true,
      data: limitedFoods,
      count: limitedFoods.length,
      total: foods.length,
      nutrient,
      range: { min: minVal, max: maxVal }
    });
  } catch (error: any) {
    console.error('Error querying foods by nutrient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query foods by nutrient',
      message: error.message
    });
  }
});

// GET /api/foods/:code - Get specific food by code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const food = ifctService.findByCode(code);

    if (!food) {
      return res.status(404).json({
        success: false,
        error: 'Food not found'
      });
    }

    res.json({
      success: true,
      data: food
    });
  } catch (error: any) {
    console.error('Error fetching food by code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch food',
      message: error.message
    });
  }
});

export default router;