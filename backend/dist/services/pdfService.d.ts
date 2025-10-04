import { DietPlan, Patient } from '../types';
export declare class PDFService {
    private static browser;
    private static getBrowser;
    static generateDietChartPDF(dietPlan: DietPlan, patient: Patient): Promise<Uint8Array>;
    private static getFoodItemsForDietPlan;
    private static calculateNutritionalSummary;
    private static extractQuantity;
    private static generateDietChartHTML;
    static closeBrowser(): Promise<void>;
}
//# sourceMappingURL=pdfService.d.ts.map