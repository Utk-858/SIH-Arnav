// Firebase Authentication service

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
  type UserCredential,
} from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);

// Authentication functions
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, updates);
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },
};

// User profile with role information
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'patient' | 'dietitian' | 'hospital-admin';
  hospitalId?: string;
  dietitianId?: string;
  patientId?: string;
  profileComplete: boolean;
}

// Custom hook for using auth state in React components
export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load user profile from Firestore
        try {
          const profile = await loadUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Create default profile if none exists
          const defaultProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName,
            role: 'patient', // Default role
            profileComplete: false,
          };
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, userProfile, loading };
}

// Load user profile from Firestore
export async function loadUserProfile(uid: string): Promise<UserProfile> {
  try {
    // Import usersService dynamically to avoid circular imports
    const { usersService } = await import('./firestore');

    const user = await usersService.getById(uid);
    if (user) {
      // Map User to UserProfile
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        hospitalId: user.hospitalId,
        patientId: user.patientId,
        profileComplete: true, // User exists in Firestore, so profile is complete
      };
    } else {
      // User doesn't exist in Firestore yet
      throw new Error('User profile not found in database');
    }
  } catch (error) {
    console.error('Error loading user profile from Firestore:', error);
    throw error;
  }
}

// Helper functions for getting user IDs
export function getCurrentUserId(): string | null {
  const user = auth.currentUser;
  return user ? user.uid : null;
}

export function getCurrentHospitalId(): string {
  // In production, this would come from user profile/role data
  // For now, return a dynamic value or default
  return 'default-hospital';
}

export function getCurrentDietitianId(): string {
  // In production, this would come from user profile/role data
  // For now, return a dynamic value or default
  return 'current-dietitian';
}

// Import React for the hook
import React from 'react';