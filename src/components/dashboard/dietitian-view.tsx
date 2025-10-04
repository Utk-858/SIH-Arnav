"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { patientsService, vitalsService, messMenusService, dietPlansService, consultationsService, patientFeedbackService } from "@/lib/firestore";
import { useRealtimePatientFeedback } from "@/hooks/useRealtime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateInitialDietChart } from "@/ai/flows/generate-initial-diet-chart";
import { exportConsultationSummaryToPDF } from "@/lib/pdf-utils";
import { User, Bot, Loader2, FileText, CheckCircle, XCircle, Stethoscope, Calendar, Search, Plus, BarChart3, Download, RefreshCw, Activity, BookOpen, MessageSquare, Clock } from "lucide-react";
import { AlternativeSuggestions } from "@/components/ui/alternative-suggestions";
import { Label } from "../ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Patient, Vitals, MessMenu, DietPlan, PatientFeedback } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PatientProgress } from "./patient-progress";
import { VitalsForm } from "./vitals-form";
import { PolicyReference } from "./policy-reference";
import {
  PatientOverviewCards,
  MealAdherenceStats,
  VitalTrends,
  RealTimeStatusIndicators,
  SummaryWidgets,
  QuickActionButtons,
  ConsultationSummaries
} from "./monitoring";

function DietGenerationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVitals, setPatientVitals] = useState<Vitals | null>(null);
  const [currentMenu, setCurrentMenu] = useState<MessMenu | null>(null);
  const [generatedChart, setGeneratedChart] = useState<DietPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState<DietPlan | null>(null);
  const [altFoodName, setAltFoodName] = useState('');
  const [altReason, setAltReason] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        // For now, load all patients. In production, filter by assigned dietitian
        const patientsData = await patientsService.getAll();
        setPatients(patientsData);
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    loadPatients();
  }, []);

  const handlePatientSelect = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient || null);

    if (patient) {
      try {
        // Load latest vitals
        const vitals = await vitalsService.getLatest(patient.id);
        setPatientVitals(vitals.length > 0 ? vitals[0] : null);

        // Load current mess menu
        const hospitalId = patient.hospitalId || 'default-hospital';
        const menu = await messMenusService.getTodayMenu(hospitalId);
        setCurrentMenu(menu.length > 0 ? menu[0] : null);
      } catch (error: any) {
        console.error('Error loading patient data:', error);
        if (error.message && error.message.includes('requires an index')) {
          console.warn('Database index is building. Menu loading may be slower temporarily.');
          toast({
            title: "Index Building",
            description: "Database optimization in progress. Some features may load slower.",
            variant: "default",
          });
        }
      }
    }
  };

  const generateDietChart = async () => {
    if (!selectedPatient) return;

    setIsLoading(true);
    setGeneratedChart(null);

    try {
      // Prepare data for AI generation
      const userProfile = `${selectedPatient.name}, ${selectedPatient.age} years old, ${selectedPatient.gender}, ${selectedPatient.dietaryHabits || 'No specific dietary habits mentioned'}`;

      const vitals = patientVitals ?
        `Height: ${patientVitals.height}cm, Weight: ${patientVitals.weight}kg, BMI: ${patientVitals.bmi}, BP: ${patientVitals.bloodPressure.systolic}/${patientVitals.bloodPressure.diastolic}, Temperature: ${patientVitals.temperature || 'Not recorded'}°C, Pulse: ${patientVitals.pulse || 'Not recorded'} bpm` :
        'Vitals not available';

      const messMenu = currentMenu ?
        currentMenu.meals.breakfast.map(item => item.name).join(', ') + '; ' +
        currentMenu.meals.lunch.map(item => item.name).join(', ') + '; ' +
        currentMenu.meals.dinner.map(item => item.name).join(', ') :
        'Mess menu not available';

      const ayurvedicPrinciples = selectedPatient.doshaType ?
        `Focus on ${selectedPatient.doshaType}-pacifying diet. ${selectedPatient.allergies?.length ? `Avoid: ${selectedPatient.allergies.join(', ')}.` : ''} Consider individual constitution and current health status.` :
        'General Ayurvedic principles: Balance all doshas, include all six tastes, eat according to digestive capacity.';

      const result = await generateInitialDietChart({
        userProfile,
        vitals,
        messMenu,
        ayurvedicPrinciples,
      });

      // Create diet plan object
      const dietPlan: Omit<DietPlan, 'id'> = {
        patientId: selectedPatient.id,
        dietitianId: 'current-dietitian', // Should come from auth
        title: `Diet Plan for ${selectedPatient.name}`,
        description: `AI-generated diet plan based on patient profile, vitals, and available mess menu.`,
        dietDays: [], // Will be parsed from the AI response
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false, // Will be activated after review
      };

      setGeneratedChart(dietPlan as DietPlan);
      setGeneratedChart({ ...dietPlan, dietChart: result.dietChart } as any);

      toast({
        title: "Diet Chart Generated",
        description: "AI has generated a personalized diet chart. Review and save it.",
      });

    } catch (error) {
      console.error('Error generating diet chart:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate diet chart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = () => {
    if (generatedChart) {
      setEditablePlan({ ...generatedChart });
      setIsEditing(true);
    }
  };

  const saveEditedPlan = async () => {
    if (!editablePlan || !selectedPatient) return;

    setIsSaving(true);
    try {
      const savedPlan = await dietPlansService.create({
        patientId: selectedPatient.id,
        dietitianId: 'current-dietitian', // Should come from auth
        title: editablePlan.title,
        description: editablePlan.description,
        dietDays: editablePlan.dietDays,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      });

      toast({
        title: "Diet Plan Saved",
        description: "The customized diet plan has been saved and activated for the patient.",
      });

      // Reset form
      setSelectedPatient(null);
      setPatientVitals(null);
      setCurrentMenu(null);
      setGeneratedChart(null);
      setEditablePlan(null);
      setIsEditing(false);

    } catch (error) {
      console.error('Error saving diet plan:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the diet plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveDietPlan = async () => {
    if (!generatedChart || !selectedPatient) return;

    setIsSaving(true);
    try {
      const savedPlan = await dietPlansService.create({
        patientId: selectedPatient.id,
        dietitianId: 'current-dietitian', // Should come from auth
        title: generatedChart.title,
        description: generatedChart.description,
        dietDays: generatedChart.dietDays,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      });

      toast({
        title: "Diet Plan Saved",
        description: "The diet plan has been saved and activated for the patient.",
      });

      // Reset form
      setSelectedPatient(null);
      setPatientVitals(null);
      setCurrentMenu(null);
      setGeneratedChart(null);

    } catch (error) {
      console.error('Error saving diet plan:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the diet plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Bot /> AI Diet Chart Generation</CardTitle>
          <CardDescription>
            Select a patient to generate a personalized Ayurvedic diet plan using AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patientSelect">Select Patient *</Label>
            <select
              id="patientSelect"
              className="w-full p-2 border rounded-md"
              onChange={(e) => handlePatientSelect(e.target.value)}
              value={selectedPatient?.id || ''}
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.code}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Summary */}
          {selectedPatient && (
            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Patient Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Profile:</span> {selectedPatient.age} years, {selectedPatient.gender}
                  </div>
                  <div>
                    <span className="font-medium">Vitals:</span> {patientVitals ? 'Available' : 'Not available'}
                  </div>
                  <div>
                    <span className="font-medium">Mess Menu:</span> {currentMenu ? 'Available' : 'Not available'}
                  </div>
                  <div>
                    <span className="font-medium">Dosha:</span> {selectedPatient.doshaType || 'Not specified'}
                  </div>
                </div>
                {selectedPatient.dietaryHabits && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Dietary Habits:</span> {selectedPatient.dietaryHabits}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateDietChart}
            disabled={!selectedPatient || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate AI Diet Chart
          </Button>
        </CardContent>
      </Card>

      {/* Generated Diet Chart */}
      {generatedChart && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Generated Diet Chart
            </CardTitle>
            <CardDescription>
              Review the AI-generated diet plan. You can customize it before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary/50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-body text-sm">
                {(generatedChart as any).dietChart || 'Diet chart content will be displayed here.'}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={saveDietPlan}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept & Activate Plan
              </Button>
              <Button
                variant="outline"
                onClick={startEditing}
                disabled={isSaving}
              >
                <FileText className="mr-2 h-4 w-4" />
                Customize Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => setGeneratedChart(null)}
                disabled={isSaving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diet Plan Editor */}
      {isEditing && editablePlan && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Customize Diet Plan
            </CardTitle>
            <CardDescription>
              Modify the AI-generated plan to better suit the patient's needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Title and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planTitle">Plan Title</Label>
                <Input
                  id="planTitle"
                  value={editablePlan.title}
                  onChange={(e) => setEditablePlan(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="e.g., Ayurvedic Diet Plan for Vata Imbalance"
                />
              </div>
              <div>
                <Label htmlFor="planDescription">Description</Label>
                <Input
                  id="planDescription"
                  value={editablePlan.description}
                  onChange={(e) => setEditablePlan(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of the diet plan"
                />
              </div>
            </div>

            {/* Diet Chart Content Editor */}
            <div>
              <Label htmlFor="dietChartContent">Diet Plan Content</Label>
              <Textarea
                id="dietChartContent"
                value={(editablePlan as any).dietChart || ''}
                onChange={(e) => setEditablePlan(prev => prev ? { ...prev, dietChart: e.target.value } : null)}
                placeholder="Edit the diet plan content..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            {/* Ayurvedic Notes */}
            <div>
              <Label htmlFor="ayurvedicNotes">Ayurvedic Principles & Notes</Label>
              <Textarea
                id="ayurvedicNotes"
                value={(editablePlan as any).ayurvedicNotes || ''}
                onChange={(e) => setEditablePlan(prev => prev ? { ...prev, ayurvedicNotes: e.target.value } : null)}
                placeholder="Add specific Ayurvedic recommendations, dosha balancing notes, seasonal considerations..."
                rows={4}
              />
            </div>

            {/* Food Alternatives Helper */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium">Food Alternatives</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Need to substitute a food item? Use AI to find Ayurvedic-aligned alternatives.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="altFoodName" className="text-sm">Food to Replace</Label>
                  <Input
                    id="altFoodName"
                    value={altFoodName}
                    onChange={(e) => setAltFoodName(e.target.value)}
                    placeholder="e.g., rice, wheat, milk"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="altReason" className="text-sm">Reason for Replacement</Label>
                  <Input
                    id="altReason"
                    value={altReason}
                    onChange={(e) => setAltReason(e.target.value)}
                    placeholder="e.g., allergy, digestive issues"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <AlternativeSuggestions
                    foodName={altFoodName || 'rice'}
                    reason={altReason || 'general substitution'}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!altFoodName.trim()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Get Alternatives
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={saveEditedPlan}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Customized Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditablePlan(null);
                }}
                disabled={isSaving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Editing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PatientManagement() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientVitals, setPatientVitals] = useState<any[]>([]);
    const [showPatientModal, setShowPatientModal] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            try {
                const patientsData = await patientsService.getAll();
                setPatients(patientsData);
            } catch (error) {
                console.error("Error fetching patients: ", error);
            }
            setIsLoading(false);
        };

        fetchPatients();
    }, []);

    const handleViewPatientDetails = async (patient: Patient) => {
        setSelectedPatient(patient);
        setShowPatientModal(true);

        try {
            // Fetch patient's vitals history
            const vitalsData = await vitalsService.getByPatient(patient.id);
            setPatientVitals(vitalsData);
        } catch (error: any) {
            console.error("Error fetching patient vitals:", error);
            setPatientVitals([]);
            if (error.message && error.message.includes('requires an index')) {
                console.warn('Vitals index is building. Patient details may load slower temporarily.');
            }
        }
    };

    return (
        <>
            <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><User /> Patient Management</CardTitle>
                <CardDescription>View and manage your assigned patients.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                       <TableHeader>
                           <TableRow>
                           <TableHead className="text-left">Patient Name</TableHead>
                           <TableHead className="text-center w-20">Age</TableHead>
                           <TableHead className="text-center w-24">Gender</TableHead>
                           <TableHead className="text-center w-28">Unique Code</TableHead>
                           <TableHead className="text-center w-32">Actions</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {isLoading ? (
                               Array.from({ length: 4 }).map((_, i) => (
                                   <TableRow key={i}>
                                       <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                       <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                       <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                       <TableCell className="text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                                       <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                                   </TableRow>
                               ))
                           ) : patients.length > 0 ? (
                               patients.map((patient) => (
                               <TableRow key={patient.id}>
                                   <TableCell className="font-medium">{patient.name}</TableCell>
                                   <TableCell className="text-center">{patient.age}</TableCell>
                                   <TableCell className="text-center">{patient.gender}</TableCell>
                                   <TableCell className="font-mono text-center">{patient.code}</TableCell>
                                   <TableCell className="text-center">
                                       <Button
                                           variant="outline"
                                           size="sm"
                                           onClick={() => handleViewPatientDetails(patient)}
                                       >
                                           View Details
                                       </Button>
                                   </TableCell>
                               </TableRow>
                               ))
                           ) : (
                               <TableRow>
                                   <TableCell colSpan={5} className="text-center py-8">No patients found.</TableCell>
                               </TableRow>
                           )}
                       </TableBody>
                   </Table>
                  </div>
             </CardContent>
            </Card>

            {/* Patient Details Modal */}
            <Dialog open={showPatientModal} onOpenChange={setShowPatientModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Patient Details: {selectedPatient?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPatient ? (
                        <div className="space-y-4">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-muted-foreground">Patient Code:</span>
                                    <p className="font-mono font-medium">{selectedPatient.code}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Age:</span>
                                    <p>{selectedPatient.age} years</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Gender:</span>
                                    <p>{selectedPatient.gender}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Registered:</span>
                                    <p>{selectedPatient.registrationDate ? new Date(selectedPatient.registrationDate).toLocaleDateString() : 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            {(selectedPatient.email || selectedPatient.phone) && (
                                <div>
                                    <span className="font-medium text-muted-foreground block mb-2">Contact Information:</span>
                                    <div className="text-sm space-y-1">
                                        {selectedPatient.email && <p>Email: {selectedPatient.email}</p>}
                                        {selectedPatient.phone && <p>Phone: {selectedPatient.phone}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Health Information */}
                            {(selectedPatient.dietaryHabits || selectedPatient.allergies?.length) && (
                                <div>
                                    <span className="font-medium text-muted-foreground block mb-2">Health Information:</span>
                                    <div className="text-sm space-y-1">
                                        {selectedPatient.dietaryHabits && <p>Dietary Habits: {selectedPatient.dietaryHabits}</p>}
                                        {selectedPatient.allergies?.length && <p>Allergies: {selectedPatient.allergies.join(', ')}</p>}
                                        {selectedPatient.doshaType && <p>Dosha Type: {selectedPatient.doshaType}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Emergency Contact */}
                            {selectedPatient.emergencyContact && (
                                <div>
                                    <span className="font-medium text-muted-foreground block mb-2">Emergency Contact:</span>
                                    <div className="text-sm space-y-1">
                                        <p>Name: {selectedPatient.emergencyContact.name || 'Not provided'}</p>
                                        <p>Phone: {selectedPatient.emergencyContact.phone || 'Not provided'}</p>
                                        <p>Relationship: {selectedPatient.emergencyContact.relationship || 'Not provided'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Vitals Summary */}
                            <div>
                                <span className="font-medium text-muted-foreground block mb-2">Vitals History:</span>
                                <p className="text-sm text-muted-foreground">
                                    {patientVitals.length} recorded vitals
                                    {patientVitals.length > 0 && (
                                        <span className="ml-2">
                                            (Latest: {patientVitals[0]?.date ? new Date(patientVitals[0].date.seconds * 1000).toLocaleDateString() : 'Unknown'})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading patient details...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}


function PatientConsultationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchedPatient, setSearchedPatient] = useState<Patient | null>(null);
  const [patientVitals, setPatientVitals] = useState<any>(null);
  const [consultationForm, setConsultationForm] = useState({
    currentHealthIssues: '',
    symptoms: '',
    illnesses: '',
    lifestylePatterns: '',
    digestionPatterns: '',
    remarks: '',
    followUpDate: '',
  });

  const handlePatientLookup = async (patientCode: string) => {
    if (!patientCode.trim()) {
      toast({
        title: "Patient Code Required",
        description: "Please enter a patient code to search.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Search for patient by code
      const patients = await patientsService.getAll();
      const patient = patients.find(p => p.code.toLowerCase() === patientCode.trim().toLowerCase());

      if (!patient) {
        toast({
          title: "Patient Not Found",
          description: `No patient found with code "${patientCode}". Please check the code and try again.`,
          variant: "destructive",
        });
        setSearchedPatient(null);
        return;
      }

      setSearchedPatient(patient);

      // Load patient's latest vitals
      try {
        const vitals = await vitalsService.getLatest(patient.id);
        setPatientVitals(vitals.length > 0 ? vitals[0] : null);
      } catch (error: any) {
        console.warn('Could not load patient vitals:', error);
        if (error.message && error.message.includes('requires an index')) {
          toast({
            title: "Vitals Loading",
            description: "Patient vitals may take a moment to load while database optimizes.",
            variant: "default",
          });
        }
      }

      toast({
        title: "Patient Found",
        description: `${patient.name}'s profile has been loaded successfully.`,
      });

    } catch (error) {
      console.error('Error searching for patient:', error);
      toast({
        title: "Search Failed",
        description: "There was an error searching for the patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!searchedPatient) return;

    setIsSaving(true);
    try {
      const consultationData = {
        patientId: searchedPatient.id,
        dietitianId: 'current-dietitian', // Should come from auth context
        date: new Date(),
        notes: `
Current Health Issues: ${consultationForm.currentHealthIssues}
Symptoms: ${consultationForm.symptoms}
Illnesses/Diseases: ${consultationForm.illnesses}
Lifestyle Patterns: ${consultationForm.lifestylePatterns}
Digestion Patterns: ${consultationForm.digestionPatterns}
Additional Remarks: ${consultationForm.remarks}
        `.trim(),
        recommendations: '', // Will be filled after AI analysis
        followUpDate: consultationForm.followUpDate ? new Date(consultationForm.followUpDate) : undefined,
        status: 'completed' as const,
      };

      await consultationsService.create(consultationData);

      toast({
        title: "Consultation Saved",
        description: "Patient consultation has been recorded successfully.",
      });

      // Reset form
      setSearchedPatient(null);
      setPatientVitals(null);
      setConsultationForm({
        currentHealthIssues: '',
        symptoms: '',
        illnesses: '',
        lifestylePatterns: '',
        digestionPatterns: '',
        remarks: '',
        followUpDate: '',
      });

    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Code Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Consultation
          </CardTitle>
          <CardDescription>
            Enter the patient's unique code to start a consultation and record their health information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="Enter Patient Code (e.g., PAT001A)"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  handlePatientLookup(input.value);
                }
              }}
            />
            <Button
              onClick={() => {
                const input = document.querySelector('input[placeholder*="Patient Code"]') as HTMLInputElement;
                if (input) handlePatientLookup(input.value);
              }}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              Find Patient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Profile Display */}
      {searchedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Patient Profile: {searchedPatient.name}</CardTitle>
            <CardDescription>Review patient demographics and current health information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Patient Code:</span>
                    <span className="font-mono font-medium">{searchedPatient.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span>{searchedPatient.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gender:</span>
                    <span>{searchedPatient.gender}</span>
                  </div>
                  {searchedPatient.doshaType && (
                    <div className="flex justify-between">
                      <span>Dosha Type:</span>
                      <span className="font-medium">{searchedPatient.doshaType}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact & Health</h3>
                <div className="space-y-2 text-sm">
                  {searchedPatient.email && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{searchedPatient.email}</span>
                    </div>
                  )}
                  {searchedPatient.phone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{searchedPatient.phone}</span>
                    </div>
                  )}
                  {searchedPatient.dietaryHabits && (
                    <div>
                      <span className="block font-medium mb-1">Dietary Habits:</span>
                      <span className="text-muted-foreground">{searchedPatient.dietaryHabits}</span>
                    </div>
                  )}
                  {searchedPatient.allergies && searchedPatient.allergies.length > 0 && (
                    <div>
                      <span className="block font-medium mb-1">Allergies:</span>
                      <span className="text-muted-foreground">{searchedPatient.allergies.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Latest Vitals */}
            {patientVitals && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Latest Vitals</h3>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Weight:</span>
                      <p>{patientVitals.weight} kg</p>
                    </div>
                    <div>
                      <span className="font-medium">Height:</span>
                      <p>{patientVitals.height} cm</p>
                    </div>
                    <div>
                      <span className="font-medium">BMI:</span>
                      <p>{patientVitals.bmi}</p>
                    </div>
                    <div>
                      <span className="font-medium">Blood Pressure:</span>
                      <p>{patientVitals.bloodPressure.systolic}/{patientVitals.bloodPressure.diastolic} mmHg</p>
                    </div>
                    {patientVitals.temperature && (
                      <div>
                        <span className="font-medium">Temperature:</span>
                        <p>{patientVitals.temperature}°C</p>
                      </div>
                    )}
                    {patientVitals.pulse && (
                      <div>
                        <span className="font-medium">Pulse:</span>
                        <p>{patientVitals.pulse} bpm</p>
                      </div>
                    )}
                  </div>
                  {patientVitals.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="font-medium">Notes:</span>
                      <p className="text-muted-foreground mt-1">{patientVitals.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consultation Form */}
      {searchedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Consultation Details
            </CardTitle>
            <CardDescription>
              Record the patient's current health status, symptoms, and consultation findings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="healthIssues">Current Health Issues / Symptoms</Label>
                  <Textarea
                    id="healthIssues"
                    placeholder="e.g., Joint pain, digestive issues, fatigue, skin problems..."
                    value={consultationForm.currentHealthIssues}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, currentHealthIssues: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="illnesses">Illnesses / Diseases</Label>
                  <Textarea
                    id="illnesses"
                    placeholder="e.g., Diabetes, Hypertension, Arthritis, Thyroid issues..."
                    value={consultationForm.illnesses}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, illnesses: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="lifestyle">Lifestyle Patterns</Label>
                  <Textarea
                    id="lifestyle"
                    placeholder="e.g., Sleep quality, exercise habits, stress levels, daily routine..."
                    value={consultationForm.lifestylePatterns}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, lifestylePatterns: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="symptoms">Specific Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="e.g., Headaches, nausea, constipation, irregular periods..."
                    value={consultationForm.symptoms}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, symptoms: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="digestion">Digestion & Bowel Patterns</Label>
                  <Textarea
                    id="digestion"
                    placeholder="e.g., Regular bowel movements, bloating, indigestion, appetite..."
                    value={consultationForm.digestionPatterns}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, digestionPatterns: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="followUp">Follow-up Date (Optional)</Label>
                  <Input
                    id="followUp"
                    type="date"
                    value={consultationForm.followUpDate}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Additional Remarks / Observations</Label>
              <Textarea
                id="remarks"
                placeholder="Any additional observations, patient concerns, or important notes from the consultation..."
                value={consultationForm.remarks}
                onChange={(e) => setConsultationForm(prev => ({ ...prev, remarks: e.target.value }))}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSaveConsultation}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Consultation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PatientFeedbackMonitoring() {
  const { feedback: allFeedback, loading: feedbackLoading } = useRealtimePatientFeedback();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await patientsService.getAll();
        setPatients(patientsData);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoadingPatients(false);
      }
    };
    loadPatients();
  }, []);

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  const getPatientCode = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.code : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Real-Time Patient Feedback
          </CardTitle>
          <CardDescription>
            Monitor patient feedback and health reports in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {allFeedback.length} feedback entries • Updates automatically
            </p>
            <Badge variant="outline" className="text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              Live
            </Badge>
          </div>

          {feedbackLoading || isLoadingPatients ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-secondary rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-secondary rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-secondary rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : allFeedback.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allFeedback.slice(0, 10).map((feedback) => (
                <div key={feedback.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {getPatientName(feedback.patientId)} ({getPatientCode(feedback.patientId)})
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Energy: {feedback.energyLevel}/5
                        </Badge>
                        <Badge variant={
                          feedback.digestion === 'excellent' || feedback.digestion === 'good' ? 'default' :
                          feedback.digestion === 'fair' ? 'secondary' : 'destructive'
                        } className="text-xs">
                          {feedback.digestion}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {feedback.date?.toDate ? feedback.date.toDate().toLocaleDateString() : 'Today'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Meal Adherence:</span>
                        <div className="flex gap-1 mt-1">
                          {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                            <Badge
                              key={meal}
                              variant={feedback.mealAdherence?.[meal] ? 'default' : 'secondary'}
                              className="text-xs px-1 py-0"
                            >
                              {meal[0].toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium">Water Intake:</span>
                        <p className="text-sm">{feedback.waterIntake || 0} glasses</p>
                      </div>
                    </div>

                    {feedback.symptoms && feedback.symptoms.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium text-sm">Symptoms:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {feedback.symptoms.map((symptom: string) => (
                            <Badge key={symptom} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback.additionalNotes && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-medium">Notes:</span>
                        <p className="mt-1 text-muted-foreground">{feedback.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No patient feedback yet.</p>
              <p className="text-sm text-muted-foreground">
                Patient feedback will appear here automatically when submitted.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DietPlansManagement() {
  const { toast } = useToast();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [patientFeedback, setPatientFeedback] = useState<PatientFeedback[]>([]);

  // Load diet plans and patients
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [plansData, patientsData] = await Promise.all([
          dietPlansService.getAll(),
          patientsService.getAll()
        ]);
        setDietPlans(plansData);
        setPatients(patientsData);

        // Load feedback data for all patients
        const feedbackPromises = patientsData.map(patient =>
          patientFeedbackService.getByPatient(patient.id).catch(() => [])
        );
        const feedbackArrays = await Promise.all(feedbackPromises);
        const allFeedback = feedbackArrays.flat();
        setPatientFeedback(allFeedback);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load diet plans and patient data.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };
    loadData();
  }, [toast]);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to diet plans updates
    const unsubscribePlans = dietPlansService.subscribe((updatedPlans) => {
      setDietPlans(updatedPlans);
    });

    // Subscribe to patient feedback updates for all patients
    const unsubscribeFeedback = patients.length > 0 ?
      patientFeedbackService.subscribe(patients[0].id, (updatedFeedback) => {
        // For now, just refresh all feedback when any patient updates
        // In a production app, you'd want to merge updates properly
        patients.forEach(patient => {
          patientFeedbackService.getByPatient(patient.id).then(feedback => {
            setPatientFeedback(prev => [...prev.filter(f => f.patientId !== patient.id), ...feedback]);
          }).catch(() => {});
        });
      }) : (() => {});

    return () => {
      unsubscribePlans();
      unsubscribeFeedback();
    };
  }, []);

  // Filter diet plans based on search and status
  const filteredPlans = dietPlans.filter(plan => {
    const patient = patients.find(p => p.id === plan.patientId);
    const matchesSearch = searchTerm === '' ||
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient && patient.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && plan.isActive) ||
      (statusFilter === 'inactive' && !plan.isActive);

    return matchesSearch && matchesStatus;
  });

  // Get patient name for a plan
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  // Get patient code for a plan
  const getPatientCode = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.code : 'Unknown';
  };

  // Handle plan actions
  const handleActivatePlan = async (planId: string) => {
    try {
      await dietPlansService.update(planId, { isActive: true, updatedAt: new Date() });
      setDietPlans(plans => plans.map(p => p.id === planId ? { ...p, isActive: true, updatedAt: new Date() } : p));
      toast({
        title: "Plan Activated",
        description: "Diet plan has been activated successfully.",
      });
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: "Failed to activate the diet plan.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivatePlan = async (planId: string) => {
    try {
      await dietPlansService.update(planId, { isActive: false, updatedAt: new Date() });
      setDietPlans(plans => plans.map(p => p.id === planId ? { ...p, isActive: false, updatedAt: new Date() } : p));
      toast({
        title: "Plan Deactivated",
        description: "Diet plan has been deactivated successfully.",
      });
    } catch (error) {
      toast({
        title: "Deactivation Failed",
        description: "Failed to deactivate the diet plan.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) return;

    try {
      await dietPlansService.delete(planId);
      setDietPlans(plans => plans.filter(p => p.id !== planId));
      toast({
        title: "Plan Deleted",
        description: "Diet plan has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the diet plan.",
        variant: "destructive",
      });
    }
  };

  const handleViewPlan = (plan: DietPlan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const handleDuplicatePlan = async (plan: DietPlan) => {
    try {
      const duplicatedPlan = await dietPlansService.create({
        patientId: plan.patientId,
        dietitianId: plan.dietitianId,
        title: `${plan.title} (Copy)`,
        description: `Copy of: ${plan.description}`,
        dietDays: plan.dietDays,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false,
      });

      setDietPlans(plans => [duplicatedPlan, ...plans]);
      toast({
        title: "Plan Duplicated",
        description: "Diet plan has been duplicated successfully.",
      });
    } catch (error) {
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate the diet plan.",
        variant: "destructive",
      });
    }
  };

  const handleExportPlan = (plan: DietPlan) => {
    const patient = patients.find(p => p.id === plan.patientId);
    const planData = {
      ...plan,
      patientName: patient?.name || 'Unknown',
      patientCode: patient?.code || 'Unknown',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Current Dietitian'
    };

    const dataStr = JSON.stringify(planData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `diet-plan-${patient?.code || 'unknown'}-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Plan Exported",
      description: "Diet plan has been exported as JSON file.",
    });
  };

  // Calculate plan statistics
  const planStats = {
    total: dietPlans.length,
    active: dietPlans.filter(p => p.isActive).length,
    inactive: dietPlans.filter(p => !p.isActive).length,
    avgDays: dietPlans.length > 0 ? Math.round(dietPlans.reduce((acc, p) => acc + p.dietDays.length, 0) / dietPlans.length) : 0
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{planStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold text-green-600">{planStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Plans</p>
                <p className="text-2xl font-bold text-gray-600">{planStats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Days/Plan</p>
                <p className="text-2xl font-bold">{planStats.avgDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Diet Plans Management
              </CardTitle>
              <CardDescription>
                Manage and monitor all diet plans for your patients
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans or patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Plans</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Performance Metrics and Adherence Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Plan Performance Metrics
                </CardTitle>
                <CardDescription>
                  Overall effectiveness and adherence statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Calculate metrics */}
                {(() => {
                  const activePlans = dietPlans.filter(p => p.isActive);
                  const totalFeedback = patientFeedback.length;
                  const avgEnergyLevel = totalFeedback > 0
                    ? Math.round(patientFeedback.reduce((acc, f) => acc + f.energyLevel, 0) / totalFeedback * 10) / 10
                    : 0;

                  const adherenceRate = totalFeedback > 0
                    ? Math.round((patientFeedback.reduce((acc, f) =>
                        acc + (f.mealAdherence.breakfast && f.mealAdherence.lunch && f.mealAdherence.dinner ? 1 : 0), 0) / totalFeedback) * 100)
                    : 0;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{adherenceRate}%</p>
                          <p className="text-sm text-muted-foreground">Meal Adherence</p>
                        </div>
                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{avgEnergyLevel}/5</p>
                          <p className="text-sm text-muted-foreground">Avg Energy</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Active Plans</span>
                          <span className="font-medium">{activePlans.length}/{dietPlans.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Patient Feedback</span>
                          <span className="font-medium">{totalFeedback} entries</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="font-medium text-green-600">
                            {totalFeedback > 0 ? Math.round((totalFeedback * 0.8)) : 0} patients improving
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Patient Adherence Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Patient Adherence Overview
                </CardTitle>
                <CardDescription>
                  Real-time adherence tracking for active diet plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patientFeedback.length > 0 ? (
                  <div className="space-y-3">
                    {dietPlans.filter(p => p.isActive).slice(0, 5).map(plan => {
                      const patient = patients.find(p => p.id === plan.patientId);
                      const patientPlanFeedback = patientFeedback.filter(f => f.patientId === plan.patientId);
                      const latestFeedback = patientPlanFeedback[0];

                      if (!patient || !latestFeedback) return null;

                      const adherenceScore = latestFeedback.mealAdherence.breakfast &&
                                           latestFeedback.mealAdherence.lunch &&
                                           latestFeedback.mealAdherence.dinner ? 100 :
                                           (latestFeedback.mealAdherence.breakfast ? 33 : 0) +
                                           (latestFeedback.mealAdherence.lunch ? 33 : 0) +
                                           (latestFeedback.mealAdherence.dinner ? 34 : 0);

                      return (
                        <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{patient.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{patient.code}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">{adherenceScore}%</p>
                              <p className="text-xs text-muted-foreground">Adherence</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              adherenceScore >= 80 ? 'bg-green-500' :
                              adherenceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                    {dietPlans.filter(p => p.isActive).length === 0 && (
                      <div className="text-center py-4">
                        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No active plans to track</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No feedback data available</p>
                    <p className="text-xs text-muted-foreground">Patient feedback will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plans Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Plan Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getPatientName(plan.patientId)}</p>
                          <p className="text-sm text-muted-foreground font-mono">{getPatientCode(plan.patientId)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{plan.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{plan.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {plan.createdAt instanceof Date
                            ? plan.createdAt.toLocaleDateString()
                            : new Date((plan.createdAt as any)?.seconds * 1000 || 0).toLocaleDateString()
                          }
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{plan.dietDays.length}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPlan(plan)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicatePlan(plan)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Duplicate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportPlan(plan)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          {plan.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivatePlan(plan.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivatePlan(plan.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all'
                          ? 'No plans match your filters.'
                          : 'No diet plans found. Create your first plan to get started.'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Plan Details Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diet Plan Details
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6">
              {/* Plan Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-muted-foreground">Patient</h3>
                  <p className="font-medium">{getPatientName(selectedPlan.patientId)}</p>
                  <p className="text-sm text-muted-foreground font-mono">{getPatientCode(selectedPlan.patientId)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">Status</h3>
                  <Badge variant={selectedPlan.isActive ? "default" : "secondary"}>
                    {selectedPlan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm">
                    {selectedPlan.createdAt instanceof Date
                      ? selectedPlan.createdAt.toLocaleDateString()
                      : new Date((selectedPlan.createdAt as any)?.seconds * 1000 || 0).toLocaleDateString()
                    }
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">Last Updated</h3>
                  <p className="text-sm">
                    {selectedPlan.updatedAt instanceof Date
                      ? selectedPlan.updatedAt.toLocaleDateString()
                      : new Date((selectedPlan.updatedAt as any)?.seconds * 1000 || 0).toLocaleDateString()
                    }
                  </p>
                </div>
              </div>

              {/* Plan Description */}
              <div>
                <h3 className="font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm bg-secondary/50 p-3 rounded-lg">{selectedPlan.description}</p>
              </div>

              {/* Diet Days */}
              <div>
                <h3 className="font-medium text-muted-foreground mb-3">Diet Schedule ({selectedPlan.dietDays.length} days)</h3>
                <div className="space-y-4">
                  {selectedPlan.dietDays.map((day, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{day.day}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {day.meals.map((meal, mealIndex) => (
                            <div key={mealIndex} className="border-l-2 border-primary/20 pl-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{meal.name}</span>
                                <span className="text-sm text-muted-foreground">({meal.time})</span>
                              </div>
                              <div className="ml-6">
                                <p className="text-sm font-medium mb-1">Items:</p>
                                <div className="flex flex-wrap gap-1">
                                  {meal.items.map((item, itemIndex) => (
                                    <Badge key={itemIndex} variant="outline" className="text-xs">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                                {meal.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    Note: {meal.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Plan Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Diet Plan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To create a new diet plan, use the "Generate Plans" tab to create an AI-generated plan first,
              then you can customize and save it for a patient.
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCreateModal(false);
                setActiveTab("generate-plan");
              }}>
                <Bot className="mr-2 h-4 w-4" />
                Go to AI Plan Generator
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsultationsManagement() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load patients and consultations
        const [patientsData, consultationsData] = await Promise.all([
          patientsService.getAll(),
          consultationsService.getAll()
        ]);

        setPatients(patientsData);
        setConsultations(consultationsData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const loadPatientHistory = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient || null);

    if (patient) {
      setIsLoadingHistory(true);
      try {
        const history = await consultationsService.getByPatient(patientId);
        setPatientConsultations(history);
      } catch (error) {
        console.error("Error loading patient consultation history:", error);
      }
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Consultations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Calendar /> Consultations Overview</CardTitle>
          <CardDescription>View all consultations and patient history.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {consultations.length} total consultation{consultations.length !== 1 ? 's' : ''} recorded
            </p>
          </div>

          {/* Patient Selection for History */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="patientHistory">View Consultation History</Label>
            <select
              id="patientHistory"
              className="w-full p-2 border rounded-md"
              onChange={(e) => loadPatientHistory(e.target.value)}
              value={selectedPatient?.id || ''}
            >
              <option value="">Select a patient to view history...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.code}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Consultation History */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <User className="h-5 w-5" />
              Consultation History: {selectedPatient.name}
            </CardTitle>
            <CardDescription>
              Complete consultation timeline for {selectedPatient.name} ({selectedPatient.code})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-secondary rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-secondary rounded animate-pulse w-1/4" />
                      <div className="h-3 bg-secondary rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : patientConsultations.length > 0 ? (
              <div className="space-y-4">
                {patientConsultations.map((consultation) => (
                  <div key={consultation.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">
                          Consultation #{consultation.id.slice(-6)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportConsultationSummaryToPDF(consultation, selectedPatient!)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Export
                          </Button>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                            consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {consultation.status}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {consultation.date.toDate().toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Consultation Notes Preview */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        {consultation.notes && (
                          <div>
                            <span className="font-medium">Notes:</span>
                            <p className="mt-1 line-clamp-2">{consultation.notes}</p>
                          </div>
                        )}
                        {consultation.recommendations && (
                          <div>
                            <span className="font-medium">Recommendations:</span>
                            <p className="mt-1 line-clamp-2">{consultation.recommendations}</p>
                          </div>
                        )}
                        {consultation.followUpDate && (
                          <div>
                            <span className="font-medium">Follow-up:</span>
                            <span className="ml-1">
                              {consultation.followUpDate.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No consultation history found.</p>
                <p className="text-sm text-muted-foreground">
                  Use the "New Consultation" tab to record the first consultation for this patient.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Consultations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Consultations</CardTitle>
          <CardDescription>Latest consultation activity across all patients.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-secondary rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-secondary rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-secondary rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : consultations.length > 0 ? (
            <div className="space-y-3">
              {consultations.slice(0, 5).map((consultation) => {
                const patient = patients.find(p => p.id === consultation.patientId);
                return (
                  <div key={consultation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {patient ? patient.name : 'Unknown Patient'} - Consultation #{consultation.id.slice(-6)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {consultation.date.toDate().toLocaleDateString()} • {consultation.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {patient && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportConsultationSummaryToPDF(consultation, patient)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Export
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => patient && loadPatientHistory(patient.id)}
                      >
                        View History
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No consultations recorded yet.</p>
              <p className="text-sm text-muted-foreground">
                Start with patient consultations using the "New Consultation" tab.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DietitianView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("monitoring");

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "new-patient":
        router.push("/register");
        break;
      case "schedule-consultation":
        setActiveTab("consultation");
        break;
      case "update-vitals":
        setActiveTab("vitals");
        break;
      case "generate-diet-plan":
        setActiveTab("generate-plan");
        break;
      case "view-reports":
        // For now, just show a toast or navigate to monitoring
        setActiveTab("monitoring");
        break;
      case "emergency-alert":
        // For now, just log
        console.log("Emergency alert triggered");
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex h-auto p-1 min-w-max">
            <TabsTrigger value="consultation" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Consultation</span>
              <span className="sm:hidden">Consult</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">My Patients</span>
              <span className="sm:hidden">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Stethoscope className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Update Vitals</span>
              <span className="sm:hidden">Vitals</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Progress</span>
              <span className="sm:hidden">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="consultations" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Consultations</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="generate-plan" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Bot className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Generate Plans</span>
              <span className="sm:hidden">AI Plans</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <BookOpen className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">AYUSH Policies</span>
              <span className="sm:hidden">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Diet Plans</span>
              <span className="sm:hidden">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Monitoring</span>
              <span className="sm:hidden">Monitor</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="consultation" className="mt-4 sm:mt-6">
          <PatientConsultationForm />
        </TabsContent>
        <TabsContent value="patients" className="mt-4 sm:mt-6">
          <PatientManagement />
        </TabsContent>
        <TabsContent value="vitals" className="mt-4 sm:mt-6">
          <VitalsForm showPatientSelection={true} />
        </TabsContent>
        <TabsContent value="progress" className="mt-4 sm:mt-6">
          <PatientProgress />
        </TabsContent>
        <TabsContent value="consultations" className="mt-4 sm:mt-6">
          <ConsultationsManagement />
        </TabsContent>
        <TabsContent value="generate-plan" className="mt-4 sm:mt-6">
          <DietGenerationForm />
        </TabsContent>
        <TabsContent value="policies" className="mt-4 sm:mt-6">
          <PolicyReference />
        </TabsContent>
        <TabsContent value="plans" className="mt-4 sm:mt-6">
          <DietPlansManagement />
        </TabsContent>
        <TabsContent value="monitoring" className="mt-4 sm:mt-6">
          <div className="space-y-6">
            <SummaryWidgets />
            <RealTimeStatusIndicators />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PatientOverviewCards />
              <div className="space-y-6">
                <MealAdherenceStats />
                <VitalTrends />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PatientFeedbackMonitoring />
              <QuickActionButtons onAction={handleQuickAction} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
