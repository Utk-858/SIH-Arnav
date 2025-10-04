"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Building, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (role: Role) => {
    router.push(`/dashboard?role=${role}`);
    onOpenChange(false);
    toast({
      title: "Welcome!",
      description: `Accessing ${role} dashboard in demo mode.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">
            <span className="flex items-center gap-2">
              <Leaf className="text-primary h-6 w-6" />
              Welcome to SolveAI
            </span>
          </DialogTitle>
          <DialogDescription>
            Please select your role to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            size="lg"
            className="justify-start text-base py-6"
            onClick={() => handleLogin('patient')}
          >
            <User className="mr-4 h-5 w-5" />
            Login as Patient
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-start text-base py-6"
            onClick={() => handleLogin('dietitian')}
          >
            <Stethoscope className="mr-4 h-5 w-5" />
            Login as Dietitian
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-start text-base py-6"
            onClick={() => handleLogin('hospital-admin')}
          >
            <Building className="mr-4 h-5 w-5" />
            Login as Hospital Staff
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
