import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique patient code (e.g., PAT001A, PAT002B)
export function generatePatientCode(): string {
  const prefix = 'PAT';
  const randomNum = Math.floor(Math.random() * 999) + 1; // 001-999
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return `${prefix}${randomNum.toString().padStart(3, '0')}${randomLetter}`;
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Format time for display
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Calculate BMI
export function calculateBMI(weight: number, height: number): number {
  // height in cm, weight in kg
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

// Get BMI category
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
