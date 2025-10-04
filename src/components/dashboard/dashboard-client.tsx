'use client';

import type { Role } from '@/lib/types';
import { PatientView } from './patient-view';
import { DietitianView } from './dietitian-view';
import { HospitalView } from './hospital-view';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Leaf } from 'lucide-react';

type DashboardClientProps = {
  role: Role;
};

export function DashboardClient({ role }: DashboardClientProps) {
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="space-y-6">
      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Leaf className="text-primary"/>
            {roleName} Dashboard
          </CardTitle>
          <CardDescription>Welcome to your SolveAI portal. Manage your health journey here.</CardDescription>
        </CardHeader>
      </Card>

      {role === 'patient' && <PatientView />}
      {role === 'dietitian' && <DietitianView />}
      {role === 'hospital-admin' && <HospitalView />}
    </div>
  );
}
