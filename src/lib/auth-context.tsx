"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, UserProfile } from './auth';
import { loadUserProfile } from './auth';
import type { Patient } from './types';

// Enhanced role permissions interface
export interface RolePermissions {
  canViewPatients: boolean;
  canEditPatients: boolean;
  canViewDietPlans: boolean;
  canEditDietPlans: boolean;
  canViewHospitalData: boolean;
  canEditHospitalData: boolean;
  canAccessAdminPanel: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canViewPersonalData: boolean;
  canEditPersonalData: boolean;
  canAccessChatbot: boolean;
  canViewAllPatients: boolean;
  canManageHospital: boolean;
}

// Role-based permission configurations
const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  patient: {
    canViewPatients: false,
    canEditPatients: false,
    canViewDietPlans: true,
    canEditDietPlans: false,
    canViewHospitalData: false,
    canEditHospitalData: false,
    canAccessAdminPanel: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canViewPersonalData: true,
    canEditPersonalData: true,
    canAccessChatbot: true,
    canViewAllPatients: false,
    canManageHospital: false,
  },
  dietitian: {
    canViewPatients: true,
    canEditPatients: true,
    canViewDietPlans: true,
    canEditDietPlans: true,
    canViewHospitalData: false,
    canEditHospitalData: false,
    canAccessAdminPanel: false,
    canViewAnalytics: true,
    canManageUsers: false,
    canViewPersonalData: false,
    canEditPersonalData: false,
    canAccessChatbot: true,
    canViewAllPatients: false,
    canManageHospital: false,
  },
  'hospital-admin': {
    canViewPatients: true,
    canEditPatients: true,
    canViewDietPlans: true,
    canEditDietPlans: true,
    canViewHospitalData: true,
    canEditHospitalData: true,
    canAccessAdminPanel: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canViewPersonalData: false,
    canEditPersonalData: false,
    canAccessChatbot: true,
    canViewAllPatients: true,
    canManageHospital: true,
  },
};

// Enhanced auth context interface
export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  permissions: RolePermissions | null;
  selectedPatient: Patient | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  refreshProfile: () => Promise<void>;
  selectPatient: (patient: Patient) => void;
  clearPatientSelection: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await loadUserProfile(user.uid);
        setUserProfile(profile);
        setPermissions(ROLE_PERMISSIONS[profile.role] || null);
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  // Select patient
  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  // Clear patient selection
  const clearPatientSelection = () => {
    setSelectedPatient(null);
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return userProfile?.role === role;
  };

  // Check if user has specific permission
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions?.[permission] || false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const profile = await loadUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          setPermissions(ROLE_PERMISSIONS[profile.role] || null);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Set default permissions for unknown roles
          setPermissions(ROLE_PERMISSIONS.patient);
        }
      } else {
        // Check for demo role in URL for development/demo purposes
        const urlParams = new URLSearchParams(window.location.search);
        const demoRoleParam = urlParams.get('role');
        const validRoles = ['patient', 'dietitian', 'hospital-admin'] as const;
        const demoRole = validRoles.find(role => role === demoRoleParam);

        if (demoRole && ROLE_PERMISSIONS[demoRole]) {
          // Set mock profile for demo
          const mockProfile: UserProfile = {
            uid: `demo-${demoRole}`,
            email: `${demoRole}@demo.com`,
            displayName: `${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)} User`,
            role: demoRole,
            profileComplete: true,
          };
          setUserProfile(mockProfile);
          setPermissions(ROLE_PERMISSIONS[demoRole]);
        } else {
          setUserProfile(null);
          setPermissions(null);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    permissions,
    selectedPatient,
    loading,
    isAuthenticated: !!user,
    hasRole,
    hasPermission,
    refreshProfile,
    selectPatient,
    clearPatientSelection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Role guard component for conditional rendering
export interface RoleGuardProps {
  roles?: string[];
  permissions?: (keyof RolePermissions)[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, user needs ANY permission
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  roles,
  permissions,
  requireAll = false,
  children,
  fallback = null
}: RoleGuardProps) {
  const { userProfile, hasRole, hasPermission } = useAuthContext();

  // Check role requirements
  const roleCheck = !roles || roles.length === 0 || roles.some(role => hasRole(role));

  // Check permission requirements
  let permissionCheck = true;
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      permissionCheck = permissions.every(permission => hasPermission(permission));
    } else {
      permissionCheck = permissions.some(permission => hasPermission(permission));
    }
  }

  if (!roleCheck || !permissionCheck) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Data access context for role-based data filtering
export interface DataAccessContext {
  hospitalId?: string;
  dietitianId?: string;
  patientId?: string;
  canAccessAllPatients: boolean;
  canAccessHospitalData: boolean;
}

export function useDataAccess(): DataAccessContext {
  const { userProfile, hasPermission } = useAuthContext();

  return {
    hospitalId: userProfile?.hospitalId,
    dietitianId: userProfile?.dietitianId,
    patientId: userProfile?.patientId,
    canAccessAllPatients: hasPermission('canViewAllPatients'),
    canAccessHospitalData: hasPermission('canViewHospitalData'),
  };
}