"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { dietPlansService } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import { useRealtimeDietPlans } from "@/hooks/useRealtime";
import { exportDietChartToPDF } from "@/lib/pdf-utils";
import { Utensils, Printer, Sun, Coffee, Sunset, Soup, Info, Leaf, AlertCircle, RefreshCw } from 'lucide-react';
import { AlternativeSuggestions } from "@/components/ui/alternative-suggestions";
import type { Meal, DietPlan } from "@/lib/types";

const getMealIcon = (mealName: string) => {
  if (mealName.toLowerCase().includes('breakfast')) return <Coffee className="h-5 w-5 text-accent" />;
  if (mealName.toLowerCase().includes('lunch')) return <Sun className="h-5 w-5 text-accent" />;
  if (mealName.toLowerCase().includes('dinner')) return <Sunset className="h-5 w-5 text-accent" />;
  return <Soup className="h-5 w-5 text-accent" />;
};

// Mock Ayurvedic data for demonstration
const getAyurvedicInfo = (foodName: string) => {
  const ayurvedicData: Record<string, { rasa: string; virya: string; guna: string; vipaka: string; benefits: string }> = {
    'Poha': {
      rasa: 'Madhura (Sweet), Kashaya (Astringent)',
      virya: 'Sheeta (Cooling)',
      guna: 'Laghu (Light), Snigdha (Oily)',
      vipaka: 'Madhura (Sweet)',
      benefits: 'Balances Vata and Pitta doshas. Easy to digest, provides sustained energy.'
    },
    'Moong Dal': {
      rasa: 'Madhura (Sweet), Kashaya (Astringent)',
      virya: 'Sheeta (Cooling)',
      guna: 'Laghu (Light), Ruksha (Dry)',
      vipaka: 'Katu (Pungent)',
      benefits: 'Excellent for all doshas. High in protein, easy to digest, supports detoxification.'
    },
    'Khichdi': {
      rasa: 'Madhura (Sweet)',
      virya: 'Sheeta (Cooling)',
      guna: 'Laghu (Light), Snigdha (Oily)',
      vipaka: 'Madhura (Sweet)',
      benefits: 'Tridoshic (balances all doshas). Nourishing, easy to digest, ideal for recovery.'
    },
    'Mixed Vegetables': {
      rasa: 'Various (depends on vegetables)',
      virya: 'Sheeta (Cooling)',
      guna: 'Laghu (Light)',
      vipaka: 'Various',
      benefits: 'Rich in fiber and micronutrients. Supports digestion and provides balanced nutrition.'
    },
    'Roti': {
      rasa: 'Madhura (Sweet)',
      virya: 'Sheeta (Cooling)',
      guna: 'Guru (Heavy)',
      vipaka: 'Madhura (Sweet)',
      benefits: 'Provides sustained energy. Good for Vata dosha but should be eaten warm.'
    },
    'Tea': {
      rasa: 'Kashaya (Astringent), Tikta (Bitter)',
      virya: 'Ushna (Heating)',
      guna: 'Laghu (Light), Ruksha (Dry)',
      vipaka: 'Katu (Pungent)',
      benefits: 'Stimulates digestion, reduces Kapha. Should be consumed warm, not excessive.'
    }
  };

  return ayurvedicData[foodName] || {
    rasa: 'Madhura (Sweet)',
    virya: 'Sheeta (Cooling)',
    guna: 'Laghu (Light)',
    vipaka: 'Madhura (Sweet)',
    benefits: 'Provides nourishment and supports overall health.'
  };
};

export function DietChart() {
  const { userProfile } = useAuth();

  // Use real-time diet plans hook
  const { plans: dietPlans, loading: isLoading, error } = useRealtimeDietPlans(userProfile?.patientId);

  // Get the most recent active plan
  const dietPlan = dietPlans.find(plan => plan.isActive) || dietPlans[0] || null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6" />
            <CardTitle className="font-headline">Your Diet Plan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="font-headline">Diet Plan Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message || 'Failed to load diet plan'}</p>
        </CardContent>
      </Card>
    );
  }

  if (!dietPlan) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6" />
            <CardTitle className="font-headline">No Diet Plan Available</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have an active diet plan yet. Please consult with your dietitian or hospital.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4 pb-4 xs:pb-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Utensils className="h-5 w-5 xs:h-6 xs:w-6 flex-shrink-0" />
            <CardTitle className="font-headline text-lg xs:text-xl truncate">{dietPlan.title}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full xs:w-auto"
            onClick={async () => {
              try {
                const response = await fetch(`/api/diet-plans/${dietPlan.id}/pdf`);
                if (!response.ok) {
                  throw new Error('Failed to generate PDF');
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${userProfile?.displayName || 'Patient'}_diet_chart.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Error downloading PDF:', error);
                // Fallback to client-side PDF generation
                exportDietChartToPDF(dietPlan, userProfile?.displayName || 'Patient');
              }
            }}
          >
            <Printer className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Download PDF</span>
            <span className="xs:hidden">PDF</span>
          </Button>
        </CardHeader>
        <CardContent>
          {dietPlan.description && (
            <p className="text-sm xs:text-base text-muted-foreground mb-4 leading-relaxed">{dietPlan.description}</p>
          )}

          <Accordion type="single" collapsible defaultValue="item-0" className="space-y-2 xs:space-y-3">
            {dietPlan.dietDays?.map((day, index) => (
              <AccordionItem value={`item-${index}`} key={day.day || index}>
                <AccordionTrigger className="text-lg font-semibold font-headline">
                  {day.day || `Day ${index + 1}`}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px] xs:min-w-[150px]">Meal</TableHead>
                          <TableHead className="min-w-[80px]">Time</TableHead>
                          <TableHead className="min-w-[200px]">Items</TableHead>
                          <TableHead className="min-w-[100px] hidden tablet:table-cell">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {day.meals?.map((meal: Meal, mealIndex: number) => (
                          <TableRow key={meal.name || mealIndex}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getMealIcon(meal.name || meal.time || '')}
                                <span className="truncate">{meal.name || meal.time || 'Meal'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm xs:text-base">{meal.time}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {meal.items?.map((item, itemIndex) => {
                                  const ayurvedicInfo = getAyurvedicInfo(item);
                                  return (
                                    <div key={itemIndex} className="flex items-center gap-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="secondary" className="cursor-help flex items-center gap-1 text-xs">
                                            <Leaf className="h-3 w-3" />
                                            <span className="truncate max-w-[80px] xs:max-w-none">{item}</span>
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="space-y-2">
                                            <p className="font-medium text-sm">{item}</p>
                                            <div className="text-xs space-y-1">
                                              <p><strong>Rasa:</strong> {ayurvedicInfo.rasa}</p>
                                              <p><strong>Virya:</strong> {ayurvedicInfo.virya}</p>
                                              <p><strong>Guna:</strong> {ayurvedicInfo.guna}</p>
                                              <p><strong>Vipaka:</strong> {ayurvedicInfo.vipaka}</p>
                                              <p className="mt-2 text-muted-foreground">{ayurvedicInfo.benefits}</p>
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                      <AlternativeSuggestions
                                        foodName={item}
                                        reason="Patient preference or availability"
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 hover:bg-secondary"
                                            title={`Find alternatives for ${item}`}
                                          >
                                            <RefreshCw className="h-3 w-3" />
                                          </Button>
                                        }
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden tablet:table-cell max-w-[100px]">
                              <span className="truncate block">{meal.notes}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile notes section */}
                  <div className="mt-4 tablet:hidden space-y-2">
                    {day.meals?.map((meal: Meal, mealIndex: number) => (
                      meal.notes && (
                        <div key={mealIndex} className="text-sm text-muted-foreground p-2 bg-secondary/50 rounded">
                          <span className="font-medium">{meal.name || meal.time || 'Meal'}:</span> {meal.notes}
                        </div>
                      )
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )) || (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No diet days configured in this plan.</p>
              </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
