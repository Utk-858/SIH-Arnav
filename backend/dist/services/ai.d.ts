declare class AIService {
    private model;
    constructor();
    /**
     * Extract food names from diet plan text
     */
    private extractFoodNames;
    /**
     * Get nutritional data for foods from IFCT database
     */
    private getNutritionalData;
    /**
     * Get relevant AYUSH policies for diet plan generation
     */
    private getRelevantPolicies;
    /**
     * Generate personalized Ayurvedic diet plan
     */
    generateDietPlan(patientData: {
        profile: any;
        vitals: any;
        messMenu: any;
        ayurvedicPrinciples: string;
    }): Promise<{
        dietChart: string;
        recommendations: string[];
        warnings: string[];
        nutritionalData?: any[];
        policyCompliance?: any;
    }>;
    /**
     * Analyze patient dosha based on symptoms and characteristics
     */
    analyzeDosha(patientData: {
        symptoms: string[];
        characteristics: string[];
        preferences: string[];
    }): Promise<{
        primaryDosha: 'Vata' | 'Pitta' | 'Kapha';
        secondaryDosha?: 'Vata' | 'Pitta' | 'Kapha';
        imbalanceScore: number;
        recommendations: string[];
    }>;
    /**
     * Suggest food alternatives based on Ayurvedic principles
     */
    suggestAlternatives(foodName: string, reason: string): Promise<{
        alternatives: Array<{
            name: string;
            reason: string;
            ayurvedicBenefit: string;
        }>;
    }>;
    /**
     * Generate meal timing recommendations
     */
    generateMealTimings(doshaType: string, dailyRoutine: string): Promise<{
        schedule: Array<{
            meal: string;
            time: string;
            notes: string;
        }>;
        rationale: string;
    }>;
    /**
      * Synthesize speech from text using Google TTS
      */
    textToSpeech(text: string, languageCode?: string, voiceName?: string): Promise<Buffer>;
    /**
      * Transcribe audio to text using Google STT
      */
    speechToText(audioBuffer: Buffer, languageCode?: string): Promise<string>;
    /**
      * Get current weather data
      */
    getWeather(lat: number, lon: number): Promise<any>;
    /**
      * Get weather by city name
      */
    getWeatherByCity(city: string): Promise<any>;
    /**
      * Health check for AI service
      */
    healthCheck(): Promise<boolean>;
}
export declare const aiService: AIService;
export default aiService;
//# sourceMappingURL=ai.d.ts.map