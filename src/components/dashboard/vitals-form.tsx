"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "../ui/label";
import { HeartPulse } from "lucide-react";
import { patientsService, vitalsService } from "@/lib/firestore";
import type { Patient } from "@/lib/types";

interface VitalsFormProps {
  // Optional patient ID to pre-select a patient
  patientId?: string;
  // Optional callback when vitals are successfully recorded
  onVitalsRecorded?: (patientId: string) => void;
  // Whether to show patient selection (for dietitians) or hide it (for hospital staff)
  showPatientSelection?: boolean;
}

export function VitalsForm({
  patientId,
  onVitalsRecorded,
  showPatientSelection = true
}: VitalsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const vitalsFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await patientsService.getAll();
        setPatients(patientsData);

        // If patientId is provided, pre-select that patient
        if (patientId) {
          const patient = patientsData.find(p => p.id === patientId);
          setSelectedPatient(patient || null);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    loadPatients();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const patientIdValue = patientId || formData.get('patientId') as string;

      if (!patientIdValue) {
        toast({
          title: "Patient Required",
          description: "Please select a patient.",
          variant: "destructive",
        });
        return;
      }

      // Build vitals data object, filtering out undefined values
      const vitalsData: any = {
        patientId: patientIdValue,
        recordedBy: showPatientSelection ? 'dietitian' : 'hospital-staff', // Should come from auth context
        date: new Date(),
        bloodPressure: {
          systolic: parseInt(formData.get('systolic') as string) || 0,
          diastolic: parseInt(formData.get('diastolic') as string) || 0,
        },
        bmi: parseFloat(formData.get('bmi') as string) || 0,
        weight: parseFloat(formData.get('weight') as string) || 0,
        height: parseFloat(formData.get('height') as string) || 0,
      };

      // Add optional blood sugar data
      const fastingBloodSugar = formData.get('fastingBloodSugar');
      const postPrandialBloodSugar = formData.get('postPrandialBloodSugar');
      if (fastingBloodSugar) {
        vitalsData.bloodSugar = {
          fasting: parseFloat(fastingBloodSugar as string) || 0,
        };
        if (postPrandialBloodSugar) {
          vitalsData.bloodSugar.postPrandial = parseFloat(postPrandialBloodSugar as string);
        }
      }

      // Add optional thyroid data
      const tsh = formData.get('tsh');
      if (tsh) {
        vitalsData.thyroid = {
          tsh: parseFloat(tsh as string) || 0,
        };
        const t3 = formData.get('t3');
        const t4 = formData.get('t4');
        if (t3) vitalsData.thyroid.t3 = parseFloat(t3 as string);
        if (t4) vitalsData.thyroid.t4 = parseFloat(t4 as string);
      }

      // Add optional cholesterol data
      const totalCholesterol = formData.get('totalCholesterol');
      if (totalCholesterol) {
        vitalsData.cholesterol = {
          total: parseFloat(totalCholesterol as string) || 0,
          hdl: parseFloat(formData.get('hdl') as string) || 0,
          ldl: parseFloat(formData.get('ldl') as string) || 0,
          triglycerides: parseFloat(formData.get('triglycerides') as string) || 0,
        };
      }

      // Add optional temperature
      const temperature = formData.get('temperature');
      if (temperature) {
        vitalsData.temperature = parseFloat(temperature as string);
      }

      // Add optional pulse
      const pulse = formData.get('pulse');
      if (pulse) {
        vitalsData.pulse = parseInt(pulse as string);
      }

      // Add optional notes
      const notes = formData.get('notes') as string;
      if (notes && notes.trim()) {
        vitalsData.notes = notes.trim();
      }

      await vitalsService.create(vitalsData);

      toast({
        title: "Vitals Recorded",
        description: "Patient vitals have been successfully recorded.",
      });

      // Reset form safely
      if (vitalsFormRef.current) {
        vitalsFormRef.current.reset();
      }

      // If not pre-selected patient, reset selection
      if (!patientId) {
        setSelectedPatient(null);
      }

      // Call callback if provided
      if (onVitalsRecorded) {
        onVitalsRecorded(patientIdValue);
      }

    } catch (error) {
      console.error('Error recording vitals:', error);
      toast({
        title: "Recording Failed",
        description: "There was an error recording the vitals. Please try again.",
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
          <HeartPulse className="h-5 w-5" />
          Record Patient Vitals
        </CardTitle>
        <CardDescription>
          Record vital signs and medical measurements for patients.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={vitalsFormRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection - Only show if showPatientSelection is true */}
          {showPatientSelection && !patientId && (
            <div className="space-y-2">
              <Label htmlFor="patientId">Select Patient *</Label>
              <select
                id="patientId"
                name="patientId"
                required
                className="w-full p-2 border rounded-md"
                onChange={(e) => {
                  const patient = patients.find(p => p.id === e.target.value);
                  setSelectedPatient(patient || null);
                }}
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

          {/* Pre-selected patient display */}
          {(selectedPatient || patientId) && (
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Recording vitals for: <span className="font-medium">
                  {selectedPatient?.name || 'Selected Patient'}
                </span>
              </p>
            </div>
          )}

          {/* Vital Signs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vital Signs</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input id="weight" name="weight" type="number" step="0.1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input id="height" name="height" type="number" step="0.1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI *</Label>
                <Input id="bmi" name="bmi" type="number" step="0.1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input id="temperature" name="temperature" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pulse">Pulse Rate (bpm)</Label>
                <Input id="pulse" name="pulse" type="number" />
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="space-y-2">
              <Label>Blood Pressure (mmHg) *</Label>
              <div className="flex gap-2">
                <Input
                  name="systolic"
                  placeholder="Systolic"
                  type="number"
                  required
                  className="flex-1"
                />
                <span className="flex items-center">/</span>
                <Input
                  name="diastolic"
                  placeholder="Diastolic"
                  type="number"
                  required
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Blood Tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Blood Tests</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fastingBloodSugar">Fasting Blood Sugar (mg/dL)</Label>
                <Input id="fastingBloodSugar" name="fastingBloodSugar" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postPrandialBloodSugar">Post-Prandial Blood Sugar (mg/dL)</Label>
                <Input id="postPrandialBloodSugar" name="postPrandialBloodSugar" type="number" step="0.1" />
              </div>
            </div>

            {/* Thyroid */}
            <div className="space-y-2">
              <Label>Thyroid Profile</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input name="tsh" placeholder="TSH (μIU/mL)" type="number" step="0.01" />
                <Input name="t3" placeholder="T3 (ng/dL)" type="number" step="0.01" />
                <Input name="t4" placeholder="T4 (μg/dL)" type="number" step="0.01" />
              </div>
            </div>

            {/* Cholesterol */}
            <div className="space-y-2">
              <Label>Lipid Profile</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input name="totalCholesterol" placeholder="Total (mg/dL)" type="number" />
                <Input name="hdl" placeholder="HDL (mg/dL)" type="number" />
                <Input name="ldl" placeholder="LDL (mg/dL)" type="number" />
                <Input name="triglycerides" placeholder="Triglycerides (mg/dL)" type="number" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional observations, symptoms, or medical notes..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Recording..." : "Record Vitals"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}