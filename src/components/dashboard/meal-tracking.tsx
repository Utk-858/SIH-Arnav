"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, User, Utensils, XCircle, AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { mealTrackingService } from "@/lib/firestore";
import { getCurrentUserId } from "@/lib/auth";
import type { MealTracking, Patient, DietPlan } from "@/lib/types";

interface MealTrackingProps {
  patient: Patient;
  dietPlan: DietPlan;
}

function MealStatusBadge({ status }: { status: MealTracking['status'] }) {
  const statusConfig = {
    scheduled: { label: 'Scheduled', icon: Clock, variant: 'secondary' as const },
    given: { label: 'Given', icon: CheckCircle, variant: 'default' as const },
    eaten: { label: 'Eaten', icon: CheckCircle, variant: 'default' as const },
    skipped: { label: 'Skipped', icon: XCircle, variant: 'destructive' as const },
    modified: { label: 'Modified', icon: AlertCircle, variant: 'outline' as const },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function QuantityBadge({ quantity }: { quantity?: MealTracking['quantity'] }) {
  if (!quantity) return null;

  const quantityLabels = {
    full: 'Full',
    half: 'Half',
    quarter: 'Quarter',
    none: 'None',
  };

  return (
    <Badge variant="outline" className="text-xs">
      {quantityLabels[quantity]}
    </Badge>
  );
}

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
}

interface EatenDialogProps extends BaseDialogProps {
  quantity: MealTracking['quantity'];
}

function MarkGivenDialog({ open, onOpenChange, notes, onNotesChange, onSubmit }: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Meal as Given</DialogTitle>
          <DialogDescription>
            Add any remarks about serving this meal to the patient.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="given-notes">Remarks (optional)</Label>
            <Textarea
              id="given-notes"
              placeholder="Enter any notes about the meal service..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            Mark as Given
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkEatenDialog({ open, onOpenChange, notes, onNotesChange, onSubmit, quantity }: EatenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Meal as {quantity === 'none' ? 'Skipped' : 'Eaten'}</DialogTitle>
          <DialogDescription>
            Add any remarks about the meal consumption.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Quantity: {quantity === 'none' ? 'Skipped' : quantity}</Label>
          </div>
          <div>
            <Label htmlFor="eaten-notes">Remarks (optional)</Label>
            <Textarea
              id="eaten-notes"
              placeholder="Enter any notes about the meal consumption..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MealTrackingComponent({ patient, dietPlan }: MealTrackingProps) {
  const { toast } = useToast();
  const [mealTracking, setMealTracking] = useState<MealTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Dialog states
  const [givenDialogOpen, setGivenDialogOpen] = useState(false);
  const [eatenDialogOpen, setEatenDialogOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<MealTracking['quantity']>('full');

  useEffect(() => {
    loadMealTracking();

    // Set up real-time subscription if enabled
    let unsubscribe: (() => void) | undefined;
    if (realTimeEnabled) {
      unsubscribe = mealTrackingService.subscribe(patient.id, (meals) => {
        setMealTracking(meals);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [patient.id, realTimeEnabled]);

  const loadMealTracking = async () => {
    try {
      setIsLoading(true);
      const todayMeals = await mealTrackingService.getTodayMeals(patient.id);
      setMealTracking(todayMeals);
    } catch (error) {
      console.error('Error loading meal tracking:', error);
      toast({
        title: "Error",
        description: "Failed to load meal tracking data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsGiven = (mealTrackingId: string) => {
    setSelectedMealId(mealTrackingId);
    setNotes('');
    setGivenDialogOpen(true);
  };

  const handleGivenSubmit = async () => {
    if (!selectedMealId) return;

    try {
      await mealTrackingService.markAsGiven(selectedMealId, 'hospital-staff', notes.trim() || undefined);
      toast({
        title: "Meal Marked as Given",
        description: "The meal has been marked as served to the patient.",
      });
      setGivenDialogOpen(false);
      setSelectedMealId(null);
      setNotes('');
      loadMealTracking(); // Refresh data
    } catch (error) {
      console.error('Error marking meal as given:', error);
      toast({
        title: "Error",
        description: "Failed to mark meal as given.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsEaten = (mealTrackingId: string, eatenBy: 'patient' | 'family', quantity: MealTracking['quantity']) => {
    setSelectedMealId(mealTrackingId);
    setSelectedQuantity(quantity);
    setNotes('');
    setEatenDialogOpen(true);
  };

  const handleEatenSubmit = async (eatenBy: 'patient' | 'family') => {
    if (!selectedMealId) return;

    try {
      await mealTrackingService.markAsEaten(selectedMealId, eatenBy, selectedQuantity, notes.trim() || undefined);
      toast({
        title: "Meal Status Updated",
        description: `Meal marked as ${selectedQuantity === 'none' ? 'skipped' : `eaten (${selectedQuantity}) by ${eatenBy}`}.`,
      });
      setEatenDialogOpen(false);
      setSelectedMealId(null);
      setNotes('');
      setSelectedQuantity('full');
      loadMealTracking(); // Refresh data
    } catch (error) {
      console.error('Error marking meal as eaten:', error);
      toast({
        title: "Error",
        description: "Failed to update meal status.",
        variant: "destructive",
      });
    }
  };

  // Generate meal tracking records for today's diet plan
  const generateTodayMeals = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if meals are already tracked for today
      const existingMeals = mealTracking.filter(meal => {
        const mealDate = meal.scheduledDate instanceof Date ? meal.scheduledDate : new Date(meal.scheduledDate);
        return mealDate.toDateString() === today.toDateString();
      });

      if (existingMeals.length > 0) {
        toast({
          title: "Meals Already Tracked",
          description: "Today's meals are already being tracked.",
        });
        return;
      }

      // Generate meal tracking records for each meal in the diet plan
      const mealPromises = [];

      for (const day of dietPlan.dietDays) {
        for (const meal of day.meals) {
          const mealTrackingData: Omit<MealTracking, 'id'> = {
            patientId: patient.id,
            dietPlanId: dietPlan.id,
            mealId: `${dietPlan.id}-${day.day}-${meal.time}`, // Generate unique meal ID
            mealType: meal.time.toLowerCase().includes('breakfast') ? 'breakfast' :
                     meal.time.toLowerCase().includes('lunch') ? 'lunch' :
                     meal.time.toLowerCase().includes('dinner') ? 'dinner' : 'snacks',
            scheduledDate: today,
            status: 'scheduled',
          };

          mealPromises.push(mealTrackingService.create(mealTrackingData));
        }
      }

      await Promise.all(mealPromises);

      // Schedule meal reminders for the patient
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          console.warn('No current user found for scheduling meal reminders');
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/notifications/schedule-meal-reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': userId,
          },
        });

        if (!response.ok) {
          console.warn('Failed to schedule meal reminders:', response.statusText);
        }
      } catch (error) {
        console.warn('Error scheduling meal reminders:', error);
      }

      toast({
        title: "Meals Generated",
        description: "Today's meal tracking has been set up.",
      });

      loadMealTracking(); // Refresh data
    } catch (error) {
      console.error('Error generating meals:', error);
      toast({
        title: "Error",
        description: "Failed to generate meal tracking.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Meal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-secondary rounded w-24" />
                  <div className="h-3 bg-secondary rounded w-32" />
                </div>
                <div className="h-8 bg-secondary rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4 xs:pb-6">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-lg xs:text-xl">
              <Utensils className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" />
              <span className="truncate">Meal Tracking - {patient.name}</span>
            </CardTitle>
            <CardDescription className="text-sm xs:text-base mt-1">
              Track meal service and consumption for today's diet plan
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 xs:gap-4 w-full xs:w-auto">
            <div className="flex items-center gap-2">
              <Label htmlFor="realtime-toggle" className="text-sm">
                {realTimeEnabled ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
              </Label>
              <Switch
                id="realtime-toggle"
                checked={realTimeEnabled}
                onCheckedChange={setRealTimeEnabled}
              />
              <Label htmlFor="realtime-toggle" className="text-sm">
                Real-time
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMealTracking()}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate Today's Meals Button */}
        {mealTracking.length === 0 && (
          <div className="text-center py-6">
            <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No meals tracked for today.</p>
            <Button onClick={generateTodayMeals}>
              Generate Today's Meals
            </Button>
          </div>
        )}

        {/* Meal Tracking List */}
        {mealTracking.length > 0 && (
          <div className="space-y-3">
            {mealTracking.map((meal) => (
              <div key={meal.id} className="flex flex-col tablet:flex-row tablet:items-center justify-between p-3 xs:p-4 border rounded-lg gap-3 tablet:gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium capitalize text-sm xs:text-base">{meal.mealType}</h4>
                    <MealStatusBadge status={meal.status} />
                    {meal.quantity && <QuantityBadge quantity={meal.quantity} />}
                  </div>

                  <div className="text-xs xs:text-sm text-muted-foreground space-y-1">
                    {meal.givenBy && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Given by {meal.givenBy} at {meal.givenAt ? new Date(meal.givenAt).toLocaleTimeString() : 'Unknown'}</span>
                      </div>
                    )}

                    {meal.eatenBy && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{meal.quantity === 'none' ? 'Skipped' : `Eaten by ${meal.eatenBy}`}
                        {meal.eatenAt && ` at ${new Date(meal.eatenAt).toLocaleTimeString()}`}</span>
                      </div>
                    )}

                    {meal.notes && (
                      <div className="text-xs italic p-2 bg-secondary/50 rounded">Note: {meal.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 xs:gap-2 flex-shrink-0">
                  {meal.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsGiven(meal.id)}
                      className="text-xs xs:text-sm"
                    >
                      Mark Given
                    </Button>
                  )}

                  {meal.status === 'given' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsEaten(meal.id, 'patient', 'full')}
                        className="text-xs xs:text-sm px-2 xs:px-3"
                      >
                        <span className="hidden xs:inline">Eaten (Full)</span>
                        <span className="xs:hidden">Full</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsEaten(meal.id, 'patient', 'half')}
                        className="text-xs xs:text-sm px-2 xs:px-3"
                      >
                        <span className="hidden xs:inline">Eaten (Half)</span>
                        <span className="xs:hidden">Half</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMarkAsEaten(meal.id, 'patient', 'none')}
                        className="text-xs xs:text-sm px-2 xs:px-3"
                      >
                        <span className="hidden xs:inline">Skipped</span>
                        <span className="xs:hidden">Skip</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <MarkGivenDialog
        open={givenDialogOpen}
        onOpenChange={setGivenDialogOpen}
        notes={notes}
        onNotesChange={setNotes}
        onSubmit={handleGivenSubmit}
      />
      <MarkEatenDialog
        open={eatenDialogOpen}
        onOpenChange={setEatenDialogOpen}
        notes={notes}
        onNotesChange={setNotes}
        onSubmit={() => handleEatenSubmit('patient')}
        quantity={selectedQuantity}
      />
    </Card>
  );
}