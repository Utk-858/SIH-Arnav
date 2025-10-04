"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Shield, Users, UserCheck } from 'lucide-react';
import { useAuthContext } from '@/lib/auth-context';
import { PatientChatbot } from './patient-chatbot';
import { DietitianChatbot } from './dietitian-chatbot';
import { HospitalAdminChatbot } from './hospital-admin-chatbot';

// Role-specific chatbot configurations
const ROLE_CONFIG = {
  patient: {
    title: 'Personal Health Assistant',
    description: 'Get personalized answers about your diet plan and health recommendations',
    icon: UserCheck,
    component: PatientChatbot,
  },
  dietitian: {
    title: 'Dietitian Assistant',
    description: 'Access patient data, manage diet plans, and get clinical insights',
    icon: Users,
    component: DietitianChatbot,
  },
  'hospital-admin': {
    title: 'Hospital Admin Assistant',
    description: 'Manage hospital operations, view analytics, and oversee patient care',
    icon: Shield,
    component: HospitalAdminChatbot,
  },
};

export function RoleBasedChatbot() {
  const { userProfile, hasPermission, loading } = useAuthContext();

  // Show loading state
  if (loading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Bot className="animate-pulse" />
            Loading Assistant...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Initializing your personalized assistant...</div>
        </CardContent>
      </Card>
    );
  }

  // Check if user can access chatbot
  if (!hasPermission('canAccessChatbot')) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <Shield />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Alert className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access the chatbot feature. Please contact your administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Get role configuration
  const roleConfig = userProfile ? ROLE_CONFIG[userProfile.role] : null;

  if (!roleConfig) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <Bot />
            Configuration Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertDescription>
              Unable to determine your role configuration. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = roleConfig.icon;
  const ChatbotComponent = roleConfig.component;

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="text-center border-b">
        <CardTitle className="flex items-center justify-center gap-2 font-headline">
          <IconComponent className="h-6 w-6" />
          {roleConfig.title}
        </CardTitle>
        <CardDescription className="text-base">
          {roleConfig.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="h-full">
          <ChatbotComponent />
        </div>
      </CardContent>
    </Card>
  );
}

// Export individual chatbot components for direct use
export { PatientChatbot } from './patient-chatbot';
export { DietitianChatbot } from './dietitian-chatbot';
export { HospitalAdminChatbot } from './hospital-admin-chatbot';