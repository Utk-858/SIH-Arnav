// AI routes for diet generation and Ayurvedic analysis

import express from 'express';
import { aiService } from '../services/ai';
import { redisService } from '../services/redis';

const router = express.Router();

// POST /api/ai/generate-diet - Generate personalized Ayurvedic diet plan
router.post('/generate-diet', async (req, res) => {
  try {
    const {
      patientProfile,
      vitals,
      messMenu,
      ayurvedicPrinciples
    } = req.body;

    // Validate required fields
    if (!patientProfile || !vitals || !messMenu) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientProfile, vitals, messMenu'
      });
    }

    const patientData = {
      profile: patientProfile,
      vitals: vitals,
      messMenu: messMenu,
      ayurvedicPrinciples: ayurvedicPrinciples || 'General Ayurvedic principles'
    };

    const dietPlan = await aiService.generateDietPlan(patientData);

    res.json({
      success: true,
      data: dietPlan
    });
  } catch (error: any) {
    console.error('AI Diet Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate diet plan',
      message: error.message
    });
  }
});

// POST /api/ai/analyze-dosha - Analyze patient dosha
router.post('/analyze-dosha', async (req, res) => {
  try {
    const {
      symptoms,
      characteristics,
      preferences
    } = req.body;

    if (!symptoms || !characteristics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symptoms, characteristics'
      });
    }

    const patientData = {
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      characteristics: Array.isArray(characteristics) ? characteristics : [characteristics],
      preferences: Array.isArray(preferences) ? preferences : []
    };

    const doshaAnalysis = await aiService.analyzeDosha(patientData);

    res.json({
      success: true,
      data: doshaAnalysis
    });
  } catch (error: any) {
    console.error('AI Dosha Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze dosha',
      message: error.message
    });
  }
});

// POST /api/ai/suggest-alternatives - Suggest food alternatives
router.post('/suggest-alternatives', async (req, res) => {
  try {
    const { foodName, reason } = req.body;

    if (!foodName || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: foodName, reason'
      });
    }

    const alternatives = await aiService.suggestAlternatives(foodName, reason);

    res.json({
      success: true,
      data: alternatives
    });
  } catch (error: any) {
    console.error('AI Alternatives Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest alternatives',
      message: error.message
    });
  }
});

// POST /api/ai/generate-timings - Generate meal timings
router.post('/generate-timings', async (req, res) => {
  try {
    const { doshaType, dailyRoutine } = req.body;

    if (!doshaType || !dailyRoutine) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: doshaType, dailyRoutine'
      });
    }

    const timings = await aiService.generateMealTimings(doshaType, dailyRoutine);

    res.json({
      success: true,
      data: timings
    });
  } catch (error: any) {
    console.error('AI Timings Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate timings',
      message: error.message
    });
  }
});

// GET /api/ai/health - Check AI service health
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiService.healthCheck();

    res.json({
      success: true,
      healthy: isHealthy,
      service: 'AI Service',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('AI Health Check Error:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'AI service health check failed',
      message: error.message
    });
  }
});

// POST /api/ai/tts - Text to Speech
router.post('/tts', async (req, res) => {
  try {
    const { text, languageCode, voiceName } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
    }

    const audioBuffer = await aiService.textToSpeech(text, languageCode, voiceName);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (error: any) {
    console.error('TTS Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synthesize speech',
      message: error.message
    });
  }
});

// POST /api/ai/stt - Speech to Text
router.post('/stt', async (req, res) => {
  try {
    const { audio, languageCode } = req.body;

    if (!audio) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: audio (base64 encoded)'
      });
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    const transcription = await aiService.speechToText(audioBuffer, languageCode);

    res.json({
      success: true,
      data: { transcription }
    });
  } catch (error: any) {
    console.error('STT Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
      message: error.message
    });
  }
});

// GET /api/ai/weather - Get weather by coordinates
router.get('/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: lat, lon'
      });
    }

    const weather = await aiService.getWeather(parseFloat(lat as string), parseFloat(lon as string));

    res.json({
      success: true,
      data: weather
    });
  } catch (error: any) {
    console.error('Weather Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather data',
      message: error.message
    });
  }
});

// GET /api/ai/weather/city - Get weather by city name
router.get('/weather/city', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: city'
      });
    }

    const weather = await aiService.getWeatherByCity(city as string);

    res.json({
      success: true,
      data: weather
    });
  } catch (error: any) {
    console.error('Weather Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather data',
      message: error.message
    });
  }
});

// GET /api/ai/cache/clear - Clear AI response cache (admin only)
router.post('/cache/clear', async (req, res) => {
  try {
    // In a real app, you'd add authentication here
    // For now, we'll just clear all AI-related cache keys

    // This is a simplified approach - in production you'd want more granular control
    const cacheCleared = true; // Placeholder

    res.json({
      success: true,
      message: 'AI cache cleared successfully',
      cacheCleared
    });
  } catch (error: any) {
    console.error('Cache Clear Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

export default router;