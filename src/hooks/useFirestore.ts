// Custom hooks for Firestore data fetching

import { useState, useEffect } from 'react';
import { patientsService, vitalsService, messMenusService, dietPlansService, consultationsService } from '@/lib/firestore';
import type { Patient, Vitals, MessMenu, DietPlan, Consultation } from '@/lib/types';

// Hook for fetching all patients
export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientsService.getAll();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return { patients, loading, error, refetch: fetchPatients };
}

// Hook for fetching a single patient
export function usePatient(id: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const data = await patientsService.getById(id);
        setPatient(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching patient:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  return { patient, loading, error };
}

// Hook for fetching patient vitals
export function usePatientVitals(patientId: string) {
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchVitals = async () => {
      try {
        setLoading(true);
        const data = await vitalsService.getByPatient(patientId);
        setVitals(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching vitals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVitals();
  }, [patientId]);

  return { vitals, loading, error };
}

// Hook for fetching latest patient vitals
export function useLatestVitals(patientId: string) {
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchLatestVitals = async () => {
      try {
        setLoading(true);
        const data = await vitalsService.getLatest(patientId);
        setVitals(data.length > 0 ? data[0] : null);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching latest vitals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestVitals();
  }, [patientId]);

  return { vitals, loading, error };
}

// Hook for fetching today's mess menu
export function useTodayMessMenu(hospitalId: string = 'default-hospital') {
  const [menu, setMenu] = useState<MessMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await messMenusService.getTodayMenu(hospitalId);
        setMenu(data.length > 0 ? data[0] : null);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching mess menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [hospitalId]);

  return { menu, loading, error };
}

// Hook for fetching diet plans
export function useDietPlans(patientId?: string) {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = patientId
          ? await dietPlansService.getByPatient(patientId)
          : await dietPlansService.getAll();
        setPlans(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching diet plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [patientId]);

  return { plans, loading, error };
}

// Hook for fetching consultations
export function useConsultations(dietitianId?: string) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        const data = dietitianId
          ? await consultationsService.getByDietitian(dietitianId)
          : await consultationsService.getAll();
        setConsultations(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching consultations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [dietitianId]);

  return { consultations, loading, error };
}