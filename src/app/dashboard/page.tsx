import { DashboardClient } from '@/components/dashboard/dashboard-client';
import type { Role } from '@/lib/types';
import { Suspense } from 'react';

function DashboardFallback() {
  return <div>Loading dashboard...</div>
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = (searchParams.role as Role) || 'patient';
  
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient role={role} />
    </Suspense>
  );
}
