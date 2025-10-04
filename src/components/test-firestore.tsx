"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patientsService, vitalsService } from "@/lib/firestore";
import { usePatients } from "@/hooks/useFirestore";
import { useRealtimeCollection } from "@/hooks/useRealtime";
import type { Patient } from "@/lib/types";

export function TestFirestore() {
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testPatient, setTestPatient] = useState({
    name: "Test Patient",
    age: 30,
    gender: "Male" as const,
    code: "TEST001",
    email: "test@example.com",
    phone: "+1234567890",
    registrationDate: new Date(),
    lastUpdated: new Date(),
  });

  // Test hooks
  const { patients: staticPatients, loading: staticLoading } = usePatients();
  const { data: realtimePatients, loading: realtimeLoading } = useRealtimeCollection<Patient>('patients');

  const testCreatePatient = async () => {
    setIsLoading(true);
    try {
      console.log("Testing patient creation...");
      const patient = await patientsService.create(testPatient);
      console.log("Patient created:", patient);
      setResult(`✅ Patient created! ID: ${patient.id}`);
    } catch (error) {
      console.error("Patient creation failed:", error);
      setResult(`❌ Patient creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testReadPatients = async () => {
    setIsLoading(true);
    try {
      console.log("Testing patients read...");
      const patients = await patientsService.getAll();
      console.log("Patients read:", patients);
      setResult(`✅ Read successful! Found ${patients.length} patients`);
    } catch (error) {
      console.error("Patients read failed:", error);
      setResult(`❌ Patients read failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateVitals = async () => {
    if (staticPatients.length === 0) {
      setResult("❌ No patients found. Create a patient first.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Testing vitals creation...");
      const vitalsData = {
        patientId: staticPatients[0].id,
        recordedBy: 'test-user',
        date: new Date(),
        bloodPressure: { systolic: 120, diastolic: 80 },
        bloodSugar: { fasting: 95, postPrandial: 140 },
        weight: 70,
        height: 170,
        bmi: 24.2,
        temperature: 98.6,
        pulse: 72,
        notes: "Test vitals entry",
      };

      const vitals = await vitalsService.create(vitalsData);
      console.log("Vitals created:", vitals);
      setResult(`✅ Vitals created! ID: ${vitals.id}`);
    } catch (error) {
      console.error("Vitals creation failed:", error);
      setResult(`❌ Vitals creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔥 Firebase Firestore Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Patient Creation */}
          <div className="space-y-2">
            <Label>Test Patient Data</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name"
                value={testPatient.name}
                onChange={(e) => setTestPatient(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Code"
                value={testPatient.code}
                onChange={(e) => setTestPatient(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testCreatePatient} disabled={isLoading}>
              Create Patient
            </Button>
            <Button onClick={testReadPatients} disabled={isLoading} variant="outline">
              Read Patients
            </Button>
            <Button onClick={testCreateVitals} disabled={isLoading}>
              Create Vitals
            </Button>
            <Button
              onClick={() => setResult("")}
              variant="outline"
              disabled={isLoading}
            >
              Clear Results
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="p-3 bg-secondary rounded text-sm font-mono">
              {result}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hook Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Hook Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Static Hook (usePatients):</h4>
            {staticLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <p className="text-sm">{staticPatients.length} patients loaded</p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Real-time Hook (useRealtimeCollection):</h4>
            {realtimeLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <p className="text-sm">{realtimePatients.length} patients (real-time)</p>
            )}
          </div>

          {realtimePatients.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Latest Patients:</h4>
              <div className="space-y-1">
                {realtimePatients.slice(0, 3).map(patient => (
                  <div key={patient.id} className="text-xs bg-secondary p-2 rounded">
                    {patient.name} - {patient.code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Check */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Environment Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</div>
            <div>Firebase Project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</div>
            <div>Firebase Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set'}</div>
            <div>Analytics ID: {process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'Not set'}</div>
            <div>Environment: {process.env.NEXT_PUBLIC_APP_ENV || 'Not set'}</div>
            <div className="mt-4 p-2 bg-secondary rounded text-xs">
              <strong>Current Project:</strong> solveai-ff3af<br/>
              <strong>Status:</strong> ✅ Connected to new Firebase project
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}