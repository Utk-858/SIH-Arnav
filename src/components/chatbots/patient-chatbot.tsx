"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Heart, Activity, Calendar } from "lucide-react";
import { personalDietChatbot } from "@/ai/flows/personal-diet-chatbot";
import { dietPlansService, vitalsService } from "@/lib/firestore";
import { useAuthContext } from "@/lib/auth-context";

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'vitals' | 'appointment' | 'diet-plan';
}

interface PatientData {
  latestVitals?: any;
  activeDietPlan?: any;
  nextAppointment?: string;
}

export function PatientChatbot() {
  const { userProfile } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm your personal health assistant. I can help you with questions about your diet plan, vital signs, appointments, and general health guidance. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>({});

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch patient data for context
      await loadPatientData();

      // Determine message type based on content
      const messageType = determineMessageType(input);

      let response = await getBotResponse(input, messageType);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response,
        timestamp: new Date(),
        type: messageType,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm sorry, I encountered an error while processing your request. Please try again or contact your healthcare provider if the issue persists.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Patient chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientData = async () => {
    if (!userProfile?.patientId) return;

    try {
      // Load latest vitals
      const vitals = await vitalsService.getByPatient(userProfile.patientId);
      if (vitals.length > 0) {
        setPatientData(prev => ({ ...prev, latestVitals: vitals[0] }));
      }

      // Load active diet plan
      const plans = await dietPlansService.getByPatient(userProfile.patientId);
      const activePlan = plans.find(plan => plan.isActive) || plans[0];
      if (activePlan) {
        setPatientData(prev => ({ ...prev, activeDietPlan: activePlan }));
      }
    } catch (error) {
      console.warn('Could not load patient data:', error);
    }
  };

  const determineMessageType = (message: string): Message['type'] => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('vital') || lowerMessage.includes('blood pressure') ||
        lowerMessage.includes('heart rate') || lowerMessage.includes('weight') ||
        lowerMessage.includes('glucose') || lowerMessage.includes('sugar')) {
      return 'vitals';
    }

    if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule') ||
        lowerMessage.includes('visit') || lowerMessage.includes('doctor')) {
      return 'appointment';
    }

    if (lowerMessage.includes('diet') || lowerMessage.includes('food') ||
        lowerMessage.includes('meal') || lowerMessage.includes('nutrition') ||
        lowerMessage.includes('eat') || lowerMessage.includes('recipe')) {
      return 'diet-plan';
    }

    return 'text';
  };

  const getBotResponse = async (question: string, type: Message['type']): Promise<string> => {
    switch (type) {
      case 'vitals':
        return await getVitalsResponse(question);
      case 'appointment':
        return getAppointmentResponse(question);
      case 'diet-plan':
        return await getDietPlanResponse(question);
      default:
        return await getGeneralResponse(question);
    }
  };

  const getVitalsResponse = async (question: string): Promise<string> => {
    if (!patientData.latestVitals) {
      return "I don't have access to your latest vital signs right now. Please make sure your healthcare provider has recorded your recent measurements, or contact them for the most up-to-date information.";
    }

    const vitals = patientData.latestVitals;
    const vitalsInfo = `Based on your latest recorded vitals (from ${new Date(vitals.recordedAt?.toDate()).toLocaleDateString()}):
    - Blood Pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg
    - Heart Rate: ${vitals.heartRate} bpm
    - Weight: ${vitals.weight} kg
    - Temperature: ${vitals.temperature}°C
    ${vitals.bloodGlucose ? `- Blood Glucose: ${vitals.bloodGlucose} mg/dL` : ''}

    What specific question do you have about these readings?`;

    if (question.toLowerCase().includes('latest') || question.toLowerCase().includes('recent')) {
      return vitalsInfo;
    }

    // Use AI for more complex vitals questions
    try {
      const response = await personalDietChatbot({
        patientName: userProfile?.displayName || 'Patient',
        carePlanDetails: `Patient vitals context: ${vitalsInfo}`,
        question: question,
      });
      return response.answer;
    } catch (error) {
      return vitalsInfo;
    }
  };

  const getAppointmentResponse = (question: string): string => {
    return "For appointment scheduling and information, I recommend contacting your healthcare provider directly or using our appointment booking system. They can provide you with the most accurate and up-to-date scheduling information.";
  };

  const getDietPlanResponse = async (question: string): Promise<string> => {
    if (!patientData.activeDietPlan) {
      return "I don't see an active diet plan for you currently. Please consult with your dietitian or healthcare provider to get a personalized diet plan set up.";
    }

    const plan = patientData.activeDietPlan;

    // Format diet plan in a structured, readable way for the AI
    const formatDietPlan = (dietPlan: any): string => {
      let formatted = `Diet Plan: ${dietPlan.title}\n`;
      formatted += `Description: ${dietPlan.description}\n\n`;

      if (dietPlan.dietDays && Array.isArray(dietPlan.dietDays)) {
        formatted += "Weekly Meal Schedule:\n";
        formatted += "=====================\n\n";

        dietPlan.dietDays.forEach((day: any) => {
          formatted += `${day.day}:\n`;
          formatted += "-".repeat(day.day.length + 1) + "\n";

          if (day.meals && Array.isArray(day.meals)) {
            day.meals.forEach((meal: any) => {
              formatted += `${meal.name} (${meal.time}):\n`;
              if (meal.items && Array.isArray(meal.items)) {
                formatted += `  Items: ${meal.items.join(', ')}\n`;
              }
              if (meal.notes) {
                formatted += `  Notes: ${meal.notes}\n`;
              }
              formatted += "\n";
            });
          }
        });
      }

      return formatted;
    };

    const planInfo = formatDietPlan(plan);

    try {
      const response = await personalDietChatbot({
        patientName: userProfile?.displayName || 'Patient',
        carePlanDetails: planInfo,
        question: question,
      });
      return response.answer;
    } catch (error) {
      return `I can help you with questions about your diet plan. Your current plan focuses on: ${plan.description || 'personalized nutrition'}. Please ask me specific questions about meals, restrictions, or food choices.`;
    }
  };

  const getGeneralResponse = async (question: string): Promise<string> => {
    const context = `
      Patient Context:
      - Name: ${userProfile?.displayName || 'Patient'}
      - Has active diet plan: ${!!patientData.activeDietPlan}
      - Latest vitals available: ${!!patientData.latestVitals}
    `;

    try {
      const response = await personalDietChatbot({
        patientName: userProfile?.displayName || 'Patient',
        carePlanDetails: context,
        question: question,
      });
      return response.answer;
    } catch (error) {
      return "I'm here to help you with questions about your health, diet, and wellness journey. Please ask me about your diet plan, vital signs, or general health guidance.";
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';

    return (
      <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot size={16} />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
          <p className="text-sm">{message.text}</p>
          {message.type && message.type !== 'text' && (
            <Badge variant="outline" className="mt-2 text-xs">
              {message.type === 'vitals' && <Activity className="h-3 w-3 mr-1" />}
              {message.type === 'appointment' && <Calendar className="h-3 w-3 mr-1" />}
              {message.type === 'diet-plan' && <Heart className="h-3 w-3 mr-1" />}
              {message.type.replace('-', ' ')}
            </Badge>
          )}
        </div>

        {isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User size={16} />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-grow px-6 py-4">
        <div className="space-y-4">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-4 py-2 bg-secondary animate-pulse">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me about your diet, vitals, or health..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button onClick={handleSend} disabled={isLoading} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}