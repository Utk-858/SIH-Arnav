// Real-time data hooks using Firestore listeners

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Vitals, MessMenu, DietPlan, Consultation } from '@/lib/types';

// Real-time patients listener
export function useRealtimePatients(dietitianId?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    // Create query with optional dietitian filter
    const constraints = dietitianId ? [where('dietitianId', '==', dietitianId)] : [];
    const q = query(collection(db, 'patients'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const patientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Patient[];
        setPatients(patientsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error in real-time patients listener:', err);
      }
    );

    return unsubscribe; // Cleanup on unmount
  }, [dietitianId]);

  return { patients, loading, error };
}

// Real-time vitals listener for a patient
export function useRealtimeVitals(patientId: string) {
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    const q = query(
      collection(db, 'vitals'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const vitalsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vitals[];
        setVitals(vitalsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error in real-time vitals listener:', err);
      }
    );

    return unsubscribe;
  }, [patientId]);

  return { vitals, loading, error };
}

// Real-time mess menu listener
export function useRealtimeMessMenu(hospitalId: string = 'default-hospital') {
  const [menus, setMenus] = useState<MessMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'messMenus'),
      where('hospitalId', '==', hospitalId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const menusData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MessMenu[];
        setMenus(menusData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error in real-time mess menu listener:', err);
      }
    );

    return unsubscribe;
  }, [hospitalId]);

  return { menus, loading, error };
}

// Real-time diet plans listener
export function useRealtimeDietPlans(patientId?: string) {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const constraints = patientId ? [where('patientId', '==', patientId)] : [];
    const q = query(
      collection(db, 'dietPlans'),
      ...constraints,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const plansData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DietPlan[];
        setPlans(plansData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error in real-time diet plans listener:', err);
      }
    );

    return unsubscribe;
  }, [patientId]);

  return { plans, loading, error };
}

// Real-time consultations listener
export function useRealtimeConsultations(dietitianId?: string) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const constraints = dietitianId ? [where('dietitianId', '==', dietitianId)] : [];
    const q = query(
      collection(db, 'consultations'),
      ...constraints,
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const consultationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Consultation[];
        setConsultations(consultationsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error in real-time consultations listener:', err);
      }
    );

    return unsubscribe;
  }, [dietitianId]);

  return { consultations, loading, error };
}

// Real-time patient feedback listener
export function useRealtimePatientFeedback(patientId?: string) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const constraints = patientId ? [where('patientId', '==', patientId)] : [];
    const q = query(
      collection(db, 'patientFeedback'),
      ...constraints,
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const feedbackData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeedback(feedbackData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error('Error in real-time patient feedback listener:', err);
      }
    );

    return unsubscribe;
  }, [patientId]);

  return { feedback, loading, error };
}

// Generic real-time collection hook
export function useRealtimeCollection<T>(
  collectionName: string,
  constraints: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const collectionData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(collectionData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error(`Error in real-time ${collectionName} listener:`, err);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}