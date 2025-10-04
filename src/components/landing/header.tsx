"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { Leaf } from "lucide-react";

export function Header() {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 xs:px-6 tablet:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">SolveAI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Navigation items can be added here if needed */}
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsLoginOpen(true)}>
              Login
            </Button>
          </nav>
        </div>
      </div>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
}