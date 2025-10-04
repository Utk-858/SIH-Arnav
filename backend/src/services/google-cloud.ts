import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import axios from 'axios';
import * as dotenv from 'dotenv';

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
export const textToSpeechClient = new TextToSpeechClient({
  keyFilename: googleCredentials,
});

export const speechClient = new SpeechClient({
  keyFilename: googleCredentials,
});

// Utility functions for TTS
export async function synthesizeSpeech(text: string, languageCode = 'en-US', voiceName = 'en-US-Neural2-D'): Promise<Buffer> {
  try {
    const request = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    return response.audioContent as Buffer;
  } catch (error) {
    console.error('TTS synthesis error:', error);
    throw new Error('Failed to synthesize speech');
  }
}

// Utility functions for STT
export async function transcribeAudio(audioBuffer: Buffer, languageCode = 'en-US'): Promise<string> {
  try {
    const request = {
      audio: { content: audioBuffer.toString('base64') },
      config: {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: 16000,
        languageCode,
      },
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join(' ') || '';

    return transcription;
  } catch (error) {
    console.error('STT transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Utility functions for Places/Maps using REST API
export async function searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<any[]> {
  try {
    const params: any = {
      query,
      key: googleApiKey,
    };

    if (location) {
      params.location = `${location.lat},${location.lng}`;
      params.radius = 5000;
    }

    const response = await axios.get(placesSearchUrl, { params });
    return response.data.results || [];
  } catch (error) {
    console.error('Places search error:', error);
    throw new Error('Failed to search places');
  }
}

export async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    const response = await axios.get(placesDetailsUrl, {
      params: {
        place_id: placeId,
        key: googleApiKey,
      },
    });
    return response.data.result;
  } catch (error) {
    console.error('Place details error:', error);
    throw new Error('Failed to get place details');
  }
}