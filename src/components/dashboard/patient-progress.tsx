"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar as CalendarIcon,
  Target,
  CheckCircle,
  AlertCircle,
  User,
  BarChart3,
  Download,
  CalendarDays,
  Filter
} from "lucide-react";
import { patientsService, vitalsService, consultationsService, patientFeedbackService } from "@/lib/firestore";
import { exportPatientProgressToPDF } from "@/lib/pdf-utils";
import type { Patient, Vitals, PatientFeedback } from "@/lib/types";

// CSV Export utility
const exportToCSV = (data: any[], filename: string) => {
   if (data.length === 0) return;

   const headers = Object.keys(data[0]);
   const csvContent = [
     headers.join(','),
     ...data.map(row => headers.map(header => {
       const value = row[header];
       // Handle dates
       if (value instanceof Date) return value.toISOString();
       if (typeof value === 'object' && value !== null) return JSON.stringify(value);
       return String(value || '');
     }).join(','))
   ].join('\n');

   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   const link = document.createElement('a');
   const url = URL.createObjectURL(blob);
   link.setAttribute('href', url);
   link.setAttribute('download', filename);
   link.style.visibility = 'hidden';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
};
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface PatientProgressProps {
  patientId?: string; // If provided, show specific patient, otherwise show overview
  userType?: 'patient' | 'dietitian' | 'hospital'; // Controls what data user can access
}

export function PatientProgress({ patientId, userType = 'patient' }: PatientProgressProps) {
   const { toast } = useToast();
   const [patients, setPatients] = useState<Patient[]>([]);
   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
   const [vitalsHistory, setVitalsHistory] = useState<Vitals[]>([]);
   const [feedbackHistory, setFeedbackHistory] = useState<PatientFeedback[]>([]);
   const [consultations, setConsultations] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   // Date range filtering
   const [dateFrom, setDateFrom] = useState<Date | undefined>();
   const [dateTo, setDateTo] = useState<Date | undefined>();

  // Helper function to safely convert dates
  const formatDate = (date: any): string => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString();
    }
    return 'Invalid Date';
  };

  // Helper function to get Date object from various formats
  const getDateObject = (date: any): Date => {
    if (date instanceof Date) return date;
    if (date && typeof date === 'object' && 'toDate' in date) return date.toDate();
    return new Date(date);
  };

  // Filter data by date range
  const filterByDateRange = <T extends { date: any }>(data: T[]): T[] => {
    if (!dateFrom && !dateTo) return data;

    return data.filter(item => {
      const itemDate = getDateObject(item.date);
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo && itemDate > dateTo) return false;
      return true;
    });
  };

  useEffect(() => {
    if (patientId) {
      loadPatientData(patientId);
    } else if (userType === 'dietitian' || userType === 'hospital') {
      loadAllPatients();
    } else {
      // For patients without patientId, this shouldn't happen in normal flow
      setIsLoading(false);
    }
  }, [patientId, userType]);

  const loadAllPatients = async () => {
    try {
      setIsLoading(true);
      const patientsData = await patientsService.getAll();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientData = async (id: string) => {
    try {
      setIsLoading(true);
      const patient = await patientsService.getById(id);
      setSelectedPatient(patient);

      if (patient) {
        // Load all related data
        const [vitals, feedback, consults] = await Promise.all([
          vitalsService.getByPatient(id),
          patientFeedbackService.getByPatient(id),
          consultationsService.getByPatient(id)
        ]);

        setVitalsHistory(vitals);
        setFeedbackHistory(feedback);
        setConsultations(consults);
      }
    } catch (error: any) {
      console.error('Error loading patient data:', error);
      if (error.message && error.message.includes('requires an index')) {
        toast({
          title: "Data Loading",
          description: "Progress data may take a moment to load while database optimizes.",
          variant: "default",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgressMetrics = () => {
    if (!selectedPatient) return null;

    const filteredVitals = filterByDateRange(vitalsHistory);
    const filteredFeedback = filterByDateRange(feedbackHistory);
    const filteredConsultations = filterByDateRange(consultations);

    if (filteredVitals.length === 0) return null;

    const latestVitals = filteredVitals[0]; // Already sorted by date desc
    const firstVitals = filteredVitals[filteredVitals.length - 1];

    const weightChange = latestVitals.weight - firstVitals.weight;
    const bmiChange = latestVitals.bmi - firstVitals.bmi;

    // Calculate average feedback scores
    const avgEnergy = filteredFeedback.length > 0
      ? filteredFeedback.reduce((sum, f) => sum + f.energyLevel, 0) / filteredFeedback.length
      : 0;

    const avgDigestion = filteredFeedback.length > 0
      ? filteredFeedback.reduce((sum, f) => {
          const score = f.digestion === 'excellent' ? 5 :
                        f.digestion === 'good' ? 4 :
                        f.digestion === 'fair' ? 3 :
                        f.digestion === 'poor' ? 2 : 1;
          return sum + score;
        }, 0) / filteredFeedback.length
      : 0;

    return {
      weightChange,
      bmiChange,
      avgEnergy,
      avgDigestion,
      totalConsultations: filteredConsultations.length,
      totalFeedback: filteredFeedback.length,
    };
  };

  const getProgressColor = (change: number) => {
    if (Math.abs(change) < 0.5) return 'text-blue-600'; // Stable
    return change > 0 ? 'text-red-600' : 'text-green-600'; // Increase/Decrease
  };

  const getProgressIcon = (change: number) => {
    if (Math.abs(change) < 0.5) return <Activity className="h-4 w-4" />;
    return change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Patient Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-secondary rounded animate-pulse w-1/4" />
                <div className="h-8 bg-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Patient selection view (only for dietitians/hospital staff)
  if (!selectedPatient && !patientId && (userType === 'dietitian' || userType === 'hospital')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Patient Progress Analytics
          </CardTitle>
          <CardDescription>
            Select a patient to view their progress over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {patient.code} • Age: {patient.age}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => loadPatientData(patient.id)}
                  >
                    View Progress
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No patients found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // For patients without data or access
  if (userType === 'patient' && (!selectedPatient || !patientId)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Progress Dashboard
          </CardTitle>
          <CardDescription>
            Track your health improvements and monitor your Ayurvedic journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No progress data available yet.</p>
            <p className="text-sm text-muted-foreground">
              Start by submitting your daily feedback and recording your vitals to see your progress here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Individual patient progress view
  const metrics = calculateProgressMetrics();

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {userType === 'patient' ? 'Your Progress' : `Progress: ${selectedPatient?.name}`}
              </CardTitle>
              <CardDescription>
                {userType === 'patient'
                  ? 'Track your health improvements and monitor your Ayurvedic journey'
                  : 'Track improvements and monitor patient health metrics over time'
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
               {/* Date Range Filter */}
               <div className="flex items-center gap-2">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <div className="flex gap-2">
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={dateFrom}
                         onSelect={setDateFrom}
                         initialFocus
                       />
                     </PopoverContent>
                   </Popover>
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         {dateTo ? format(dateTo, "MMM dd") : "To"}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="start">
                       <Calendar
                         mode="single"
                         selected={dateTo}
                         onSelect={setDateTo}
                         initialFocus
                       />
                     </PopoverContent>
                   </Popover>
                   {(dateFrom || dateTo) && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => {
                         setDateFrom(undefined);
                         setDateTo(undefined);
                       }}
                     >
                       Clear
                     </Button>
                   )}
                 </div>
               </div>

               {userType !== 'patient' && (
                 <div className="flex gap-2">
                   <Button
                     variant="outline"
                     onClick={() => exportPatientProgressToPDF(selectedPatient!, vitalsHistory, feedbackHistory, consultations)}
                   >
                     <Download className="mr-2 h-4 w-4" />
                     Export PDF
                   </Button>
                   <Button
                     variant="outline"
                     onClick={() => {
                     const vitalsData = filterByDateRange(vitalsHistory).map(v => ({
                       date: format(getDateObject(v.date), "yyyy-MM-dd"),
                       weight: v.weight,
                       bmi: v.bmi,
                       systolic_bp: v.bloodPressure.systolic,
                       diastolic_bp: v.bloodPressure.diastolic,
                       temperature: v.temperature || '',
                       pulse: v.pulse || '',
                       notes: v.notes || ''
                     }));

                     const feedbackData = filterByDateRange(feedbackHistory).map(f => ({
                       date: format(getDateObject(f.date), "yyyy-MM-dd"),
                       energy_level: f.energyLevel,
                       digestion: f.digestion,
                       breakfast_adherence: f.mealAdherence.breakfast,
                       lunch_adherence: f.mealAdherence.lunch,
                       dinner_adherence: f.mealAdherence.dinner,
                       snacks_adherence: f.mealAdherence.snacks,
                       water_intake: f.waterIntake,
                       sleep_quality: f.sleepQuality,
                       symptoms: f.symptoms.join('; '),
                       overall_feeling: f.overallFeeling,
                       additional_notes: f.additionalNotes || ''
                     }));

                     const consultationsData = filterByDateRange(consultations).map(c => ({
                       date: format(getDateObject(c.date), "yyyy-MM-dd"),
                       notes: c.notes || '',
                       recommendations: c.recommendations || '',
                       status: c.status
                     }));

                     if (vitalsData.length > 0) {
                       exportToCSV(vitalsData, `${selectedPatient!.name}_vitals_${format(new Date(), "yyyy-MM-dd")}.csv`);
                     }
                     if (feedbackData.length > 0) {
                       exportToCSV(feedbackData, `${selectedPatient!.name}_feedback_${format(new Date(), "yyyy-MM-dd")}.csv`);
                     }
                     if (consultationsData.length > 0) {
                       exportToCSV(consultationsData, `${selectedPatient!.name}_consultations_${format(new Date(), "yyyy-MM-dd")}.csv`);
                     }
                   }}
                   >
                     <Download className="mr-2 h-4 w-4" />
                     Export CSV
                   </Button>
                 </div>
               )}
               {!patientId && (userType === 'dietitian' || userType === 'hospital') && (
                 <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                   ← Back to Patients
                 </Button>
               )}
             </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weight Change</p>
                  <p className={`text-2xl font-bold ${getProgressColor(metrics.weightChange)}`}>
                    {metrics.weightChange > 0 ? '+' : ''}{metrics.weightChange.toFixed(1)} kg
                  </p>
                </div>
                {getProgressIcon(metrics.weightChange)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">BMI Change</p>
                  <p className={`text-2xl font-bold ${getProgressColor(metrics.bmiChange)}`}>
                    {metrics.bmiChange > 0 ? '+' : ''}{metrics.bmiChange.toFixed(1)}
                  </p>
                </div>
                {getProgressIcon(metrics.bmiChange)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Energy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.avgEnergy.toFixed(1)}/5
                  </p>
                </div>
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consultations</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.totalConsultations}
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Progress Tabs */}
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vitals">
            {userType === 'patient' ? 'My Vitals' : 'Vitals History'}
          </TabsTrigger>
          <TabsTrigger value="feedback">
            {userType === 'patient' ? 'My Feedback' : 'Patient Feedback'}
          </TabsTrigger>
          <TabsTrigger value="consultations">
            {userType === 'patient' ? 'My Consultations' : 'Consultations'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="mt-4">
           <Card>
             <CardHeader>
               <CardTitle>
                 {userType === 'patient' ? 'My Vitals Trends' : 'Vitals Trends'}
               </CardTitle>
               <CardDescription>
                 {userType === 'patient'
                   ? 'Track your vital signs progression over time'
                   : 'Interactive charts showing vital signs progression over time'
                 }
               </CardDescription>
             </CardHeader>
             <CardContent>
               {filterByDateRange(vitalsHistory).length > 0 ? (
                 <div className="space-y-6">
                   {/* Weight and BMI Chart */}
                   <div>
                     <h4 className="text-sm font-medium mb-4">Weight & BMI Trends</h4>
                     <ChartContainer
                       config={{
                         weight: {
                           label: "Weight (kg)",
                           color: "hsl(var(--chart-1))",
                         },
                         bmi: {
                           label: "BMI",
                           color: "hsl(var(--chart-2))",
                         },
                       }}
                       className="h-[300px]"
                     >
                       <LineChart data={filterByDateRange(vitalsHistory).map(v => ({
                         date: format(getDateObject(v.date), "MMM dd"),
                         weight: v.weight,
                         bmi: v.bmi,
                       })).reverse()}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="date" />
                         <YAxis yAxisId="weight" orientation="left" />
                         <YAxis yAxisId="bmi" orientation="right" />
                         <ChartTooltip content={<ChartTooltipContent />} />
                         <Line
                           yAxisId="weight"
                           type="monotone"
                           dataKey="weight"
                           stroke="var(--color-weight)"
                           strokeWidth={2}
                           dot={{ fill: "var(--color-weight)" }}
                         />
                         <Line
                           yAxisId="bmi"
                           type="monotone"
                           dataKey="bmi"
                           stroke="var(--color-bmi)"
                           strokeWidth={2}
                           dot={{ fill: "var(--color-bmi)" }}
                         />
                       </LineChart>
                     </ChartContainer>
                   </div>

                   {/* Blood Pressure Chart */}
                   <div>
                     <h4 className="text-sm font-medium mb-4">Blood Pressure Trends</h4>
                     <ChartContainer
                       config={{
                         systolic: {
                           label: "Systolic",
                           color: "hsl(var(--chart-3))",
                         },
                         diastolic: {
                           label: "Diastolic",
                           color: "hsl(var(--chart-4))",
                         },
                       }}
                       className="h-[300px]"
                     >
                       <LineChart data={filterByDateRange(vitalsHistory).map(v => ({
                         date: format(getDateObject(v.date), "MMM dd"),
                         systolic: v.bloodPressure.systolic,
                         diastolic: v.bloodPressure.diastolic,
                       })).reverse()}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="date" />
                         <YAxis />
                         <ChartTooltip content={<ChartTooltipContent />} />
                         <Line
                           type="monotone"
                           dataKey="systolic"
                           stroke="var(--color-systolic)"
                           strokeWidth={2}
                           dot={{ fill: "var(--color-systolic)" }}
                         />
                         <Line
                           type="monotone"
                           dataKey="diastolic"
                           stroke="var(--color-diastolic)"
                           strokeWidth={2}
                           dot={{ fill: "var(--color-diastolic)" }}
                         />
                       </LineChart>
                     </ChartContainer>
                   </div>

                   {/* Recent Vitals List */}
                   <div>
                     <h4 className="text-sm font-medium mb-4">Recent Recordings</h4>
                     <div className="space-y-2">
                       {filterByDateRange(vitalsHistory).slice(0, 5).map((vitals, index) => (
                         <div key={vitals.id} className="flex items-center justify-between p-3 border rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                               <Activity className="w-3 h-3 text-primary" />
                             </div>
                             <div>
                               <p className="text-sm font-medium">
                                 {formatDate(vitals.date)}
                               </p>
                               <p className="text-xs text-muted-foreground">
                                 BP: {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} •
                                 Weight: {vitals.weight}kg • BMI: {vitals.bmi.toFixed(1)}
                               </p>
                             </div>
                           </div>
                           {index === 0 && (
                             <Badge variant="default" className="text-xs">Latest</Badge>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                   <p className="text-muted-foreground">No vitals recorded in selected date range.</p>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>

        <TabsContent value="feedback" className="mt-4">
           <div className="space-y-6">
             {/* Energy Level Progress Chart */}
             <Card>
               <CardHeader>
                 <CardTitle>Energy Level Progress</CardTitle>
                 <CardDescription>Track patient's energy levels over time</CardDescription>
               </CardHeader>
               <CardContent>
                 {filterByDateRange(feedbackHistory).length > 0 ? (
                   <ChartContainer
                     config={{
                       energy: {
                         label: "Energy Level",
                         color: "hsl(var(--chart-1))",
                       },
                     }}
                     className="h-[250px]"
                   >
                     <LineChart data={filterByDateRange(feedbackHistory).map(f => ({
                       date: format(getDateObject(f.date), "MMM dd"),
                       energy: f.energyLevel,
                     })).reverse()}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="date" />
                       <YAxis domain={[1, 5]} />
                       <ChartTooltip content={<ChartTooltipContent />} />
                       <Line
                         type="monotone"
                         dataKey="energy"
                         stroke="var(--color-energy)"
                         strokeWidth={2}
                         dot={{ fill: "var(--color-energy)", r: 4 }}
                       />
                     </LineChart>
                   </ChartContainer>
                 ) : (
                   <div className="text-center py-8">
                     <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">No energy data in selected range</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Meal Adherence Analytics */}
             <Card>
               <CardHeader>
                 <CardTitle>Meal Adherence Analytics</CardTitle>
                 <CardDescription>Percentage of meals followed by type</CardDescription>
               </CardHeader>
               <CardContent>
                 {filterByDateRange(feedbackHistory).length > 0 ? (
                   <ChartContainer
                     config={{
                       breakfast: { label: "Breakfast", color: "hsl(var(--chart-1))" },
                       lunch: { label: "Lunch", color: "hsl(var(--chart-2))" },
                       dinner: { label: "Dinner", color: "hsl(var(--chart-3))" },
                       snacks: { label: "Snacks", color: "hsl(var(--chart-4))" },
                     }}
                     className="h-[300px]"
                   >
                     <BarChart data={[
                       {
                         meal: "Breakfast",
                         adherence: (filterByDateRange(feedbackHistory).filter(f => f.mealAdherence.breakfast).length / filterByDateRange(feedbackHistory).length) * 100,
                       },
                       {
                         meal: "Lunch",
                         adherence: (filterByDateRange(feedbackHistory).filter(f => f.mealAdherence.lunch).length / filterByDateRange(feedbackHistory).length) * 100,
                       },
                       {
                         meal: "Dinner",
                         adherence: (filterByDateRange(feedbackHistory).filter(f => f.mealAdherence.dinner).length / filterByDateRange(feedbackHistory).length) * 100,
                       },
                       {
                         meal: "Snacks",
                         adherence: (filterByDateRange(feedbackHistory).filter(f => f.mealAdherence.snacks).length / filterByDateRange(feedbackHistory).length) * 100,
                       },
                     ]}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="meal" />
                       <YAxis label={{ value: 'Adherence %', angle: -90, position: 'insideLeft' }} />
                       <ChartTooltip content={<ChartTooltipContent />} />
                       <Bar dataKey="adherence" fill="var(--color-breakfast)" />
                     </BarChart>
                   </ChartContainer>
                 ) : (
                   <div className="text-center py-8">
                     <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">No meal adherence data in selected range</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Symptom Tracking */}
             <Card>
               <CardHeader>
                 <CardTitle>Symptom Tracking</CardTitle>
                 <CardDescription>Most common symptoms reported</CardDescription>
               </CardHeader>
               <CardContent>
                 {filterByDateRange(feedbackHistory).length > 0 ? (
                   (() => {
                     const symptomCounts: { [key: string]: number } = {};
                     filterByDateRange(feedbackHistory).forEach(f => {
                       f.symptoms.forEach(symptom => {
                         symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
                       });
                     });

                     const symptomData = Object.entries(symptomCounts)
                       .sort(([,a], [,b]) => b - a)
                       .slice(0, 8)
                       .map(([symptom, count]) => ({ symptom, count }));

                     return symptomData.length > 0 ? (
                       <ChartContainer
                         config={{
                           count: { label: "Occurrences", color: "hsl(var(--chart-1))" },
                         }}
                         className="h-[300px]"
                       >
                         <BarChart data={symptomData} layout="horizontal">
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis type="number" />
                           <YAxis dataKey="symptom" type="category" width={80} />
                           <ChartTooltip content={<ChartTooltipContent />} />
                           <Bar dataKey="count" fill="var(--color-count)" />
                         </BarChart>
                       </ChartContainer>
                     ) : (
                       <div className="text-center py-8">
                         <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                         <p className="text-sm text-muted-foreground">No symptoms reported - great progress!</p>
                       </div>
                     );
                   })()
                 ) : (
                   <div className="text-center py-8">
                     <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">No feedback data in selected range</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Recent Feedback List */}
             <Card>
               <CardHeader>
                 <CardTitle>Recent Feedback</CardTitle>
                 <CardDescription>Latest patient-reported information</CardDescription>
               </CardHeader>
               <CardContent>
                 {filterByDateRange(feedbackHistory).length > 0 ? (
                   <div className="space-y-3">
                     {filterByDateRange(feedbackHistory).slice(0, 3).map((feedback) => (
                       <div key={feedback.id} className="p-3 border rounded-lg">
                         <div className="flex items-center justify-between mb-2">
                           <p className="text-sm font-medium">
                             {formatDate(feedback.date)}
                           </p>
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-xs">Energy: {feedback.energyLevel}/5</Badge>
                             <Badge variant={
                               feedback.digestion === 'excellent' || feedback.digestion === 'good' ? 'default' :
                               feedback.digestion === 'fair' ? 'secondary' : 'destructive'
                             } className="text-xs">
                               {feedback.digestion}
                             </Badge>
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 text-xs">
                           <div>
                             <span className="font-medium">Meal Adherence:</span>
                             <div className="flex gap-1 mt-1">
                               {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                                 <Badge
                                   key={meal}
                                   variant={feedback.mealAdherence[meal as keyof typeof feedback.mealAdherence] ? 'default' : 'secondary'}
                                   className="text-xs px-1 py-0"
                                 >
                                   {meal[0].toUpperCase()}
                                 </Badge>
                               ))}
                             </div>
                           </div>

                           <div>
                             <span className="font-medium">Water:</span>
                             <p className="text-xs">{feedback.waterIntake} glasses</p>
                           </div>
                         </div>

                         {feedback.symptoms.length > 0 && (
                           <div className="mt-2">
                             <span className="font-medium text-xs">Symptoms:</span>
                             <div className="flex flex-wrap gap-1 mt-1">
                               {feedback.symptoms.map(symptom => (
                                 <Badge key={symptom} variant="outline" className="text-xs">
                                   {symptom}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">No feedback recorded in selected date range.</p>
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </TabsContent>

        <TabsContent value="consultations" className="mt-4">
           <Card>
             <CardHeader>
               <CardTitle>Consultation Timeline</CardTitle>
               <CardDescription>Review consultation history and recommendations</CardDescription>
             </CardHeader>
             <CardContent>
               {filterByDateRange(consultations).length > 0 ? (
                 <div className="space-y-4">
                   {filterByDateRange(consultations).slice(0, 10).map((consultation) => (
                     <div key={consultation.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                       <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                         <CalendarIcon className="w-4 h-4 text-primary" />
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-2">
                           <p className="font-medium">
                             Consultation #{consultation.id.slice(-6)}
                           </p>
                           <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'}>
                             {consultation.status}
                           </Badge>
                         </div>
                         <p className="text-sm text-muted-foreground mb-2">
                           {formatDate(consultation.date)}
                         </p>
                         {consultation.notes && (
                           <p className="text-sm line-clamp-2">{consultation.notes}</p>
                         )}
                         {consultation.recommendations && (
                           <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                             <span className="font-medium">Recommendations:</span>
                             <p className="mt-1">{consultation.recommendations}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                   <p className="text-muted-foreground">No consultations recorded in selected date range.</p>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}