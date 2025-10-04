
'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  HeartPulse,
  Bot,
  User,
  Stethoscope,
  Building,
  UtensilsCrossed,
  FileText,
  ClipboardList,
} from 'lucide-react';
import type { Role } from '@/lib/types';

const patientNav = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> },
  { name: 'Self Assessment', href: '/dashboard/assessment', icon: <ClipboardList /> },
  { name: 'Personal Chatbot', href: '/dashboard/chatbot', icon: <Bot /> },
  { name: 'My Profile', href: '/dashboard/profile', icon: <User /> },
];

const dietitianNav = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> },
  { name: 'Patients', href: '/dashboard/patients', icon: <User /> },
  { name: 'Generate Plan', href: '/dashboard/generate-plan', icon: <Bot /> },
  { name: 'Consultations', href: '/dashboard/consultations', icon: <Stethoscope /> },
];

const hospitalNav = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> },
  { name: 'Link Patient', href: '/dashboard/link-patient', icon: <User /> },
  { name: 'Update Vitals', href: '/dashboard/update-vitals', icon: <HeartPulse /> },
  { name: 'Mess Menu', href: '/dashboard/mess-menu', icon: <UtensilsCrossed /> },
];

const navItems: Record<Role, { name: string; href: string; icon: React.ReactNode }[]> = {
  patient: patientNav,
  dietitian: dietitianNav,
  'hospital-admin': hospitalNav,
};

function DashboardSidebarContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const role = (searchParams.get('role') as Role) || 'patient';
  const currentNav = navItems[role];

  return (
    <Sidebar className="bg-sidebar">
      <SidebarHeader className="bg-sidebar border-b border-sidebar-border p-3 xs:p-4">
        <div className="px-1 xs:px-2 py-1 xs:py-2">
          <h2 className="text-base xs:text-lg font-semibold text-sidebar-foreground">
            {role === 'patient' ? 'Patient Portal' :
             role === 'dietitian' ? 'Dietitian Portal' :
             role === 'hospital-admin' ? 'Hospital Portal' :
             'Portal'}
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar p-2 xs:p-3">
        <SidebarMenu className="space-y-1">
          {currentNav.map((item) => (
            <SidebarMenuItem key={item.name}>
                <Link href={`${item.href}?role=${role}`} className="w-full">
                    <SidebarMenuButton
                        tooltip={{ children: item.name }}
                        isActive={pathname === item.href}
                        className="w-full p-2 xs:p-3 text-sm xs:text-base"
                    >
                        <div className="flex items-center gap-2 xs:gap-3">
                          {item.icon}
                          <span className="truncate">{item.name}</span>
                        </div>
                    </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export function DashboardSidebar() {
  return (
    <Suspense fallback={
      <Sidebar className="bg-sidebar">
        <SidebarHeader className="bg-sidebar border-b border-sidebar-border p-3 xs:p-4">
          <div className="px-1 xs:px-2 py-1 xs:py-2">
            <h2 className="text-base xs:text-lg font-semibold text-sidebar-foreground">
              Loading...
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-sidebar p-2 xs:p-3">
          <div className="p-4 text-sm text-muted-foreground">Loading navigation...</div>
        </SidebarContent>
      </Sidebar>
    }>
      <DashboardSidebarContent />
    </Suspense>
  );
}
