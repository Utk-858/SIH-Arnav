"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Leaf, LogOut } from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { NotificationsDropdown } from "@/components/dashboard/notifications";
import { useAuth } from "@/lib/auth";
import { useFCM } from "@/hooks/useFCM";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading } = useAuth();
  // Initialize FCM for push notifications
  useFCM();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-10 flex h-14 xs:h-16 items-center gap-2 border-b bg-background
                           px-3 xs:px-4 tablet:px-6 desktop:px-8">
            <div className="tablet:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex w-full items-center gap-2 xs:gap-3 tablet:gap-4 desktop:gap-6">
              <div className="ml-auto flex-1 xs:flex-initial">
                <Link href="/" className="flex items-center gap-2 font-headline font-semibold text-xs xs:text-sm tablet:text-base">
                  <Leaf className="h-4 w-4 xs:h-5 xs:w-5 tablet:h-6 tablet:w-6 text-primary" />
                  <span className="hidden xs:inline tablet:inline">SolveAI</span>
                  <span className="xs:hidden">SA</span>
                </Link>
              </div>
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 xs:h-8 xs:w-8 tablet:h-9 tablet:w-9 rounded-full">
                    <Avatar className="h-7 w-7 xs:h-8 xs:w-8 tablet:h-9 tablet:w-9">
                      <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="User" />
                      <AvatarFallback className="text-xs">U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 xs:w-52 tablet:w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile?.displayName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.email || 'user@example.com'}
                      </p>
                      {userProfile?.role && (
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {userProfile.role}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center">
                      <LogOut className="mr-2 h-3 w-3 xs:h-4 xs:w-4" />
                      <span>Log out</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <SidebarInset className="bg-background">
            <main className="flex-1 p-2 xs:p-3 tablet:p-4 desktop:p-6 overflow-auto bg-background">
              <div className="max-w-full mx-auto">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
