export type Meal = {
    time: string;
    name: string;
    items: string[];
    notes?: string;
};
export type DietDay = {
    day: string;
    meals: Meal[];
};
export type Patient = {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    code: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    dietaryHabits?: string;
    allergies?: string[];
    medicalHistory?: string;
    currentMedications?: string;
    doshaType?: 'Vata' | 'Pitta' | 'Kapha' | 'Mixed';
    hospitalId?: string;
    dietitianId?: string;
    registrationDate: Date;
    lastUpdated: Date;
};
export type Role = 'patient' | 'dietitian' | 'hospital-admin';
export type Rasa = 'Sweet' | 'Sour' | 'Salty' | 'Bitter' | 'Pungent' | 'Astringent';
export type Virya = 'Hot' | 'Cold';
export type Guna = 'Heavy' | 'Light' | 'Oily' | 'Dry' | 'Sharp' | 'Dull' | 'Static' | 'Mobile' | 'Soft' | 'Hard' | 'Clear' | 'Sticky';
export type Vipaka = 'Sweet' | 'Sour' | 'Pungent';
export type DoshaEffect = 'Vata-pacifying' | 'Vata-aggravating' | 'Pitta-pacifying' | 'Pitta-aggravating' | 'Kapha-pacifying' | 'Kapha-aggravating' | 'Tridoshic';
export interface NutritionalData {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    vitaminC?: number;
    vitaminA?: number;
}
export interface AyurvedicProperties {
    rasa: Rasa[];
    virya: Virya;
    guna: Guna[];
    vipaka: Vipaka;
    doshaEffect: DoshaEffect[];
    digestibility: 'Easy' | 'Moderate' | 'Difficult';
    seasonalSuitability?: ('Spring' | 'Summer' | 'Monsoon' | 'Autumn' | 'Winter')[];
    potency?: 'Mild' | 'Moderate' | 'Strong';
}
export interface FoodItem {
    id: string;
    name: string;
    category: 'Vegetable' | 'Fruit' | 'Grain' | 'Dairy' | 'Meat' | 'Spice' | 'Oil' | 'Sweetener' | 'Beverage' | 'Other';
    nutritionalData: NutritionalData;
    ayurvedicProperties: AyurvedicProperties;
    commonAlternatives?: string[];
    regionalVariations?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
export interface MessMenuItem {
    foodId?: string;
    name: string;
    quantity?: string;
    portion?: string;
    isAvailable: boolean;
    nutritionalData?: NutritionalData;
    ayurvedicProperties?: AyurvedicProperties;
    notes?: string;
}
export interface MessMenu {
    id: string;
    hospitalId: string;
    date: Date;
    meals: {
        breakfast: MessMenuItem[];
        lunch: MessMenuItem[];
        dinner: MessMenuItem[];
        snacks: MessMenuItem[];
    };
    createdBy: string;
    lastUpdated: Date;
    isActive: boolean;
    version: number;
    nutritionalSummary?: {
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
    };
}
export type DietPlan = {
    id: string;
    patientId: string;
    dietitianId: string;
    title: string;
    description: string;
    dietDays: DietDay[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
};
export type Consultation = {
    id: string;
    patientId: string;
    dietitianId: string;
    date: Date;
    notes: string;
    recommendations: string;
    followUpDate?: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
};
export type MealTracking = {
    id: string;
    patientId: string;
    dietPlanId: string;
    mealId: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    scheduledDate: Date;
    givenBy?: string;
    givenAt?: Date;
    eatenBy?: 'patient' | 'family' | 'not_eaten';
    eatenAt?: Date;
    quantity?: 'full' | 'half' | 'quarter' | 'none';
    notes?: string;
    status: 'scheduled' | 'given' | 'eaten' | 'skipped' | 'modified';
};
export type PatientFeedback = {
    id: string;
    patientId: string;
    dietPlanId: string;
    date: Date;
    mealAdherence: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
        snacks: boolean;
    };
    symptoms: string[];
    energyLevel: 1 | 2 | 3 | 4 | 5;
    digestion: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
    waterIntake: number;
    sleepQuality: 1 | 2 | 3 | 4 | 5;
    overallFeeling: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
    additionalNotes?: string;
};
export type Vitals = {
    id: string;
    patientId: string;
    recordedBy: string;
    date: Date;
    bloodPressure: {
        systolic: number;
        diastolic: number;
    };
    bloodSugar?: {
        fasting: number;
        postPrandial?: number;
    };
    thyroid?: {
        tsh: number;
        t3?: number;
        t4?: number;
    };
    cholesterol?: {
        total: number;
        hdl: number;
        ldl: number;
        triglycerides: number;
    };
    bmi: number;
    weight: number;
    height: number;
    temperature?: number;
    pulse?: number;
    notes?: string;
};
export type User = {
    uid: string;
    email: string;
    displayName: string;
    role: 'patient' | 'dietitian' | 'hospital-admin';
    hospitalId?: string;
    patientId?: string;
    createdAt: Date;
    lastLogin: Date;
};
export type Hospital = {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    adminId: string;
    createdAt: Date;
};
export interface IFCFood {
    code: string;
    name: string;
    scie: string;
    regn: number;
    [key: string]: string | number;
}
export interface FoodSearchRequest {
    query: string;
    limit?: number;
}
export interface NutrientRangeRequest {
    nutrient: string;
    min: number;
    max: number;
    limit?: number;
}
//# sourceMappingURL=types.d.ts.map