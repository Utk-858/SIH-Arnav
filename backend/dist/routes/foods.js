"use strict";
// Foods API routes - IFCT integration
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ifct_1 = __importDefault(require("../services/ifct"));
const router = express_1.default.Router();
// GET /api/foods/search - Search foods by name
router.get('/search', async (req, res) => {
    try {
        const { query, limit } = req.query;
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter is required and must be at least 2 characters'
            });
        }
        const limitNum = Math.min(parseInt(limit || '10'), 50); // Max 50 results
        const foods = ifct_1.default.findFood(query.trim());
        // Limit results
        const limitedFoods = foods.slice(0, limitNum);
        res.json({
            success: true,
            data: limitedFoods,
            count: limitedFoods.length,
            total: foods.length,
            query: query.trim()
        });
    }
    catch (error) {
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
        const { nutrient, min, max, limit } = req.query;
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
        const foods = ifct_1.default.findByNutrient(nutrient, minVal, maxVal);
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
    }
    catch (error) {
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
        const food = ifct_1.default.findByCode(code);
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
    }
    catch (error) {
        console.error('Error fetching food by code:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch food',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=foods.js.map