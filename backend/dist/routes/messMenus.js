"use strict";
// Mess Menus API routes
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messMenus_1 = require("../services/messMenus");
const redis_1 = require("../services/redis");
const router = express_1.default.Router();
// GET /api/messMenus - Get all mess menus
router.get('/', async (req, res) => {
    try {
        // Check cache first
        const cacheKey = 'messMenus:all';
        let messMenus = await redis_1.redisService.get(cacheKey);
        if (!messMenus) {
            // Fetch from Firestore
            messMenus = await messMenus_1.messMenusService.getAll();
            // Cache for 30 minutes
            await redis_1.redisService.setWithTTL(cacheKey, messMenus, 1800);
        }
        res.json({
            success: true,
            data: messMenus,
            cached: messMenus !== null
        });
    }
    catch (error) {
        console.error('Error fetching mess menus:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mess menus',
            message: error.message
        });
    }
});
// GET /api/messMenus/:id - Get mess menu by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Check cache first
        let messMenu = await redis_1.redisService.get(id);
        if (!messMenu) {
            // Fetch from Firestore
            messMenu = await messMenus_1.messMenusService.getById(id);
            if (messMenu) {
                // Cache for 1 hour
                await redis_1.redisService.setWithTTL(id, messMenu, 3600);
            }
        }
        if (!messMenu) {
            return res.status(404).json({
                success: false,
                error: 'Mess menu not found'
            });
        }
        res.json({
            success: true,
            data: messMenu,
            cached: messMenu !== null
        });
    }
    catch (error) {
        console.error('Error fetching mess menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mess menu',
            message: error.message
        });
    }
});
// GET /api/messMenus/hospital/:hospitalId - Get mess menus by hospital
router.get('/hospital/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        // Check cache first
        const cacheKey = `messMenus:hospital:${hospitalId}`;
        let messMenus = await redis_1.redisService.get(cacheKey);
        if (!messMenus) {
            // Fetch from Firestore
            messMenus = await messMenus_1.messMenusService.getByHospital(hospitalId);
            // Cache for 30 minutes
            await redis_1.redisService.setWithTTL(cacheKey, messMenus, 1800);
        }
        res.json({
            success: true,
            data: messMenus,
            cached: messMenus !== null
        });
    }
    catch (error) {
        console.error('Error fetching mess menus by hospital:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mess menus',
            message: error.message
        });
    }
});
// GET /api/messMenus/hospital/:hospitalId/date/:date - Get mess menu by date and hospital
router.get('/hospital/:hospitalId/date/:date', async (req, res) => {
    try {
        const { hospitalId, date } = req.params;
        const menuDate = new Date(date);
        // Check cache first
        const cacheKey = `messMenus:hospital:${hospitalId}:date:${date}`;
        let messMenu = await redis_1.redisService.get(cacheKey);
        if (!messMenu) {
            // Fetch from Firestore
            const menus = await messMenus_1.messMenusService.getByDateAndHospital(menuDate, hospitalId);
            messMenu = menus.length > 0 ? menus[0] : null;
            if (messMenu) {
                // Cache for 1 hour
                await redis_1.redisService.setWithTTL(cacheKey, messMenu, 3600);
            }
        }
        if (!messMenu) {
            return res.status(404).json({
                success: false,
                error: 'Mess menu not found for the specified date and hospital'
            });
        }
        res.json({
            success: true,
            data: messMenu,
            cached: messMenu !== null
        });
    }
    catch (error) {
        console.error('Error fetching mess menu by date and hospital:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mess menu',
            message: error.message
        });
    }
});
// POST /api/messMenus - Create new mess menu
router.post('/', async (req, res) => {
    try {
        const menuData = req.body;
        // Validate required fields
        if (!menuData.hospitalId || !menuData.date || !menuData.meals || !menuData.createdBy) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: hospitalId, date, meals, createdBy'
            });
        }
        // Validate meals structure
        if (!menuData.meals.breakfast || !menuData.meals.lunch || !menuData.meals.dinner || !menuData.meals.snacks) {
            return res.status(400).json({
                success: false,
                error: 'Meals must include breakfast, lunch, dinner, and snacks'
            });
        }
        // Set defaults
        if (menuData.isActive === undefined)
            menuData.isActive = true;
        if (!menuData.version)
            menuData.version = 1;
        if (!menuData.lastUpdated)
            menuData.lastUpdated = new Date();
        const newMenu = await messMenus_1.messMenusService.create(menuData);
        // Invalidate cache
        await redis_1.redisService.delete('messMenus:all');
        res.status(201).json({
            success: true,
            data: newMenu,
            message: 'Mess menu created successfully'
        });
    }
    catch (error) {
        console.error('Error creating mess menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create mess menu',
            message: error.message
        });
    }
});
// PUT /api/messMenus/:id - Update mess menu
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Update version and lastUpdated
        updateData.version = (updateData.version || 0) + 1;
        updateData.lastUpdated = new Date();
        await messMenus_1.messMenusService.update(id, updateData);
        // Invalidate cache
        await redis_1.redisService.delete(`messMenus:${id}`);
        await redis_1.redisService.delete('messMenus:all');
        res.json({
            success: true,
            message: 'Mess menu updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating mess menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update mess menu',
            message: error.message
        });
    }
});
// DELETE /api/messMenus/:id - Delete mess menu
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await messMenus_1.messMenusService.delete(id);
        // Invalidate cache
        await redis_1.redisService.delete(`messMenus:${id}`);
        await redis_1.redisService.delete('messMenus:all');
        res.json({
            success: true,
            message: 'Mess menu deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting mess menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete mess menu',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=messMenus.js.map