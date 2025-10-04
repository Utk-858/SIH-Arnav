"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DietChart } from "./diet-chart";
import { PersonalChatbot } from "./personal-chatbot";
import { PatientProgress } from "./patient-progress";
import { PatientFeedbackForm } from "./patient-feedback-form";
import { PatientSelection } from "./patient-selection";
import { BookOpen, MessageCircle, BarChart3, UtensilsCrossed, Hospital, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { patientsService } from "@/lib/firestore";
import { useRealtimePatients } from "@/hooks/useRealtime";
import { useAuthContext } from "@/lib/auth-context";
import type { Patient } from "@/lib/types";

export function PatientView() {
  const [selectedLearningTopic, setSelectedLearningTopic] = useState<string | null>(null);
  const { selectedPatient, selectPatient } = useAuthContext();

  // Use real-time patients hook - in production, this would filter by current user
  const { patients, loading: isLoading } = useRealtimePatients();

  // Use selected patient from auth context, or null if none selected
  const patient = selectedPatient;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your health dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show patient selection if no patient is selected
  if (!patient) {
    return (
      <PatientSelection
        onPatientSelect={selectPatient}
        selectedPatientId={selectedPatient?.id || null}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Status Overview */}
      <Card>
        <CardHeader className="pb-4 xs:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg xs:text-xl">
            <Hospital className="h-4 w-4 xs:h-5 xs:w-5" />
            Health Dashboard
          </CardTitle>
          <CardDescription className="text-sm xs:text-base">
            Welcome back{patient?.name ? `, ${patient.name}` : ''}! Here's your Ayurvedic health journey overview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-3 xs:gap-4">
            <div className="flex items-center gap-3 p-3 xs:p-4 border rounded-lg">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Hospital className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm xs:text-base">Hospital Status</p>
                <span className="text-xs xs:text-sm text-muted-foreground">
                  {patient ? (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Linked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Not Linked
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 xs:p-4 border rounded-lg">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="h-4 w-4 xs:h-5 xs:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm xs:text-base">Diet Plan</p>
                <span className="text-xs xs:text-sm text-muted-foreground">
                  {patient ? (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 xs:p-4 border rounded-lg tablet:col-span-2 desktop:col-span-1">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-4 w-4 xs:h-5 xs:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm xs:text-base">Progress</p>
                <span className="text-xs xs:text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    Track Now
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="diet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-5 h-auto">
          <TabsTrigger value="diet" className="flex items-center gap-1 xs:gap-2 p-2 xs:p-3">
            <UtensilsCrossed className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline text-xs xs:text-sm">Diet Plan</span>
            <span className="xs:hidden text-xs">Diet</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-1 xs:gap-2 p-2 xs:p-3">
            <BarChart3 className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline text-xs xs:text-sm">Progress</span>
            <span className="xs:hidden text-xs">Track</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-1 xs:gap-2 p-2 xs:p-3 tablet:col-span-1 desktop:col-span-1">
            <MessageSquare className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline text-xs xs:text-sm">Feedback</span>
            <span className="xs:hidden text-xs">Note</span>
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-1 xs:gap-2 p-2 xs:p-3 tablet:col-span-1 desktop:col-span-1">
            <MessageCircle className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline text-xs xs:text-sm">Chatbot</span>
            <span className="xs:hidden text-xs">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="learn" className="flex items-center gap-1 xs:gap-2 p-2 xs:p-3 tablet:col-span-2 desktop:col-span-1">
            <BookOpen className="h-3 w-3 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline text-xs xs:text-sm">Learn</span>
            <span className="xs:hidden text-xs">Edu</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diet" className="space-y-4">
          <DietChart />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <PatientProgress userType="patient" patientId={patient?.id} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <PatientFeedbackForm patientId={patient?.id} />
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-4">
          <PersonalChatbot />
        </TabsContent>

        <TabsContent value="learn" className="space-y-4">
          <Card>
            <CardHeader className="pb-4 xs:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg xs:text-xl">
                <BookOpen className="h-4 w-4 xs:h-5 xs:w-5" />
                Ayurvedic Learning Hub
              </CardTitle>
              <CardDescription className="text-sm xs:text-base">
                Deepen your understanding of Ayurveda and holistic health practices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3 xs:gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">Understanding Doshas</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Learn about Vata, Pitta, and Kapha - the three fundamental energies in Ayurveda.
                      </p>
                      <Button variant="outline" size="sm">Start Learning</Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Understanding Doshas</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-2">The Three Doshas</h4>
                        <p className="text-muted-foreground mb-4">
                          In Ayurveda, doshas are the three fundamental energies that govern all biological and psychological functions in the body and mind.
                        </p>
                      </div>
                      <div className="grid gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800">Vata Dosha</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Governs movement, creativity, and flexibility. Associated with air and space elements.
                            When balanced: Creative, energetic, quick-thinking. When imbalanced: Anxiety, restlessness, digestive issues.
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <h5 className="font-semibold text-red-800">Pitta Dosha</h5>
                          <p className="text-sm text-red-700 mt-1">
                            Governs transformation, metabolism, and digestion. Associated with fire and water elements.
                            When balanced: Intelligent, focused, strong digestion. When imbalanced: Irritability, inflammation, excessive heat.
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h5 className="font-semibold text-green-800">Kapha Dosha</h5>
                          <p className="text-sm text-green-700 mt-1">
                            Governs structure, stability, and lubrication. Associated with earth and water elements.
                            When balanced: Calm, loyal, strong immunity. When imbalanced: Weight gain, lethargy, congestion.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">Seasonal Eating</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Discover how to eat according to seasons for optimal health and digestion.
                      </p>
                      <Button variant="outline" size="sm">Explore</Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Seasonal Eating in Ayurveda</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Ritucharya - Seasonal Regimen</h4>
                        <p className="text-muted-foreground mb-4">
                          Ayurveda teaches us to live in harmony with nature's cycles. Each season affects our doshas differently, and our diet should adapt accordingly.
                        </p>
                      </div>
                      <div className="grid gap-4">
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h5 className="font-semibold text-orange-800">Spring (March-May)</h5>
                          <p className="text-sm text-orange-700 mt-1">
                            Kapha season - Focus on light, warming foods. Include bitter and astringent tastes like leafy greens, berries, and light grains.
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <h5 className="font-semibold text-red-800">Summer (June-August)</h5>
                          <p className="text-sm text-red-700 mt-1">
                            Pitta season - Emphasize cooling foods. Sweet, bitter, and astringent tastes like sweet fruits, coconut, cucumber, and mint.
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <h5 className="font-semibold text-yellow-800">Fall (September-November)</h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            Vata season begins - Include grounding foods. Sweet, sour, and salty tastes like root vegetables, nuts, and warming spices.
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h5 className="font-semibold text-blue-800">Winter (December-February)</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            Peak Vata season - Nourish with hearty, warming foods. Sweet, sour, and salty tastes like soups, stews, and healthy fats.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">Ayurvedic Nutrition</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Understand the six tastes (Rasa) and their impact on your well-being.
                      </p>
                      <Button variant="outline" size="sm">Learn More</Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ayurvedic Nutrition & The Six Tastes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-2">The Six Tastes (Shad Rasa)</h4>
                        <p className="text-muted-foreground mb-4">
                          Each taste has specific effects on our body and mind. A balanced meal should include all six tastes in appropriate proportions.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                          <div>
                            <h6 className="font-semibold text-green-800">Sweet (Madhura)</h6>
                            <p className="text-sm text-green-700">Nourishing, grounding. Found in grains, dairy, sweet fruits.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
                          <div>
                            <h6 className="font-semibold text-yellow-800">Sour (Amla)</h6>
                            <p className="text-sm text-yellow-700">Stimulates digestion. Found in citrus, yogurt, fermented foods.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                          <div>
                            <h6 className="font-semibold text-gray-800">Salty (Lavana)</h6>
                            <p className="text-sm text-gray-700">Enhances taste, maintains electrolyte balance. Found in sea salt, seaweed.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                          <div>
                            <h6 className="font-semibold text-orange-800">Pungent (Katu)</h6>
                            <p className="text-sm text-orange-700">Stimulates circulation. Found in ginger, garlic, chili peppers.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                          <div>
                            <h6 className="font-semibold text-purple-800">Bitter (Tikta)</h6>
                            <p className="text-sm text-purple-700">Detoxifying, lightening. Found in leafy greens, turmeric, coffee.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                          <div className="w-4 h-4 bg-pink-600 rounded-full"></div>
                          <div>
                            <h6 className="font-semibold text-pink-800">Astringent (Kashaya)</h6>
                            <p className="text-sm text-pink-700">Drying, toning. Found in beans, pomegranate, green tea.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">Daily Routines</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Incorporate Ayurvedic daily practices (Dinacharya) for better health.
                      </p>
                      <Button variant="outline" size="sm">View Guide</Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ayurvedic Daily Routines (Dinacharya)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Morning Routine</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">1</div>
                            <div>
                              <h6 className="font-semibold">Early Rising (Brahma Muhurta)</h6>
                              <p className="text-sm text-muted-foreground">Wake up before sunrise (around 4-6 AM) when the mind is fresh and peaceful.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">2</div>
                            <div>
                              <h6 className="font-semibold">Oral Hygiene</h6>
                              <p className="text-sm text-muted-foreground">Clean your tongue, brush teeth, and use oil pulling for oral health.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">3</div>
                            <div>
                              <h6 className="font-semibold">Eye Care</h6>
                              <p className="text-sm text-muted-foreground">Wash eyes with cool water and practice gentle eye exercises.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Throughout the Day</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold">4</div>
                            <div>
                              <h6 className="font-semibold">Regular Meals</h6>
                              <p className="text-sm text-muted-foreground">Eat at regular times, with lunch being the largest meal when digestion is strongest.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold">5</div>
                            <div>
                              <h6 className="font-semibold">Physical Activity</h6>
                              <p className="text-sm text-muted-foreground">Practice yoga, walking, or other gentle exercises appropriate for your dosha.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Evening Routine</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-semibold">6</div>
                            <div>
                              <h6 className="font-semibold">Early Dinner</h6>
                              <p className="text-sm text-muted-foreground">Eat a light dinner before 7 PM to allow proper digestion before sleep.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-semibold">7</div>
                            <div>
                              <h6 className="font-semibold">Wind Down</h6>
                              <p className="text-sm text-muted-foreground">Practice relaxation, meditation, or gentle activities before bedtime.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
