"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import {
  User,
  Activity,
  Heart,
  Utensils,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  BarChart3,
  Zap,
  FileText
} from "lucide-react";
import {
  patientsService,
  vitalsService,
  mealTrackingService,
  consultationsService,
  dietPlansService
} from "@/lib/firestore";
import type { Patient, Vitals, MealTracking, Consultation, DietPlan } from "@/lib/types";

// Patient Overview Cards Component
export function PatientOverviewCards() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await patientsService.getAll();
        setPatients(patientsData.slice(0, 6)); // Show first 6 patients
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-secondary rounded w-3/4"></div>
              <div className="h-3 bg-secondary rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded"></div>
                <div className="h-3 bg-secondary rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <Card key={patient.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">{patient.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {patient.code}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {patient.age} years • {patient.gender}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Dosha:</span>
              <Badge variant={patient.doshaType ? "default" : "secondary"} className="text-xs">
                {patient.doshaType || "Not set"}
              </Badge>
            </div>
            {patient.dietaryHabits && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Habits:</span> {patient.dietaryHabits}
              </div>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Allergies:</span> {patient.allergies.join(", ")}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                View Details
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                Update Vitals
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Meal Adherence Statistics Component
export function MealAdherenceStats() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    adherenceRate: 0,
    mealsServed: 0,
    mealsSkipped: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const patients = await patientsService.getAll();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalMeals = 0;
        let eatenMeals = 0;

        for (const patient of patients) {
          try {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tracking = await mealTrackingService.getByDateRange(patient.id, today, tomorrow);
            totalMeals += tracking.length;
            eatenMeals += tracking.filter((t: MealTracking) => t.status === 'eaten').length;
          } catch (error) {
            // Skip if no tracking data
          }
        }

        const adherenceRate = totalMeals > 0 ? Math.round((eatenMeals / totalMeals) * 100) : 0;

        setStats({
          totalPatients: patients.length,
          adherenceRate,
          mealsServed: eatenMeals,
          mealsSkipped: totalMeals - eatenMeals
        });
      } catch (error) {
        console.error('Error loading meal stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const chartData = [
    { name: 'Served', value: stats.mealsServed, fill: '#22c55e' },
    { name: 'Skipped', value: stats.mealsSkipped, fill: '#ef4444' }
  ];

  const chartConfig = {
    served: {
      label: "Served",
      color: "#22c55e",
    },
    skipped: {
      label: "Skipped",
      color: "#ef4444",
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Meal Adherence Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-secondary rounded w-1/2"></div>
            <div className="h-32 bg-secondary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Meal Adherence Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.adherenceRate}%</div>
            <div className="text-sm text-muted-foreground">Adherence Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <div className="text-sm text-muted-foreground">Total Patients</div>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-32">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>

        <div className="flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Served: {stats.mealsServed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Skipped: {stats.mealsSkipped}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Vital Trends Component
export function VitalTrends() {
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const patients = await patientsService.getAll();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date;
        });

        const trendData = await Promise.all(
          last7Days.map(async (date) => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            let avgBP = 0;
            let avgWeight = 0;
            let count = 0;

            for (const patient of patients.slice(0, 5)) { // Sample first 5 patients
              try {
                const allVitals = await vitalsService.getByPatient(patient.id);
                const vitals = allVitals.filter(v => {
                  const vDate = v.date instanceof Date ? v.date : new Date((v.date as any)?.seconds * 1000 || 0);
                  return vDate >= dayStart && vDate < dayEnd;
                });
                if (vitals.length > 0) {
                  const latest = vitals[0];
                  avgBP += (latest.bloodPressure.systolic + latest.bloodPressure.diastolic) / 2;
                  avgWeight += latest.weight;
                  count++;
                }
              } catch (error) {
                // Skip
              }
            }

            return {
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              avgBP: count > 0 ? Math.round(avgBP / count) : 0,
              avgWeight: count > 0 ? Math.round(avgWeight / count * 10) / 10 : 0
            };
          })
        );

        setTrends(trendData.reverse());
      } catch (error) {
        console.error('Error loading vital trends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrends();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vital Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-48 bg-secondary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    avgBP: {
      label: "Avg Blood Pressure",
      color: "#8884d8",
    },
    avgWeight: {
      label: "Avg Weight (kg)",
      color: "#82ca9d",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Vital Trends (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48">
          <LineChart data={trends}>
            <XAxis dataKey="date" />
            <YAxis yAxisId="bp" orientation="left" />
            <YAxis yAxisId="weight" orientation="right" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              yAxisId="bp"
              type="monotone"
              dataKey="avgBP"
              stroke="#8884d8"
              strokeWidth={2}
              name="Avg Blood Pressure"
            />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="avgWeight"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Avg Weight (kg)"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Real-time Status Indicators Component
export function RealTimeStatusIndicators() {
  const [status, setStatus] = useState({
    activePatients: 0,
    pendingConsultations: 0,
    criticalVitals: 0,
    mealsDue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const patients = await patientsService.getAll();
        const consultations = await consultationsService.getAll();

        // Count active patients (with diet plans)
        let activePatients = 0;
        for (const patient of patients) {
          try {
            const plans = await dietPlansService.getByPatient(patient.id);
            if (plans.some(p => p.isActive)) activePatients++;
          } catch (error) {
            // Skip
          }
        }

        // Count pending consultations
        const pendingConsultations = consultations.filter(c => c.status === 'scheduled').length;

        // Count critical vitals (simplified - high BP)
        let criticalVitals = 0;
        for (const patient of patients.slice(0, 10)) { // Sample
          try {
            const vitals = await vitalsService.getLatest(patient.id);
            if (vitals.length > 0 && vitals[0].bloodPressure.systolic > 140) {
              criticalVitals++;
            }
          } catch (error) {
            // Skip
          }
        }

        // Count meals due today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let mealsDue = 0;
        for (const patient of patients.slice(0, 5)) { // Sample
          try {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tracking = await mealTrackingService.getByDateRange(patient.id, today, tomorrow);
            mealsDue += tracking.filter((t: MealTracking) => t.status === 'scheduled').length;
          } catch (error) {
            // Skip
          }
        }

        setStatus({
          activePatients,
          pendingConsultations,
          criticalVitals,
          mealsDue
        });
      } catch (error) {
        console.error('Error loading status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, []);

  const indicators = [
    {
      title: "Active Patients",
      value: status.activePatients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Pending Consultations",
      value: status.pendingConsultations,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Critical Vitals",
      value: status.criticalVitals,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Meals Due Today",
      value: status.mealsDue,
      icon: Utensils,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-secondary rounded w-16"></div>
                  <div className="h-4 bg-secondary rounded w-8"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {indicators.map((indicator, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${indicator.bgColor}`}>
                <indicator.icon className={`h-4 w-4 ${indicator.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{indicator.title}</p>
                <p className="text-2xl font-bold">{indicator.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Summary Widgets Component
export function SummaryWidgets() {
  const [summary, setSummary] = useState({
    totalPatients: 0,
    activeDietPlans: 0,
    consultationsThisMonth: 0,
    averageAdherence: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const patients = await patientsService.getAll();
        const consultations = await consultationsService.getAll();

        let activePlans = 0;
        for (const patient of patients) {
          try {
            const plans = await dietPlansService.getByPatient(patient.id);
            if (plans.some(p => p.isActive)) activePlans++;
          } catch (error) {
            // Skip
          }
        }

        // Consultations this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const consultationsThisMonth = consultations.filter(c =>
          c.date >= thisMonth
        ).length;

        setSummary({
          totalPatients: patients.length,
          activeDietPlans: activePlans,
          consultationsThisMonth,
          averageAdherence: 85 // Placeholder - would calculate from actual data
        });
      } catch (error) {
        console.error('Error loading summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, []);

  const widgets = [
    {
      title: "Total Patients",
      value: summary.totalPatients,
      subtitle: "Registered patients",
      icon: Users,
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Active Diet Plans",
      value: summary.activeDietPlans,
      subtitle: "Currently active",
      icon: FileText,
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Consultations",
      value: summary.consultationsThisMonth,
      subtitle: "This month",
      icon: Stethoscope,
      trend: "+15%",
      trendUp: true
    },
    {
      title: "Avg Adherence",
      value: `${summary.averageAdherence}%`,
      subtitle: "Meal compliance",
      icon: CheckCircle,
      trend: "+5%",
      trendUp: true
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-secondary rounded w-20"></div>
                <div className="h-8 bg-secondary rounded w-16"></div>
                <div className="h-3 bg-secondary rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {widgets.map((widget, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{widget.title}</p>
                <p className="text-3xl font-bold">{widget.value}</p>
                <p className="text-xs text-muted-foreground">{widget.subtitle}</p>
              </div>
              <widget.icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className={`h-4 w-4 ${widget.trendUp ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm ml-1 ${widget.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {widget.trend}
              </span>
              <span className="text-sm text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Quick Action Buttons Component
interface QuickActionButtonsProps {
  onAction?: (action: string) => void;
}

export function QuickActionButtons({ onAction }: QuickActionButtonsProps) {
  const actions = [
    {
      title: "New Patient",
      description: "Register a new patient",
      icon: User,
      action: () => onAction?.("new-patient"),
      variant: "default" as const
    },
    {
      title: "Schedule Consultation",
      description: "Book a consultation",
      icon: Calendar,
      action: () => onAction?.("schedule-consultation"),
      variant: "outline" as const
    },
    {
      title: "Update Vitals",
      description: "Record patient vitals",
      icon: Heart,
      action: () => onAction?.("update-vitals"),
      variant: "outline" as const
    },
    {
      title: "Generate Diet Plan",
      description: "Create AI diet plan",
      icon: Zap,
      action: () => onAction?.("generate-diet-plan"),
      variant: "outline" as const
    },
    {
      title: "View Reports",
      description: "Generate reports",
      icon: BarChart3,
      action: () => onAction?.("view-reports"),
      variant: "outline" as const
    },
    {
      title: "Emergency Alert",
      description: "Send emergency notification",
      icon: AlertTriangle,
      action: () => onAction?.("emergency-alert"),
      variant: "destructive" as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={action.action}
            >
              <action.icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Consultation Summaries Component
export function ConsultationSummaries() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [consultationsData, patientsData] = await Promise.all([
          consultationsService.getAll(),
          patientsService.getAll()
        ]);

        setConsultations(consultationsData.slice(0, 5)); // Recent 5
        setPatients(patientsData);
      } catch (error) {
        console.error('Error loading consultation summaries:', error);
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
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Recent Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-secondary rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Recent Consultations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {consultations.length > 0 ? (
          consultations.map((consultation) => {
            const patient = patients.find(p => p.id === consultation.patientId);
            return (
              <div key={consultation.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {patient ? patient.name : 'Unknown Patient'}
                    </p>
                    <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {consultation.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {consultation.date instanceof Date
                      ? consultation.date.toLocaleDateString()
                      : new Date((consultation.date as any)?.seconds * 1000 || 0).toLocaleDateString()
                    }
                  </p>
                  {consultation.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {consultation.notes.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No consultations recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}