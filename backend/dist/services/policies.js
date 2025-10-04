"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policiesService = void 0;
const firestore_1 = require("./firestore");
const firebase_1 = require("./firebase");
exports.policiesService = {
    // Get all policy documents
    getAll: () => firestore_1.FirestoreService.getAll('policies'),
    // Get policy by ID
    getById: (id) => firestore_1.FirestoreService.getById('policies', id),
    // Get policies by category
    getByCategory: (category) => firestore_1.FirestoreService.getAll('policies', (query) => query.where('category', '==', category).where('isActive', '==', true)),
    // Get policies by source
    getBySource: (source) => firestore_1.FirestoreService.getAll('policies', (query) => query.where('source', '==', source).where('isActive', '==', true)),
    // Search policies with advanced filtering
    search: async (searchRequest) => {
        let query = firebase_1.db.collection('policies').where('isActive', '==', true);
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
        let policies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Apply text search and additional filters in memory
        if (searchRequest.query) {
            const queryLower = searchRequest.query.toLowerCase();
            policies = policies.filter((policy) => policy.title.toLowerCase().includes(queryLower) ||
                policy.summary.toLowerCase().includes(queryLower) ||
                policy.fullContent.toLowerCase().includes(queryLower) ||
                policy.tags.some((tag) => tag.toLowerCase().includes(queryLower)));
        }
        if (searchRequest.tags && searchRequest.tags.length > 0) {
            policies = policies.filter((policy) => searchRequest.tags.some((tag) => policy.tags.includes(tag)));
        }
        if (searchRequest.conditions && searchRequest.conditions.length > 0) {
            policies = policies.filter((policy) => policy.applicableConditions &&
                searchRequest.conditions.some((condition) => policy.applicableConditions.some((policyCondition) => policyCondition.toLowerCase().includes(condition.toLowerCase()))));
        }
        if (searchRequest.season) {
            policies = policies.filter((policy) => policy.seasonalRelevance &&
                policy.seasonalRelevance.includes(searchRequest.season));
        }
        return policies;
    },
    // Create new policy document
    create: (data) => firestore_1.FirestoreService.create('policies', data),
    // Update policy document
    update: (id, data) => firestore_1.FirestoreService.update('policies', id, data),
    // Delete policy document (soft delete by setting isActive to false)
    delete: (id) => firestore_1.FirestoreService.update('policies', id, { isActive: false }),
    // Get policies relevant to a specific dosha
    getByDosha: (doshaType) => firestore_1.FirestoreService.getAll('policies', (query) => query.where(`doshaRelevance.${doshaType}`, '==', true).where('isActive', '==', true)),
    // Get policies for specific health conditions
    getByConditions: (conditions) => firestore_1.FirestoreService.getAll('policies', (query) => query.where('isActive', '==', true)).then((policies) => policies.filter((policy) => policy.applicableConditions &&
        conditions.some((condition) => policy.applicableConditions.some((policyCondition) => policyCondition.toLowerCase().includes(condition.toLowerCase()))))),
    // Get seasonal policies
    getBySeason: (season) => firestore_1.FirestoreService.getAll('policies', (query) => query.where('isActive', '==', true)).then(policies => policies.filter(policy => policy.seasonalRelevance && policy.seasonalRelevance.includes(season))),
    // Check diet plan compliance against policies
    checkCompliance: async (dietPlanId, patientId) => {
        // Get diet plan details
        const dietPlan = await firestore_1.FirestoreService.getById('dietPlans', dietPlanId);
        if (!dietPlan) {
            throw new Error('Diet plan not found');
        }
        // Get patient details
        const patient = await firestore_1.FirestoreService.getById('patients', patientId);
        if (!patient) {
            throw new Error('Patient not found');
        }
        // Get relevant policies based on patient dosha and conditions
        const relevantPolicies = await exports.policiesService.search({
            doshaType: patient.doshaType?.toLowerCase(),
            conditions: patient.allergies || [],
            limit: 20
        });
        // For now, return a basic compliance structure
        // In a full implementation, this would analyze the diet plan content against policy requirements
        const policyChecks = relevantPolicies.slice(0, 5).map(policy => ({
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
        const allPolicies = await exports.policiesService.getAll();
        const activePolicies = allPolicies.filter(p => p.isActive);
        const stats = {
            total: allPolicies.length,
            active: activePolicies.length,
            byCategory: {},
            bySource: {},
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
//# sourceMappingURL=policies.js.map