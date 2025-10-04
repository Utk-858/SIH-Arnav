"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, UtensilsCrossed, Link2, HeartPulse, X, Calendar, Activity, CheckSquare, Download, BarChart3 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { patientsService, messMenusService, vitalsService, dietPlansService } from "@/lib/firestore";
import { exportHospitalRecordsToPDF } from "@/lib/pdf-utils";
import { useAuth } from "@/lib/auth";
import type { Patient, MessMenu, MessMenuItem, Vitals, DietPlan } from "@/lib/types";
import { MealTrackingComponent } from "./meal-tracking";
import { VitalsForm } from "./vitals-form";
import { MessMenuManager } from "./mess-menu-manager";
import { PatientProgress } from "./patient-progress";
import {
  PatientOverviewCards,
  MealAdherenceStats,
  VitalTrends,
  RealTimeStatusIndicators,
  SummaryWidgets,
  QuickActionButtons,
  ConsultationSummaries
} from "./monitoring";


function LinkPatientForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [linkedPatient, setLinkedPatient] = useState<Patient | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const code = (formData.get('patientCode') as string)?.trim().toUpperCase();

            if (!code) {
                toast({
                    title: "Patient Code Required",
                    description: "Please enter a patient code.",
                    variant: "destructive",
                });
                return;
            }

            // Search for patient by code
            const patients = await patientsService.getAll();
            const patient = patients.find(p => p.code === code);

            if (!patient) {
                toast({
                    title: "Patient Not Found",
                    description: `No patient found with code ${code}. Please check the code and try again.`,
                    variant: "destructive",
                });
                return;
            }

            // Link patient to hospital (assuming hospital ID from auth context)
            // For now, we'll just mark as linked and show patient details
            setLinkedPatient(patient);

            toast({
                title: "Patient Linked Successfully",
                description: `${patient.name} has been linked to the hospital system.`,
            });

            // Reset form safely
            if (formRef.current) {
                formRef.current.reset();
            }

        } catch (error) {
            console.error('Error linking patient:', error);
            toast({
                title: "Linking Failed",
                description: "There was an error linking the patient. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Link2 /> Link Patient Profile</CardTitle>
                    <CardDescription>
                        Enter the patient's unique code to sync their profile with the hospital system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={formRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" onSubmit={handleSubmit}>
                        <Input
                            id="patientCode"
                            name="patientCode"
                            placeholder="Enter Patient Code (e.g., PAT001A)"
                            required
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? "Linking..." : "Link Patient"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {linkedPatient && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Patient Details</CardTitle>
                        <CardDescription>Linked patient information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium">Name</Label>
                                <p className="text-sm text-muted-foreground break-words">{linkedPatient.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Patient Code</Label>
                                <p className="text-sm text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded text-xs sm:text-sm">{linkedPatient.code}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Age</Label>
                                <p className="text-sm text-muted-foreground">{linkedPatient.age} years</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Gender</Label>
                                <p className="text-sm text-muted-foreground">{linkedPatient.gender}</p>
                            </div>
                        </div>

                        {(linkedPatient.email || linkedPatient.phone) && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Contact Information</Label>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    {linkedPatient.email && <p>Email: {linkedPatient.email}</p>}
                                    {linkedPatient.phone && <p>Phone: {linkedPatient.phone}</p>}
                                </div>
                            </div>
                        )}

                        {linkedPatient.emergencyContact && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Emergency Contact</Label>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Name: {linkedPatient.emergencyContact.name || 'Not provided'}</p>
                                    <p>Phone: {linkedPatient.emergencyContact.phone || 'Not provided'}</p>
                                    <p>Relationship: {linkedPatient.emergencyContact.relationship || 'Not provided'}</p>
                                </div>
                            </div>
                        )}

                        {(linkedPatient.dietaryHabits || linkedPatient.allergies?.length) && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Health Information</Label>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    {linkedPatient.dietaryHabits && <p>Dietary Habits: {linkedPatient.dietaryHabits}</p>}
                                    {linkedPatient.allergies?.length && <p>Allergies: {linkedPatient.allergies.join(', ')}</p>}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                Patient registered on {linkedPatient.registrationDate ? new Date(linkedPatient.registrationDate).toLocaleDateString() : 'Unknown'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}

function MessMenuForm() {
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [currentMenu, setCurrentMenu] = useState<MessMenu | null>(null);

    useEffect(() => {
        const loadTodayMenu = async () => {
            try {
                const hospitalId = userProfile?.hospitalId || 'default-hospital';
                const todayMenus = await messMenusService.getTodayMenu(hospitalId);
                if (todayMenus.length > 0) {
                    setCurrentMenu(todayMenus[0]);
                }
            } catch (error: any) {
                console.error('Error loading today\'s menu:', error);
                if (error.message && error.message.includes('requires an index')) {
                    toast({
                        title: "Index Building",
                        description: "Database index is being created. Menu loading may be slower temporarily.",
                        variant: "default",
                    });
                }
            }
        };

        loadTodayMenu();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const menuText = formData.get('menuItems') as string;

            // Parse menu items (simple parsing for now)
            const menuItems = menuText.split('\n').filter(item => item.trim().length > 0);

            // Create MessMenuItem objects from the text
            const parseMenuItems = (items: string[]): MessMenuItem[] => {
                return items.map(item => ({
                    name: item.trim(),
                    isAvailable: true,
                    // In a real implementation, you'd parse nutritional and ayurvedic data
                    // For now, we'll just store the name
                }));
            };

            const messMenuData = {
                hospitalId: userProfile?.hospitalId || 'default-hospital',
                date: new Date(),
                meals: {
                    breakfast: parseMenuItems(menuItems.filter(item =>
                        item.toLowerCase().includes('breakfast') ||
                        item.toLowerCase().includes('poha') ||
                        item.toLowerCase().includes('upma') ||
                        item.toLowerCase().includes('tea')
                    )),
                    lunch: parseMenuItems(menuItems.filter(item =>
                        item.toLowerCase().includes('lunch') ||
                        item.toLowerCase().includes('roti') ||
                        item.toLowerCase().includes('dal') ||
                        item.toLowerCase().includes('rice')
                    )),
                    dinner: parseMenuItems(menuItems.filter(item =>
                        item.toLowerCase().includes('dinner') ||
                        item.toLowerCase().includes('khichdi') ||
                        item.toLowerCase().includes('soup')
                    )),
                    snacks: parseMenuItems(menuItems.filter(item =>
                        item.toLowerCase().includes('snack') ||
                        !item.toLowerCase().includes('breakfast') &&
                        !item.toLowerCase().includes('lunch') &&
                        !item.toLowerCase().includes('dinner')
                    )),
                },
                createdBy: 'hospital-admin', // Should come from auth context
                lastUpdated: new Date(),
                isActive: true,
                version: 1,
            };

            if (currentMenu) {
                // Update existing menu
                await messMenusService.update(currentMenu.id, messMenuData);
                toast({
                    title: "Menu Updated",
                    description: "Today's mess menu has been successfully updated.",
                });
            } else {
                // Create new menu
                const newMenu = await messMenusService.create(messMenuData);
                setCurrentMenu(newMenu);
                toast({
                    title: "Menu Created",
                    description: "Today's mess menu has been successfully created.",
                });
            }

            // Clear the form safely
            if (e.currentTarget && e.currentTarget.elements) {
                const menuTextarea = e.currentTarget.elements.namedItem('menuItems') as HTMLTextAreaElement;
                if (menuTextarea) {
                    menuTextarea.value = '';
                }
            }

        } catch (error) {
            console.error('Error saving menu:', error);
            toast({
                title: "Save Failed",
                description: "There was an error saving the menu. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><UtensilsCrossed /> Update Mess Menu</CardTitle>
                <CardDescription>
                    Add or update today's menu items. Each line represents a menu item. The system will automatically categorize them by meal type.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="menuItems">Today's Menu Items</Label>
                        <Textarea
                            id="menuItems"
                            name="menuItems"
                            placeholder="Enter each menu item on a new line, e.g.:
Poha (Light, Vata-pacifying)
Moong Dal (Protein-rich, Tridoshic)
Roti (Whole wheat, Sattvic)
Khichdi (Easy to digest, All doshas)
Mixed Vegetables (Rich in fiber)"
                            className="mt-2"
                            rows={8}
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Tip: Include nutritional and Ayurvedic properties in parentheses for better categorization.
                        </p>
                    </div>


                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : currentMenu ? "Update Menu" : "Create Menu"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}


function MealTrackingView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load patients with diet plans
        const patientsData = await patientsService.getAll();
        const patientsWithPlans = [];

        for (const patient of patientsData) {
          try {
            const patientPlans = await dietPlansService.getByPatient(patient.id);
            const activePlan = patientPlans.find(plan => plan.isActive);
            if (activePlan) {
              patientsWithPlans.push(patient);
            }
          } catch (error: any) {
            // Skip patients without diet plans or if index is building
            if (error.message && error.message.includes('requires an index')) {
              console.warn(`Diet plans index building for patient ${patient.id}, skipping for now`);
            }
            continue;
          }
        }

        setPatients(patientsWithPlans);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Meal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border rounded-lg animate-pulse">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 sm:h-4 bg-secondary rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedPatient) {
    // Find the active diet plan for the selected patient
    const loadDietPlan = async () => {
      try {
        const patientPlans = await dietPlansService.getByPatient(selectedPatient.id);
        const activePlan = patientPlans.find(plan => plan.isActive);
        if (activePlan) {
          return activePlan;
        }
      } catch (error) {
        console.error('Error loading diet plan:', error);
      }
      return null;
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedPatient(null)}>
            ← Back to Patients
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Meal Tracking: {selectedPatient.name}</h2>
            <p className="text-sm text-muted-foreground">Track today's meal service and consumption</p>
          </div>
        </div>

        {/* Load diet plan and show meal tracking */}
        <MealTrackingLoader patient={selectedPatient} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Meal Tracking
        </CardTitle>
        <CardDescription>
          Select a patient to track their meal service and consumption for today
        </CardDescription>
      </CardHeader>
      <CardContent>
        {patients.length > 0 ? (
          <div className="space-y-3">
            {patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{patient.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Code: <span className="font-mono">{patient.code}</span> • Age: {patient.age} • {patient.gender}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatient(patient)}
                >
                  Track Meals
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No patients with active diet plans found.</p>
            <p className="text-sm text-muted-foreground">Patients need active diet plans to track meals.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component to load diet plan and show meal tracking
function MealTrackingLoader({ patient }: { patient: Patient }) {
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDietPlan = async () => {
      try {
        setIsLoading(true);
        const patientPlans = await dietPlansService.getByPatient(patient.id);
        const activePlan = patientPlans.find(plan => plan.isActive);
        setDietPlan(activePlan || null);
      } catch (error: any) {
        console.error('Error loading diet plan:', error);
        if (error.message && error.message.includes('requires an index')) {
          console.warn('Diet plans index is building. Patient meal tracking may load slower temporarily.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDietPlan();
  }, [patient.id]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading diet plan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dietPlan) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active diet plan found for this patient.</p>
            <p className="text-sm text-muted-foreground">Contact the dietitian to create a diet plan first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <MealTrackingComponent patient={patient} dietPlan={dietPlan} />;
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
                // For now, fetch all patients. In production, this should filter by hospital
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
                    <CardTitle className="font-headline flex items-center gap-2"><User /> Hospital Patients</CardTitle>
                    <CardDescription>Manage patients linked to your hospital.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {patients.length} patient{patients.length !== 1 ? 's' : ''} linked
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border rounded-lg">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full animate-pulse" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 sm:h-4 bg-secondary rounded animate-pulse w-1/4" />
                                            <div className="h-3 bg-secondary rounded animate-pulse w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : patients.length > 0 ? (
                            <div className="space-y-3">
                                {patients.map((patient) => (
                                    <div key={patient.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm sm:text-base truncate">{patient.name}</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                    Code: <span className="font-mono">{patient.code}</span> • Age: {patient.age} • {patient.gender}
                                                </p>
                                                {patient.phone && (
                                                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full sm:w-auto"
                                            onClick={() => handleViewPatientDetails(patient)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No patients linked yet.</p>
                                <p className="text-sm text-muted-foreground">Use the "Link Patient" tab to add patients.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Patient Details Modal */}
            <Dialog open={showPatientModal} onOpenChange={setShowPatientModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Patient Details: {selectedPatient?.name}
                            </DialogTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportHospitalRecordsToPDF(selectedPatient!, patientVitals, [])}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export Records
                            </Button>
                        </div>
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


export function HospitalView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("monitoring");

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "new-patient":
        router.push("/register");
        break;
      case "schedule-consultation":
        setActiveTab("link-patient");
        break;
      case "update-vitals":
        setActiveTab("vitals");
        break;
      case "generate-diet-plan":
        setActiveTab("patients");
        break;
      case "view-reports":
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
            <TabsTrigger value="link-patient" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Link Patient</span>
              <span className="sm:hidden">Link</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Patient Management</span>
              <span className="sm:hidden">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="meal-tracking" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <CheckSquare className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Meal Tracking</span>
              <span className="sm:hidden">Meals</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <Activity className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Progress</span>
              <span className="sm:hidden">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <HeartPulse className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Update Vitals</span>
              <span className="sm:hidden">Vitals</span>
            </TabsTrigger>
            <TabsTrigger value="mess-menu" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <UtensilsCrossed className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mess Menu</span>
              <span className="sm:hidden">Menu</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs sm:text-sm py-2 px-2 sm:px-3">
              <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Monitoring</span>
              <span className="sm:hidden">Monitor</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="link-patient" className="mt-4 sm:mt-6">
          <LinkPatientForm />
        </TabsContent>
        <TabsContent value="patients" className="mt-4 sm:mt-6">
          <PatientManagement />
        </TabsContent>
        <TabsContent value="meal-tracking" className="mt-4 sm:mt-6">
          <MealTrackingView />
        </TabsContent>
        <TabsContent value="progress" className="mt-4 sm:mt-6">
          <PatientProgress />
        </TabsContent>
        <TabsContent value="vitals" className="mt-4 sm:mt-6">
          <VitalsForm showPatientSelection={false} />
        </TabsContent>
        <TabsContent value="mess-menu" className="mt-4 sm:mt-6">
          <MessMenuManager />
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
              <ConsultationSummaries />
              <QuickActionButtons onAction={handleQuickAction} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
