export declare const textToSpeechClient: import("@google-cloud/text-to-speech/build/src/v1").TextToSpeechClient;
export declare const speechClient: import("@google-cloud/speech/build/src/v1").SpeechClient;
export declare function synthesizeSpeech(text: string, languageCode?: string, voiceName?: string): Promise<Buffer>;
export declare function transcribeAudio(audioBuffer: Buffer, languageCode?: string): Promise<string>;
export declare function searchPlaces(query: string, location?: {
    lat: number;
    lng: number;
}): Promise<any[]>;
export declare function getPlaceDetails(placeId: string): Promise<any>;
//# sourceMappingURL=google-cloud.d.ts.map