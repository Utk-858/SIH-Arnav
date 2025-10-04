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

// Ayurvedic Properties
export type Rasa = 'Sweet' | 'Sour' | 'Salty' | 'Bitter' | 'Pungent' | 'Astringent';
export type Virya = 'Hot' | 'Cold';
export type Guna = 'Heavy' | 'Light' | 'Oily' | 'Dry' | 'Sharp' | 'Dull' | 'Static' | 'Mobile' | 'Soft' | 'Hard' | 'Clear' | 'Sticky';
export type Vipaka = 'Sweet' | 'Sour' | 'Pungent';
export type DoshaEffect = 'Vata-pacifying' | 'Vata-aggravating' | 'Pitta-pacifying' | 'Pitta-aggravating' | 'Kapha-pacifying' | 'Kapha-aggravating' | 'Tridoshic';

// Nutritional Data
export interface NutritionalData {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  potassium?: number; // mg
  calcium?: number; // mg
  iron?: number; // mg
  vitaminC?: number; // mg
  vitaminA?: number; // IU
}

// Ayurvedic Properties
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

// Food Item in Database
export interface FoodItem {
  id: string;
  name: string;
  category: 'Vegetable' | 'Fruit' | 'Grain' | 'Dairy' | 'Meat' | 'Spice' | 'Oil' | 'Sweetener' | 'Beverage' | 'Other';
  nutritionalData: NutritionalData;
  ayurvedicProperties: AyurvedicProperties;
  commonAlternatives?: string[]; // IDs of alternative foods
  regionalVariations?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Mess Menu Item
export interface MessMenuItem {
  foodId?: string; // Reference to FoodItem
  name: string;
  quantity?: string; // e.g., "100g", "1 cup"
  portion?: string; // e.g., "small", "medium", "large"
  isAvailable: boolean;
  nutritionalData?: NutritionalData;
  ayurvedicProperties?: AyurvedicProperties;
  notes?: string; // Special preparation notes
}

// Mess Menu Structure
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
  version: number; // For tracking changes
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
  mealId: string; // References a specific meal in the diet plan
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  scheduledDate: Date;
  givenBy?: string; // Hospital staff who gave the meal
  givenAt?: Date;
  eatenBy?: 'patient' | 'family' | 'not_eaten';
  eatenAt?: Date;
  quantity?: 'full' | 'half' | 'quarter' | 'none';
  notes?: string; // Remarks like "patient requested lighter portion"
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
  symptoms: string[]; // e.g., ['nausea', 'headache', 'fatigue']
  energyLevel: 1 | 2 | 3 | 4 | 5; // 1=Very Low, 5=Excellent
  digestion: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  waterIntake: number; // glasses per day
  sleepQuality: 1 | 2 | 3 | 4 | 5; // 1=Very Poor, 5=Excellent
  overallFeeling: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
  additionalNotes?: string;
};


export type Vitals = {
  id: string;
  patientId: string;
  recordedBy: string; // nurse/doctor ID
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

// IFCT Food Database Types
export interface IFCFood {
  code: string;
  name: string;
  scie: string; // Scientific name
  regn: number; // Region code
  [key: string]: string | number; // All nutrient columns
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

// Notification Types
export type NotificationType = 'meal_reminder' | 'water_intake' | 'diet_notes' | 'diet_plan_delivery' | 'diet_plan_activation' | 'general';

export interface Notification {
  id: string;
  userId: string; // patient, dietitian, or hospital-admin uid
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    waterTarget?: number;
    dietPlanId?: string;
    patientId?: string;
    [key: string]: any;
  };
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  mealReminders: boolean;
  waterReminders: boolean;
  dietNotes: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  reminderTimes: {
    breakfast: string; // HH:MM format
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  waterReminderInterval: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

// AYUSH Policy and Guidelines Types
export type PolicyCategory = 'dietary_guidelines' | 'treatment_protocols' | 'seasonal_recommendations' | 'dosha_management' | 'food_combinations' | 'lifestyle_guidance' | 'preventive_care' | 'therapeutic_diets';

export type PolicySource = 'ministry_of_ayush' | 'ccras' | 'nimbu' | 'classical_texts' | 'research_studies' | 'expert_consensus';

export interface PolicyDocument {
  id: string;
  title: string;
  category: PolicyCategory;
  source: PolicySource;
  referenceNumber?: string; // Official reference number/citation
  summary: string;
  fullContent: string;
  keyPrinciples: string[];
  applicableConditions?: string[]; // Health conditions this applies to
  targetAudience?: ('dietitians' | 'doctors' | 'patients' | 'hospital_staff')[];
  tags: string[]; // For searchability
  doshaRelevance?: {
    vata: boolean;
    pitta: boolean;
    kapha: boolean;
  };
  seasonalRelevance?: ('spring' | 'summer' | 'monsoon' | 'autumn' | 'winter')[];
  effectiveDate: Date;
  lastReviewed?: Date;
  isActive: boolean;
  createdBy: string; // Dietitian or admin who added it
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicySearchRequest {
  query?: string;
  category?: PolicyCategory;
  source?: PolicySource;
  tags?: string[];
  doshaType?: 'vata' | 'pitta' | 'kapha';
  season?: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';
  conditions?: string[];
  limit?: number;
}

export interface PolicyComplianceCheck {
  policyId: string;
  policyTitle: string;
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
  violations?: string[];
  recommendations?: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface DietPlanCompliance {
  dietPlanId: string;
  patientId: string;
  overallCompliance: 'compliant' | 'partial' | 'non_compliant';
  policyChecks: PolicyComplianceCheck[];
  generatedAt: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}
