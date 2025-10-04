"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { seedData } from "@/lib/firestore";
import { Database, Users, FileText, Activity, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SeedPage() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [seedResult, setSeedResult] = useState<any>(null);

  const handleSeedData = async () => {
    setIsSeeding(true);
    setProgress(0);
    setCurrentStep("Starting comprehensive data seeding...");
    setSeedResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            const steps = [
              "Creating hospitals...",
              "Setting up users...",
              "Adding patients...",
              "Recording vitals...",
              "Collecting feedback...",
              "Generating diet plans...",
              "Finalizing setup..."
            ];
            const stepIndex = Math.floor((prev / 90) * steps.length);
            setCurrentStep(steps[stepIndex] || "Processing...");
            return prev + 8;
          }
          return prev;
        });
      }, 400);

      const result = await seedData.seedAll();

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep("Complete!");

      setSeedResult(result);

      if (result.success) {
        toast({
          title: "✅ Comprehensive Data Seeding Successful!",
          description: result.message,
        });
      } else {
        toast({
          title: "❌ Data Seeding Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Unexpected Error",
        description: "An unexpected error occurred during data seeding.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    setProgress(0);
    setCurrentStep("Clearing all data...");

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 50) {
            setCurrentStep("Removing records...");
            return prev + 25;
          }
          return prev;
        });
      }, 300);

      const result = await seedData.clearAllData();

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep("Data cleared!");

      if (result.success) {
        toast({
          title: "🗑️ All Data Cleared Successfully!",
          description: "All sample data has been removed from Firestore.",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Clear Failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="h-6 w-6" />
              Comprehensive Database Seed Manager
            </CardTitle>
            <p className="text-muted-foreground">
              Populate your Firestore database with comprehensive sample data including real-time features testing.
            </p>
          </CardHeader>
        </Card>

        {/* Progress Section */}
        {(isSeeding || isClearing) && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{currentStep}</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Data Management Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleSeedData}
                disabled={isSeeding || isClearing}
                className="w-full h-16 flex-col gap-2"
                size="lg"
              >
                {isSeeding ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Database className="h-5 w-5" />
                )}
                <span>{isSeeding ? 'Seeding Data...' : '🚀 Seed Comprehensive Data'}</span>
              </Button>

              <Button
                onClick={handleClearData}
                disabled={isSeeding || isClearing}
                variant="destructive"
                className="w-full h-16 flex-col gap-2"
                size="lg"
              >
                {isClearing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                <span>{isClearing ? 'Clearing Data...' : '🗑️ Clear All Data'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seed Result */}
        {seedResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {seedResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {seedResult.success ? 'Seeding Completed Successfully!' : 'Seeding Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className={seedResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={seedResult.success ? 'text-green-800' : 'text-red-800'}>
                  {seedResult.message || seedResult.error}
                </AlertDescription>
              </Alert>

              {seedResult.success && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-sm text-blue-800">Hospitals</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <div className="text-sm text-green-800">Users</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">4</div>
                    <div className="text-sm text-purple-800">Patients</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-orange-800">Vitals Records</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              What Gets Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">🏥 Hospitals</Badge>
                  <span className="text-sm">3 Sample hospitals with different specializations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">👥 Users</Badge>
                  <span className="text-sm">12 Users (3 admins, 3 dietitians, 4 patients)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">👤 Patients</Badge>
                  <span className="text-sm">4 Patients with complete profiles and history</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">📊 Vitals</Badge>
                  <span className="text-sm">12 Vitals records with progress tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">💬 Feedback</Badge>
                  <span className="text-sm">28 Days of patient feedback data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">🍽️ Diet Plans</Badge>
                  <span className="text-sm">4 Personalized Ayurvedic diet plans</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Features Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>
                <strong>🔄 Real-Time Updates:</strong> The seeded data includes comprehensive records that work with the real-time listeners.
              </p>
              <p>
                <strong>👨‍⚕️ Dietitian View:</strong> Login as a dietitian to see patient feedback and vitals update in real-time.
              </p>
              <p>
                <strong>👥 Patient View:</strong> Patients can see their diet plans and progress update instantly when dietitians make changes.
              </p>
              <p>
                <strong>📱 Cross-Role Sync:</strong> Changes made by healthcare providers are immediately visible to patients, and vice versa.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800">Development Only</p>
                <p className="text-sm text-amber-700">
                  This seeding page should only be used during development and testing. Remove or protect this route in production environments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}