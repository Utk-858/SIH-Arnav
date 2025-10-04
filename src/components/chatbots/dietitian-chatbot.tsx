"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Send, User, Users, FileText, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { patientsService, dietPlansService, vitalsService } from "@/lib/firestore";
import { useAuthContext, useDataAccess } from "@/lib/auth-context";
import type { Patient, DietPlan, Vitals } from "@/lib/types";

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'patient-list' | 'patient-details' | 'diet-plan' | 'analytics' | 'alert';
  data?: any;
}

interface PatientSummary {
  uid: string;
  name: string;
  lastVisit?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  activePlan?: boolean;
}

export function DietitianChatbot() {
  const { userProfile } = useAuthContext();
  const { hospitalId, dietitianId } = useDataAccess();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm your clinical assistant. I can help you access patient information, review diet plans, check vital signs, and provide clinical insights. What would you like to do?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);

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
      const messageType = determineMessageType(input);
      const response = await getBotResponse(input, messageType);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        timestamp: new Date(),
        type: response.type,
        data: response.data,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm sorry, I encountered an error while processing your request. Please try again or contact your system administrator if the issue persists.",
        timestamp: new Date(),
        type: 'alert',
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Dietitian chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const determineMessageType = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('patient') && (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('all'))) {
      return 'patient-list';
    }

    if (lowerMessage.includes('patient') && lowerMessage.includes('detail')) {
      return 'patient-details';
    }

    if (lowerMessage.includes('diet') || lowerMessage.includes('plan') || lowerMessage.includes('nutrition')) {
      return 'diet-plan';
    }

    if (lowerMessage.includes('vital') || lowerMessage.includes('health') || lowerMessage.includes('monitor')) {
      return 'vitals';
    }

    if (lowerMessage.includes('analytics') || lowerMessage.includes('statistics') || lowerMessage.includes('report')) {
      return 'analytics';
    }

    if (lowerMessage.includes('alert') || lowerMessage.includes('warning') || lowerMessage.includes('critical')) {
      return 'alert';
    }

    return 'text';
  };

  const getBotResponse = async (question: string, type: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    switch (type) {
      case 'patient-list':
        return await getPatientListResponse();
      case 'patient-details':
        return await getPatientDetailsResponse(question);
      case 'diet-plan':
        return await getDietPlanResponse(question);
      case 'analytics':
        return getAnalyticsResponse(question);
      case 'alert':
        return getAlertResponse(question);
      default:
        return { text: await getGeneralResponse(question), type: 'text' };
    }
  };

  const getPatientListResponse = async (): Promise<{ text: string; type: Message['type']; data?: any }> => {
    try {
      // Get patients by dietitian if available, otherwise get all patients
      const patientList = dietitianId
        ? await patientsService.getByDietitian(dietitianId)
        : await patientsService.getAll();

      const summaries: PatientSummary[] = patientList.map((patient: Patient) => ({
        uid: patient.id,
        name: patient.name || 'Unknown Patient',
        lastVisit: patient.lastUpdated?.toLocaleDateString() || 'No recent visits',
        riskLevel: 'low', // Default risk level - would need to be calculated based on vitals/history
        activePlan: true, // Default to true - would need to check actual diet plans
      }));

      setPatients(summaries);

      const patientCount = summaries.length;
      const highRiskCount = summaries.filter(p => p.riskLevel === 'high').length;
      const activePlansCount = summaries.filter(p => p.activePlan).length;

      return {
        text: `I found ${patientCount} patients assigned to you. Here's the summary:

📊 **Overview:**
• Total patients: ${patientCount}
• High-risk patients: ${highRiskCount}
• Patients with active diet plans: ${activePlansCount}

💡 Ask me about a specific patient by name or say "show patient details [name]" for more information.`,
        type: 'patient-list',
        data: { patients: summaries }
      };
    } catch (error) {
      return {
        text: "I couldn't access the patient list right now. Please make sure you have the proper permissions and try again.",
        type: 'alert'
      };
    }
  };

  const getPatientDetailsResponse = async (question: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    // Extract patient name from question
    const nameMatch = question.match(/patient details (.+)/i) || question.match(/show (.+)/i);
    const patientName = nameMatch ? nameMatch[1].trim() : '';

    if (!patientName) {
      return {
        text: "Please specify which patient you'd like details for. You can say 'show patient details [patient name]' or 'patient details [patient name]'.",
        type: 'text'
      };
    }

    try {
      // Find patient by name (this would need a more sophisticated search in real implementation)
      const patientList = await patientsService.getAll();
      const patient = patientList.find((p: Patient) =>
        (p.name || '').toLowerCase().includes(patientName.toLowerCase())
      );

      if (!patient) {
        return {
          text: `I couldn't find a patient named "${patientName}". Please check the spelling or ask for the patient list to see available patients.`,
          type: 'text'
        };
      }

      // Get additional patient data
      const [vitals, dietPlans] = await Promise.all([
        vitalsService.getByPatient(patient.id),
        dietPlansService.getByPatient(patient.id)
      ]);

      const latestVitals = vitals[0];
      const activePlan = dietPlans.find((plan: DietPlan) => plan.isActive);

      return {
        text: `📋 **Patient Details: ${patient.name}**

**Basic Information:**
• Patient ID: ${patient.id}
• Code: ${patient.code}
• Age: ${patient.age}, Gender: ${patient.gender}
• Registration: ${patient.registrationDate?.toLocaleDateString() || 'Unknown'}

**Clinical Status:**
• Dosha Type: ${patient.doshaType || 'Not assessed'}
• Last Updated: ${patient.lastUpdated?.toLocaleDateString() || 'No recent updates'}

${latestVitals ? `**Latest Vitals (${latestVitals.date?.toLocaleDateString()}):**
• Blood Pressure: ${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic} mmHg
• Weight: ${latestVitals.weight} kg
• BMI: ${latestVitals.bmi}
• Temperature: ${latestVitals.temperature || 'Not recorded'}°C` : '**Latest Vitals:** No recent vitals recorded'}

${activePlan ? `**Active Diet Plan:** ${activePlan.title || 'Unnamed plan'}` : '**Diet Plan:** No active diet plan'}

💡 What would you like to know more about this patient?`,
        type: 'patient-details',
        data: { patient, vitals: latestVitals, dietPlan: activePlan }
      };
    } catch (error) {
      return {
        text: "I couldn't access the patient details right now. Please try again or contact your system administrator.",
        type: 'alert'
      };
    }
  };

  const getDietPlanResponse = async (question: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    return {
      text: "I can help you with diet plan management. You can ask me about creating new plans, modifying existing plans, or getting nutritional recommendations. For specific patient diet plans, please specify the patient name.",
      type: 'diet-plan'
    };
  };

  const getAnalyticsResponse = (question: string): { text: string; type: Message['type']; data?: any } => {
    return {
      text: "I can provide you with clinical analytics and insights. Ask me about patient outcomes, nutritional trends, or compliance statistics for your hospital.",
      type: 'analytics'
    };
  };

  const getAlertResponse = (question: string): { text: string; type: Message['type']; data?: any } => {
    return {
      text: "I can help you check for patient alerts and critical notifications. Ask me about patients who need immediate attention or critical vital signs that require follow-up.",
      type: 'alert'
    };
  };

  const getGeneralResponse = async (question: string): Promise<string> => {
    return `I can assist you with:
• Patient management and information
• Diet plan creation and monitoring
• Vital signs review and analysis
• Clinical analytics and reporting
• Patient alerts and notifications

Please ask me about any of these topics, or be more specific about what you'd like to know.`;
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
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          {message.type && message.type !== 'text' && (
            <Badge variant="outline" className="mt-2 text-xs">
              {message.type === 'patient-list' && <Users className="h-3 w-3 mr-1" />}
              {message.type === 'patient-details' && <FileText className="h-3 w-3 mr-1" />}
              {message.type === 'diet-plan' && <FileText className="h-3 w-3 mr-1" />}
              {message.type === 'analytics' && <TrendingUp className="h-3 w-3 mr-1" />}
              {message.type === 'alert' && <AlertTriangle className="h-3 w-3 mr-1" />}
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
                <p className="text-sm">Analyzing clinical data...</p>
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
            placeholder="Ask about patients, diet plans, vitals, or analytics..."
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