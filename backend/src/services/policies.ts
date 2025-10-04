import { FirestoreService } from './firestore';
import { db } from './firebase';
import { PolicyDocument, PolicySearchRequest, PolicyComplianceCheck, DietPlanCompliance, Patient } from '../types';

export const policiesService = {
  // Get all policy documents
  getAll: () => FirestoreService.getAll<PolicyDocument>('policies'),

  // Get policy by ID
  getById: (id: string) => FirestoreService.getById<PolicyDocument>('policies', id),

  // Get policies by category
  getByCategory: (category: string) =>
    FirestoreService.getAll<PolicyDocument>('policies', (query) =>
      query.where('category', '==', category).where('isActive', '==', true)
    ),

  // Get policies by source
  getBySource: (source: string) =>
    FirestoreService.getAll<PolicyDocument>('policies', (query) =>
      query.where('source', '==', source).where('isActive', '==', true)
    ),

  // Search policies with advanced filtering
  search: async (searchRequest: PolicySearchRequest): Promise<PolicyDocument[]> => {
    let query = db.collection('policies').where('isActive', '==', true);

    // Apply filters
    if (searchRequest.category) {
      query = query.where('category', '==', searchRequest.category);
    }

    if (searchRequest.source) {
      query = query.where('source', '==', searchRequest.source);
    }

    if (searchRequest.doshaType) {
      query = query.where(`doshaRelevance.${searchRequest.doshaType}`, '==', true);
    }

    // Get results
    const snapshot = await query.limit(searchRequest.limit || 50).get();
    let policies: PolicyDocument[] = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as PolicyDocument));

    // Apply text search and additional filters in memory
    if (searchRequest.query) {
      const queryLower = searchRequest.query.toLowerCase();
      policies = policies.filter((policy: PolicyDocument) =>
        policy.title.toLowerCase().includes(queryLower) ||
        policy.summary.toLowerCase().includes(queryLower) ||
        policy.fullContent.toLowerCase().includes(queryLower) ||
        policy.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))
      );
    }

    if (searchRequest.tags && searchRequest.tags.length > 0) {
      policies = policies.filter((policy: PolicyDocument) =>
        searchRequest.tags!.some((tag: string) => policy.tags.includes(tag))
      );
    }

    if (searchRequest.conditions && searchRequest.conditions.length > 0) {
      policies = policies.filter((policy: PolicyDocument) =>
        policy.applicableConditions &&
        searchRequest.conditions!.some((condition: string) =>
          policy.applicableConditions!.some((policyCondition: string) =>
            policyCondition.toLowerCase().includes(condition.toLowerCase())
          )
        )
      );
    }

    if (searchRequest.season) {
      policies = policies.filter((policy: PolicyDocument) =>
        policy.seasonalRelevance &&
        policy.seasonalRelevance.includes(searchRequest.season!)
      );
    }

    return policies;
  },

  // Create new policy document
  create: (data: Omit<PolicyDocument, 'id'>) => FirestoreService.create<PolicyDocument>('policies', data),

  // Update policy document
  update: (id: string, data: Partial<Omit<PolicyDocument, 'id'>>) =>
    FirestoreService.update<PolicyDocument>('policies', id, data),

  // Delete policy document (soft delete by setting isActive to false)
  delete: (id: string) => FirestoreService.update<PolicyDocument>('policies', id, { isActive: false }),

  // Get policies relevant to a specific dosha
  getByDosha: (doshaType: 'vata' | 'pitta' | 'kapha') =>
    FirestoreService.getAll<PolicyDocument>('policies', (query) =>
      query.where(`doshaRelevance.${doshaType}`, '==', true).where('isActive', '==', true)
    ),

  // Get policies for specific health conditions
  getByConditions: (conditions: string[]) =>
    FirestoreService.getAll<PolicyDocument>('policies', (query) =>
      query.where('isActive', '==', true)
    ).then((policies: PolicyDocument[]) =>
      policies.filter((policy: PolicyDocument) =>
        policy.applicableConditions &&
        conditions.some((condition: string) =>
          policy.applicableConditions!.some((policyCondition: string) =>
            policyCondition.toLowerCase().includes(condition.toLowerCase())
          )
        )
      )
    ),

  // Get seasonal policies
  getBySeason: (season: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter') =>
    FirestoreService.getAll<PolicyDocument>('policies', (query) =>
      query.where('isActive', '==', true)
    ).then(policies =>
      policies.filter(policy =>
        policy.seasonalRelevance && policy.seasonalRelevance.includes(season)
      )
    ),

  // Check diet plan compliance against policies
  checkCompliance: async (dietPlanId: string, patientId: string): Promise<DietPlanCompliance> => {
    // Get diet plan details
    const dietPlan = await FirestoreService.getById('dietPlans', dietPlanId);
    if (!dietPlan) {
      throw new Error('Diet plan not found');
    }

    // Get patient details
    const patient = await FirestoreService.getById<Patient>('patients', patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get relevant policies based on patient dosha and conditions
    const relevantPolicies = await policiesService.search({
      doshaType: patient.doshaType?.toLowerCase() as 'vata' | 'pitta' | 'kapha',
      conditions: patient.allergies || [],
      limit: 20
    });

    // For now, return a basic compliance structure
    // In a full implementation, this would analyze the diet plan content against policy requirements
    const policyChecks: PolicyComplianceCheck[] = relevantPolicies.slice(0, 5).map(policy => ({
      policyId: policy.id,
      policyTitle: policy.title,
      complianceStatus: 'compliant', // Placeholder - would need actual analysis
      severity: 'medium'
    }));

    const overallCompliance = policyChecks.every(check => check.complianceStatus === 'compliant')
      ? 'compliant'
      : policyChecks.some(check => check.complianceStatus === 'non_compliant')
        ? 'non_compliant'
        : 'partial';

    return {
      dietPlanId,
      patientId,
      overallCompliance,
      policyChecks,
      generatedAt: new Date()
    };
  },

  // Get policy statistics
  getStats: async () => {
    const allPolicies = await policiesService.getAll();
    const activePolicies = allPolicies.filter(p => p.isActive);

    const stats = {
      total: allPolicies.length,
      active: activePolicies.length,
      byCategory: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      recentUpdates: activePolicies
        .filter(p => p.updatedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        .length
    };

    activePolicies.forEach(policy => {
      stats.byCategory[policy.category] = (stats.byCategory[policy.category] || 0) + 1;
      stats.bySource[policy.source] = (stats.bySource[policy.source] || 0) + 1;
    });

    return stats;
  }
};