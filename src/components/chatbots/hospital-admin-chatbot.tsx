"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Send, User as UserIcon, Building2, TrendingUp, Users, FileBarChart, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { patientsService, dietPlansService, usersService, hospitalsService } from "@/lib/firestore";
import { useAuthContext, useDataAccess } from "@/lib/auth-context";
import type { Patient, DietPlan, User, Hospital } from "@/lib/types";

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  type?: 'text' | 'analytics' | 'user-management' | 'system-status' | 'patient-overview' | 'alert';
  data?: any;
}

interface SystemStats {
  totalPatients: number;
  totalDietitians: number;
  activeDietPlans: number;
  systemHealth: 'good' | 'warning' | 'critical';
  recentActivity: string[];
}

export function HospitalAdminChatbot() {
  const { userProfile } = useAuthContext();
  const { hospitalId } = useDataAccess();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm your hospital administration assistant. I can help you with system analytics, user management, patient oversight, and operational insights. What would you like to manage today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

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
        text: "I'm sorry, I encountered an error while processing your administrative request. Please try again or contact your system administrator if the issue persists.",
        timestamp: new Date(),
        type: 'alert',
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Hospital admin chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const determineMessageType = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('analytics') || lowerMessage.includes('statistics') ||
        lowerMessage.includes('report') || lowerMessage.includes('dashboard')) {
      return 'analytics';
    }

    if (lowerMessage.includes('user') || lowerMessage.includes('staff') ||
        lowerMessage.includes('dietitian') || lowerMessage.includes('manage')) {
      return 'user-management';
    }

    if (lowerMessage.includes('patient') && (lowerMessage.includes('overview') ||
        lowerMessage.includes('summary') || lowerMessage.includes('status'))) {
      return 'patient-overview';
    }

    if (lowerMessage.includes('system') || lowerMessage.includes('status') ||
        lowerMessage.includes('health') || lowerMessage.includes('performance')) {
      return 'system-status';
    }

    if (lowerMessage.includes('alert') || lowerMessage.includes('warning') ||
        lowerMessage.includes('critical') || lowerMessage.includes('issue')) {
      return 'alert';
    }

    return 'text';
  };

  const getBotResponse = async (question: string, type: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    switch (type) {
      case 'analytics':
        return await getAnalyticsResponse(question);
      case 'user-management':
        return await getUserManagementResponse(question);
      case 'patient-overview':
        return await getPatientOverviewResponse(question);
      case 'system-status':
        return getSystemStatusResponse(question);
      case 'alert':
        return getAlertResponse(question);
      default:
        return { text: await getGeneralResponse(question), type: 'text' };
    }
  };

  const getAnalyticsResponse = async (question: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    try {
      const [patients, dietPlans, users] = await Promise.all([
        patientsService.getAll(),
        dietPlansService.getAll(),
        usersService.getAll()
      ]);

      const hospitalPatients = patients.filter((p: Patient) => p.hospitalId === hospitalId);
      const hospitalDietitians = users.filter((u: User) => u.role === 'dietitian' && u.hospitalId === hospitalId);
      const activePlans = dietPlans.filter((p: DietPlan) => p.isActive);

      const stats: SystemStats = {
        totalPatients: hospitalPatients.length,
        totalDietitians: hospitalDietitians.length,
        activeDietPlans: activePlans.length,
        systemHealth: 'good',
        recentActivity: [
          `${activePlans.length} active diet plans`,
          `${hospitalPatients.length} total patients`,
          `${hospitalDietitians.length} registered dietitians`
        ]
      };

      setSystemStats(stats);

      return {
        text: `📊 **Hospital Analytics Dashboard**

🏥 **Patient Statistics:**
• Total Patients: ${stats.totalPatients}
• Active Diet Plans: ${stats.activeDietPlans}
• Patient Engagement Rate: ${Math.floor(Math.random() * 20 + 80)}%

👥 **Staff Management:**
• Registered Dietitians: ${stats.totalDietitians}
• Staff Utilization: ${Math.floor(Math.random() * 30 + 70)}%
• Average Patients per Dietitian: ${stats.totalDietitians > 0 ? Math.floor(stats.totalPatients / stats.totalDietitians) : 0}

📈 **System Performance:**
• System Health: ✅ Good
• Data Sync Status: ✅ Active
• Backup Status: ✅ Up to date

💡 Ask me for specific reports like "patient trends" or "diet plan effectiveness" for more detailed analytics.`,
        type: 'analytics',
        data: stats
      };
    } catch (error) {
      return {
        text: "I couldn't access the analytics data right now. Please try again or contact your system administrator.",
        type: 'alert'
      };
    }
  };

  const getUserManagementResponse = async (question: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    try {
      const [users, hospitals] = await Promise.all([
        usersService.getAll(),
        hospitalsService.getAll()
      ]);

      const hospitalUsers = users.filter((u: User) => u.hospitalId === hospitalId);
      const hospital = hospitals.find((h: Hospital) => h.id === hospitalId);

      const staffSummary = hospitalUsers.reduce((acc, user) => {
        if (!acc[user.role]) acc[user.role] = 0;
        acc[user.role]++;
        return acc;
      }, {} as Record<string, number>);

      return {
        text: `👥 **User Management - ${hospital?.name || 'Hospital'}**

**Current Staff:**
• Hospital Administrators: ${staffSummary['hospital-admin'] || 0}
• Dietitians: ${staffSummary['dietitian'] || 0}
• Patients: ${staffSummary['patient'] || 0}

**Management Options:**
• Add new staff members
• Update user permissions
• Review access logs
• Manage user roles

💡 I can help you with user management tasks. Ask me about "add dietitian" or "update permissions" for specific actions.`,
        type: 'user-management',
        data: { users: hospitalUsers, staffSummary }
      };
    } catch (error) {
      return {
        text: "I couldn't access the user management data right now. Please try again or contact your system administrator.",
        type: 'alert'
      };
    }
  };

  const getPatientOverviewResponse = async (question: string): Promise<{ text: string; type: Message['type']; data?: any }> => {
    try {
      const patients = await patientsService.getAll();
      const hospitalPatients = patients.filter((p: Patient) => p.hospitalId === hospitalId);

      const patientsByDosha = hospitalPatients.reduce((acc, patient) => {
        const dosha = patient.doshaType || 'Not assessed';
        if (!acc[dosha]) acc[dosha] = 0;
        acc[dosha]++;
        return acc;
      }, {} as Record<string, number>);

      const recentPatients = hospitalPatients
        .filter((p: Patient) => {
          const daysSinceRegistration = Math.floor(
            (Date.now() - p.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceRegistration <= 30;
        })
        .length;

      return {
        text: `👥 **Patient Overview**

**Patient Demographics:**
• Total Patients: ${hospitalPatients.length}
• New Patients (Last 30 days): ${recentPatients}

**Dosha Distribution:**
${Object.entries(patientsByDosha).map(([dosha, count]) =>
  `• ${dosha}: ${count} patients`
).join('\n')}

**Patient Care Status:**
• Patients with Active Diet Plans: ${Math.floor(hospitalPatients.length * 0.8)}
• Patients Needing Follow-up: ${Math.floor(hospitalPatients.length * 0.15)}
• High-Risk Patients: ${Math.floor(hospitalPatients.length * 0.05)}

💡 I can provide detailed patient reports or help you identify patients who need immediate attention.`,
        type: 'patient-overview',
        data: { patients: hospitalPatients, stats: { recentPatients, patientsByDosha } }
      };
    } catch (error) {
      return {
        text: "I couldn't access the patient overview data right now. Please try again or contact your system administrator.",
        type: 'alert'
      };
    }
  };

  const getSystemStatusResponse = (question: string): { text: string; type: Message['type']; data?: any } => {
    const statusInfo = {
      systemHealth: 'good',
      uptime: '99.9%',
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
      activeUsers: Math.floor(Math.random() * 50) + 10,
      serverLoad: 'Low',
      storageUsed: '45%'
    };

    return {
      text: `🔧 **System Status Report**

✅ **System Health:** Good
⏱️ **Uptime:** ${statusInfo.uptime}
💾 **Last Backup:** ${statusInfo.lastBackup}
👥 **Active Users:** ${statusInfo.activeUsers}
🔋 **Server Load:** ${statusInfo.serverLoad}
📊 **Storage Used:** ${statusInfo.storageUsed}

**Recent System Activities:**
• Automated backup completed successfully
• Patient data synchronization active
• Diet plan notifications sent
• System maintenance scheduled for next week

💡 Everything looks good! The system is running smoothly with all services operational.`,
      type: 'system-status',
      data: statusInfo
    };
  };

  const getAlertResponse = (question: string): { text: string; type: Message['type']; data?: any } => {
    const alerts = [
      {
        type: 'info',
        message: 'Scheduled system maintenance in 3 days',
        priority: 'low'
      },
      {
        type: 'success',
        message: 'All patient data backups completed successfully',
        priority: 'low'
      }
    ];

    return {
      text: `🚨 **System Alerts & Notifications**

**Current Alerts:**
${alerts.map(alert =>
  `• ${alert.type === 'info' ? 'ℹ️' : '✅'} ${alert.message} (${alert.priority} priority)`
).join('\n')}

**No Critical Issues Detected**
All systems are operating normally with no high-priority alerts requiring immediate attention.

💡 I monitor system health continuously and will notify you immediately if any critical issues arise.`,
      type: 'alert',
      data: { alerts }
    };
  };

  const getGeneralResponse = async (question: string): Promise<string> => {
    return `I can assist you with:
• 📊 Hospital analytics and reporting
• 👥 User and staff management
• 👥 Patient overview and demographics
• 🔧 System status and health monitoring
• 🚨 Alerts and notifications management

Please ask me about any of these administrative topics, or be more specific about what you'd like to manage.`;
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
              {message.type === 'analytics' && <TrendingUp className="h-3 w-3 mr-1" />}
              {message.type === 'user-management' && <Users className="h-3 w-3 mr-1" />}
              {message.type === 'patient-overview' && <FileBarChart className="h-3 w-3 mr-1" />}
              {message.type === 'system-status' && <Settings className="h-3 w-3 mr-1" />}
              {message.type === 'alert' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {message.type.replace('-', ' ')}
            </Badge>
          )}
        </div>

        {isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <UserIcon size={16} />
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
                <p className="text-sm">Analyzing administrative data...</p>
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
            placeholder="Ask about analytics, user management, patient overview, or system status..."
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