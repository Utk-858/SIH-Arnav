'use server';

/**
 * @fileOverview A comprehensive role-based chatbot system that provides different AI flows
 * based on user roles (patient, dietitian, hospital-admin) with appropriate data access controls.
 *
 * - RoleBasedChatbotInput - Input schema for the role-based chatbot
 * - RoleBasedChatbotOutput - Output schema for the role-based chatbot
 * - roleBasedChatbot - Main function that routes to appropriate AI flow based on user role
 * - Patient AI flows for personal health queries
 * - Dietitian AI flows for clinical management
 * - Hospital Admin AI flows for administrative tasks
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for role-based chatbot
const RoleBasedChatbotInputSchema = z.object({
  userRole: z.enum(['patient', 'dietitian', 'hospital-admin']).describe('The role of the user making the query'),
  userId: z.string().describe('The unique identifier of the user'),
  userName: z.string().describe('The display name of the user'),
  hospitalId: z.string().optional().describe('The hospital ID if applicable'),
  patientId: z.string().optional().describe('The patient ID if the user is a patient'),
  query: z.string().describe('The user\'s question or request'),
  context: z.object({
    hasActiveDietPlan: z.boolean().optional(),
    recentVitals: z.any().optional(),
    patientList: z.any().optional(),
    systemStats: z.any().optional(),
  }).optional().describe('Additional context data for the query'),
});

// Output schema for role-based chatbot
const RoleBasedChatbotOutputSchema = z.object({
  response: z.string().describe('The AI-generated response appropriate for the user\'s role'),
  suggestedActions: z.array(z.string()).optional().describe('Suggested follow-up actions for the user'),
  dataAccessLevel: z.enum(['personal', 'patient-group', 'hospital-wide']).describe('The level of data access used in this response'),
  requiresHumanReview: z.boolean().optional().describe('Whether this response should be reviewed by a human expert'),
});

export type RoleBasedChatbotInput = z.infer<typeof RoleBasedChatbotInputSchema>;
export type RoleBasedChatbotOutput = z.infer<typeof RoleBasedChatbotOutputSchema>;

// Main role-based chatbot function
export async function roleBasedChatbot(input: RoleBasedChatbotInput): Promise<RoleBasedChatbotOutput> {
  return roleBasedChatbotFlow(input);
}

// Patient-specific AI flow
const patientAIFlow = ai.defineFlow(
  {
    name: 'patientAIFlow',
    inputSchema: RoleBasedChatbotInputSchema,
    outputSchema: RoleBasedChatbotOutputSchema,
  },
  async (input) => {
    const patientPrompt = ai.definePrompt({
      name: 'patientPrompt',
      input: { schema: RoleBasedChatbotInputSchema },
      output: { schema: RoleBasedChatbotOutputSchema },
      prompt: `You are a helpful AI assistant for patients in an Ayurvedic healthcare system.

**Patient Information:**
- Name: ${input.userName}
- Patient ID: ${input.patientId || 'Not available'}
- Has Active Diet Plan: ${input.context?.hasActiveDietPlan ? 'Yes' : 'No'}

**Your Role:**
You help patients understand their health data, diet plans, and wellness journey. You should:
- Provide clear, understandable explanations
- Encourage healthy habits and adherence to diet plans
- Direct complex medical questions to healthcare providers
- Be empathetic and supportive
- Never provide medical diagnoses or treatment recommendations

**Patient Query:** ${input.query}

**Guidelines:**
- If they ask about vital signs, explain what the numbers mean in simple terms
- If they ask about diet plans, help them understand the recommendations
- If they ask about symptoms, advise them to consult their healthcare provider
- Always prioritize patient safety and well-being

**Response Style:**
- Use simple, clear language
- Be encouraging and positive
- Provide practical, actionable advice
- Include disclaimers when appropriate`,
    });

    const { output } = await patientPrompt(input);
    return output!;
  }
);

// Dietitian-specific AI flow
const dietitianAIFlow = ai.defineFlow(
  {
    name: 'dietitianAIFlow',
    inputSchema: RoleBasedChatbotInputSchema,
    outputSchema: RoleBasedChatbotOutputSchema,
  },
  async (input) => {
    const dietitianPrompt = ai.definePrompt({
      name: 'dietitianPrompt',
      input: { schema: RoleBasedChatbotInputSchema },
      output: { schema: RoleBasedChatbotOutputSchema },
      prompt: `You are a clinical AI assistant for dietitians in an Ayurvedic healthcare system.

**Dietitian Information:**
- Name: ${input.userName}
- Hospital ID: ${input.hospitalId || 'Not available'}
- Patient Access: ${input.context?.patientList ? 'Has access to patient data' : 'Limited patient access'}

**Your Role:**
You assist dietitians with clinical decision-making, patient management, and professional tasks. You should:
- Provide evidence-based nutritional guidance
- Help analyze patient data and trends
- Suggest appropriate Ayurvedic dietary interventions
- Support clinical workflow and documentation
- Maintain professional standards and patient privacy

**Clinical Query:** ${input.query}

**Available Context:**
${input.context?.patientList ? `- Patient List: ${JSON.stringify(input.context.patientList)}` : '- No specific patient data provided'}
${input.context?.recentVitals ? `- Recent Vitals Data: ${JSON.stringify(input.context.recentVitals)}` : '- No vitals data provided'}

**Guidelines:**
- Focus on nutritional and dietary aspects
- Reference Ayurvedic principles when relevant
- Suggest monitoring and follow-up recommendations
- Flag unusual patterns or concerning trends
- Recommend consultation with physicians for medical concerns

**Response Style:**
- Use professional, clinical language
- Provide structured, actionable recommendations
- Include relevant Ayurvedic context
- Suggest appropriate follow-up actions`,
    });

    const { output } = await dietitianPrompt(input);
    return output!;
  }
);

// Hospital Admin-specific AI flow
const hospitalAdminAIFlow = ai.defineFlow(
  {
    name: 'hospitalAdminAIFlow',
    inputSchema: RoleBasedChatbotInputSchema,
    outputSchema: RoleBasedChatbotOutputSchema,
  },
  async (input) => {
    const adminPrompt = ai.definePrompt({
      name: 'adminPrompt',
      input: { schema: RoleBasedChatbotInputSchema },
      output: { schema: RoleBasedChatbotOutputSchema },
      prompt: `You are an administrative AI assistant for hospital administrators in an Ayurvedic healthcare system.

**Administrator Information:**
- Name: ${input.userName}
- Hospital ID: ${input.hospitalId || 'Not available'}
- Access Level: Hospital-wide administrative access

**Your Role:**
You assist hospital administrators with operational management, strategic planning, and system oversight. You should:
- Provide insights on hospital performance and trends
- Support resource allocation and staffing decisions
- Help identify operational improvements
- Generate reports and analytics summaries
- Maintain compliance and quality standards

**Administrative Query:** ${input.query}

**Available Context:**
${input.context?.systemStats ? `- System Statistics: ${JSON.stringify(input.context.systemStats)}` : '- No system statistics provided'}
- Hospital-wide patient data access
- Staff management capabilities
- System performance monitoring

**Guidelines:**
- Focus on operational efficiency and quality metrics
- Provide data-driven insights and recommendations
- Highlight trends and patterns in hospital data
- Suggest process improvements and best practices
- Flag compliance or quality concerns

**Response Style:**
- Use executive-level summaries and insights
- Provide clear, actionable recommendations
- Include relevant metrics and KPIs
- Suggest strategic considerations`,
    });

    const { output } = await adminPrompt(input);
    return output!;
  }
);

// Main flow that routes to appropriate role-based AI
const roleBasedChatbotFlow = ai.defineFlow(
  {
    name: 'roleBasedChatbotFlow',
    inputSchema: RoleBasedChatbotInputSchema,
    outputSchema: RoleBasedChatbotOutputSchema,
  },
  async (input) => {
    // Route to appropriate AI flow based on user role
    switch (input.userRole) {
      case 'patient':
        return await patientAIFlow(input);
      case 'dietitian':
        return await dietitianAIFlow(input);
      case 'hospital-admin':
        return await hospitalAdminAIFlow(input);
      default:
        // Fallback for unknown roles
        return {
          response: "I'm sorry, I don't recognize your role in the system. Please contact your system administrator for assistance.",
          dataAccessLevel: 'personal' as const,
          suggestedActions: ['Contact system administrator'],
        };
    }
  }
);

// Helper function to create role-based context for queries
export async function createRoleBasedContext(
  userRole: 'patient' | 'dietitian' | 'hospital-admin',
  userId: string,
  hospitalId?: string,
  patientId?: string
): Promise<Partial<RoleBasedChatbotInput['context']>> {
  const context: Partial<RoleBasedChatbotInput['context']> = {};

  try {
    // Import services dynamically to avoid circular imports
    const { patientsService, dietPlansService, vitalsService } = await import('@/lib/firestore');

    switch (userRole) {
      case 'patient':
        if (patientId) {
          // Get patient's diet plan status
          const dietPlans = await dietPlansService.getByPatient(patientId);
          context.hasActiveDietPlan = dietPlans.some(plan => plan.isActive);

          // Get recent vitals
          const vitals = await vitalsService.getByPatient(patientId);
          if (vitals.length > 0) {
            context.recentVitals = vitals[0];
          }
        }
        break;

      case 'dietitian':
        if (hospitalId) {
          // Get patient list for dietitian's hospital
          const patients = await patientsService.getAll();
          context.patientList = patients.filter(p => p.hospitalId === hospitalId);
        }
        break;

      case 'hospital-admin':
        // Hospital admins get system-wide access
        // System stats would be calculated here
        context.systemStats = {
          totalPatients: 0, // Would be calculated from actual data
          totalDietitians: 0,
          activeDietPlans: 0,
        };
        break;
    }
  } catch (error) {
    console.error('Error creating role-based context:', error);
    // Continue without context rather than failing
  }

  return context;
}

// Utility function to check if a query requires human review
export function requiresHumanReview(query: string, userRole: string): boolean {
  const sensitiveKeywords = [
    'emergency', 'severe pain', 'allergic reaction', 'medication',
    'diagnosis', 'treatment', 'surgery', 'hospitalization',
    'critical', 'life-threatening', 'overdose', 'poisoning'
  ];

  const lowerQuery = query.toLowerCase();
  return sensitiveKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Utility function to determine data access level needed for a query
export function determineDataAccessLevel(query: string, userRole: string): 'personal' | 'patient-group' | 'hospital-wide' {
  const lowerQuery = query.toLowerCase();

  // Hospital-wide queries
  if (lowerQuery.includes('all patient') || lowerQuery.includes('hospital statistic') ||
      lowerQuery.includes('overall performance') || lowerQuery.includes('system report')) {
    return 'hospital-wide';
  }

  // Patient group queries (for dietitians)
  if (lowerQuery.includes('my patient') || lowerQuery.includes('patient list') ||
      lowerQuery.includes('patient overview') || userRole === 'dietitian') {
    return 'patient-group';
  }

  // Personal queries (default)
  return 'personal';
}