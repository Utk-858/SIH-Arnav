"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, CheckCircle } from "lucide-react";
import { patientsService, patientFeedbackService, dietPlansService } from "@/lib/firestore";
import type { Patient, DietPlan } from "@/lib/types";

interface PatientFeedbackFormProps {
  // Optional patient ID to pre-select a patient
  patientId?: string;
  // Optional callback when feedback is successfully submitted
  onFeedbackSubmitted?: () => void;
}

export function PatientFeedbackForm({
  patientId,
  onFeedbackSubmitted
}: PatientFeedbackFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);
  const feedbackFormRef = useRef<HTMLFormElement>(null);

  // Common symptoms for checkboxes
  const commonSymptoms = [
    'nausea', 'headache', 'fatigue', 'dizziness', 'stomach_pain',
    'bloating', 'constipation', 'diarrhea', 'indigestion', 'loss_of_appetite'
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const patientsData = await patientsService.getAll();
        setPatients(patientsData);

        // If patientId is provided, pre-select that patient
        if (patientId) {
          const patient = patientsData.find(p => p.id === patientId);
          setSelectedPatient(patient || null);

          if (patient) {
            // Load patient's diet plans
            const plans = await dietPlansService.getByPatient(patient.id);
            setDietPlans(plans);
            // Select the most recent active plan
            const activePlan = plans.find(p => p.isActive) || plans[0];
            setSelectedDietPlan(activePlan || null);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [patientId]);

  const handlePatientChange = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient || null);

    if (patient) {
      try {
        const plans = await dietPlansService.getByPatient(patient.id);
        setDietPlans(plans);
        // Select the most recent active plan
        const activePlan = plans.find(p => p.isActive) || plans[0];
        setSelectedDietPlan(activePlan || null);
      } catch (error) {
        console.error('Error loading diet plans:', error);
      }
    } else {
      setDietPlans([]);
      setSelectedDietPlan(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const patientIdValue = patientId || formData.get('patientId') as string;
      const dietPlanIdValue = formData.get('dietPlanId') as string;

      if (!patientIdValue) {
        toast({
          title: "Patient Required",
          description: "Please select a patient.",
          variant: "destructive",
        });
        return;
      }

      if (!dietPlanIdValue) {
        toast({
          title: "Diet Plan Required",
          description: "Please select a diet plan.",
          variant: "destructive",
        });
        return;
      }

      // Build meal adherence object
      const mealAdherence = {
        breakfast: formData.get('breakfast') === 'on',
        lunch: formData.get('lunch') === 'on',
        dinner: formData.get('dinner') === 'on',
        snacks: formData.get('snacks') === 'on',
      };

      // Build symptoms array from checkboxes and custom input
      const symptoms: string[] = [];
      commonSymptoms.forEach(symptom => {
        if (formData.get(symptom) === 'on') {
          symptoms.push(symptom);
        }
      });

      const customSymptoms = formData.get('customSymptoms') as string;
      if (customSymptoms && customSymptoms.trim()) {
        const customList = customSymptoms.split(',').map(s => s.trim()).filter(s => s);
        symptoms.push(...customList);
      }

      // Build feedback data object
      const feedbackData: any = {
        patientId: patientIdValue,
        dietPlanId: dietPlanIdValue,
        date: new Date(),
        mealAdherence,
        symptoms,
        energyLevel: parseInt(formData.get('energyLevel') as string) as 1 | 2 | 3 | 4 | 5,
        digestion: formData.get('digestion') as 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor',
        waterIntake: parseInt(formData.get('waterIntake') as string) || 0,
        sleepQuality: parseInt(formData.get('sleepQuality') as string) as 1 | 2 | 3 | 4 | 5,
        overallFeeling: formData.get('overallFeeling') as 'much_better' | 'better' | 'same' | 'worse' | 'much_worse',
      };

      // Only add additionalNotes if it has content
      const additionalNotes = (formData.get('additionalNotes') as string)?.trim();
      if (additionalNotes) {
        feedbackData.additionalNotes = additionalNotes;
      }

      await patientFeedbackService.create(feedbackData);

      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been successfully recorded. Thank you for helping us improve your care!",
      });

      // Reset form safely
      if (feedbackFormRef.current) {
        feedbackFormRef.current.reset();
      }

      // If not pre-selected patient, reset selection
      if (!patientId) {
        setSelectedPatient(null);
        setDietPlans([]);
        setSelectedDietPlan(null);
      }

      // Call callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Daily Health Feedback
        </CardTitle>
        <CardDescription>
          Share your daily experience with meals, energy levels, and overall wellbeing to help us optimize your Ayurvedic treatment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={feedbackFormRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection - Only show if not pre-selected */}
          {!patientId && (
            <div className="space-y-2">
              <Label htmlFor="patientId">Select Patient *</Label>
              <select
                id="patientId"
                name="patientId"
                required
                className="w-full p-2 border rounded-md"
                onChange={(e) => handlePatientChange(e.target.value)}
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Diet Plan Selection */}
          {selectedPatient && dietPlans.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="dietPlanId">Diet Plan *</Label>
              <select
                id="dietPlanId"
                name="dietPlanId"
                required
                className="w-full p-2 border rounded-md"
                value={selectedDietPlan?.id || ''}
                onChange={(e) => {
                  const plan = dietPlans.find(p => p.id === e.target.value);
                  setSelectedDietPlan(plan || null);
                }}
              >
                <option value="">Choose a diet plan...</option>
                {dietPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} {plan.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pre-selected patient display */}
          {selectedPatient && (
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Recording feedback for: <span className="font-medium">
                  {selectedPatient.name}
                </span>
                {selectedDietPlan && (
                  <span className="ml-2">
                    • Plan: {selectedDietPlan.title}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Meal Adherence */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Meal Adherence</h3>
            <p className="text-sm text-muted-foreground">
              Check the meals you followed today according to your diet plan.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'breakfast', label: 'Breakfast' },
                { id: 'lunch', label: 'Lunch' },
                { id: 'dinner', label: 'Dinner' },
                { id: 'snacks', label: 'Snacks' },
              ].map((meal) => (
                <div key={meal.id} className="flex items-center space-x-2">
                  <Checkbox id={meal.id} name={meal.id} />
                  <Label htmlFor={meal.id} className="text-sm font-normal">
                    {meal.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Symptoms Experienced Today</h3>
            <p className="text-sm text-muted-foreground">
              Select any symptoms you experienced, or add custom ones below.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {commonSymptoms.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox id={symptom} name={symptom} />
                  <Label htmlFor={symptom} className="text-sm font-normal capitalize">
                    {symptom.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customSymptoms">Other Symptoms (comma-separated)</Label>
              <Input
                id="customSymptoms"
                name="customSymptoms"
                placeholder="e.g., joint pain, skin rash, mood changes"
              />
            </div>
          </div>

          {/* Health Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Health Metrics</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Energy Level */}
              <div className="space-y-3">
                <Label>Energy Level *</Label>
                <RadioGroup name="energyLevel" required className="flex flex-col space-y-2">
                  {[5, 4, 3, 2, 1].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level.toString()} id={`energy-${level}`} />
                      <Label htmlFor={`energy-${level}`} className="text-sm font-normal">
                        {level} - {level === 5 ? 'Excellent' : level === 4 ? 'Good' : level === 3 ? 'Fair' : level === 2 ? 'Low' : 'Very Low'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Sleep Quality */}
              <div className="space-y-3">
                <Label>Sleep Quality *</Label>
                <RadioGroup name="sleepQuality" required className="flex flex-col space-y-2">
                  {[5, 4, 3, 2, 1].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level.toString()} id={`sleep-${level}`} />
                      <Label htmlFor={`sleep-${level}`} className="text-sm font-normal">
                        {level} - {level === 5 ? 'Excellent' : level === 4 ? 'Good' : level === 3 ? 'Fair' : level === 2 ? 'Poor' : 'Very Poor'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Digestion */}
            <div className="space-y-2">
              <Label htmlFor="digestion">Digestion Quality *</Label>
              <select
                id="digestion"
                name="digestion"
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">How was your digestion today?</option>
                <option value="excellent">Excellent - Smooth and comfortable</option>
                <option value="good">Good - Mostly comfortable</option>
                <option value="fair">Fair - Some discomfort</option>
                <option value="poor">Poor - Significant discomfort</option>
                <option value="very_poor">Very Poor - Severe issues</option>
              </select>
            </div>

            {/* Water Intake */}
            <div className="space-y-2">
              <Label htmlFor="waterIntake">Water Intake (glasses per day) *</Label>
              <Input
                id="waterIntake"
                name="waterIntake"
                type="number"
                min="0"
                max="20"
                required
                placeholder="e.g., 8"
              />
            </div>

            {/* Overall Feeling */}
            <div className="space-y-2">
              <Label htmlFor="overallFeeling">Overall Feeling Compared to Yesterday *</Label>
              <select
                id="overallFeeling"
                name="overallFeeling"
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">How do you feel compared to yesterday?</option>
                <option value="much_better">Much Better</option>
                <option value="better">Better</option>
                <option value="same">About the Same</option>
                <option value="worse">Worse</option>
                <option value="much_worse">Much Worse</option>
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              placeholder="Any other observations, concerns, or feedback about your treatment..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              "Submitting..."
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Daily Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}