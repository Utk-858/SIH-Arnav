"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechClient = exports.textToSpeechClient = void 0;
exports.synthesizeSpeech = synthesizeSpeech;
exports.transcribeAudio = transcribeAudio;
exports.searchPlaces = searchPlaces;
exports.getPlaceDetails = getPlaceDetails;
const text_to_speech_1 = require("@google-cloud/text-to-speech");
const speech_1 = require("@google-cloud/speech");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const googleApiKey = process.env.GOOGLE_API_KEY;
const placesSearchUrl = process.env.GOOGLE_PLACES_SEARCH_URL || 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const placesDetailsUrl = process.env.GOOGLE_PLACES_DETAILS_URL || 'https://maps.googleapis.com/maps/api/place/details/json';
if (!googleCredentials) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
}
if (!googleApiKey) {
    throw new Error('GOOGLE_API_KEY not set');
}
// Initialize Google Cloud clients
exports.textToSpeechClient = new text_to_speech_1.TextToSpeechClient({
    keyFilename: googleCredentials,
});
exports.speechClient = new speech_1.SpeechClient({
    keyFilename: googleCredentials,
});
// Utility functions for TTS
async function synthesizeSpeech(text, languageCode = 'en-US', voiceName = 'en-US-Neural2-D') {
    try {
        const request = {
            input: { text },
            voice: { languageCode, name: voiceName },
            audioConfig: { audioEncoding: 'MP3' },
        };
        const [response] = await exports.textToSpeechClient.synthesizeSpeech(request);
        return response.audioContent;
    }
    catch (error) {
        console.error('TTS synthesis error:', error);
        throw new Error('Failed to synthesize speech');
    }
}
// Utility functions for STT
async function transcribeAudio(audioBuffer, languageCode = 'en-US') {
    try {
        const request = {
            audio: { content: audioBuffer.toString('base64') },
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode,
            },
        };
        const [response] = await exports.speechClient.recognize(request);
        const transcription = response.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .join(' ') || '';
        return transcription;
    }
    catch (error) {
        console.error('STT transcription error:', error);
        throw new Error('Failed to transcribe audio');
    }
}
// Utility functions for Places/Maps using REST API
async function searchPlaces(query, location) {
    try {
        const params = {
            query,
            key: googleApiKey,
        };
        if (location) {
            params.location = `${location.lat},${location.lng}`;
            params.radius = 5000;
        }
        const response = await axios_1.default.get(placesSearchUrl, { params });
        return response.data.results || [];
    }
    catch (error) {
        console.error('Places search error:', error);
        throw new Error('Failed to search places');
    }
}
async function getPlaceDetails(placeId) {
    try {
        const response = await axios_1.default.get(placesDetailsUrl, {
            params: {
                place_id: placeId,
                key: googleApiKey,
            },
        });
        return response.data.result;
    }
    catch (error) {
        console.error('Place details error:', error);
        throw new Error('Failed to get place details');
    }
}
//# sourceMappingURL=google-cloud.js.map