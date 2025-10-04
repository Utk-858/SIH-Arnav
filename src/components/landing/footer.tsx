import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-3 xs:gap-4 py-6 xs:py-8 tablet:py-10
                      tablet:h-24 tablet:flex-row tablet:py-0 px-4 xs:px-6 tablet:px-8">
        <div className="flex flex-col items-center gap-3 xs:gap-4 tablet:flex-row tablet:gap-2">
          <Leaf className="h-5 w-5 xs:h-6 xs:w-6 text-primary" />
          <p className="text-center text-xs xs:text-sm leading-relaxed tablet:text-left">
            Built for a healthier tomorrow. &copy; {new Date().getFullYear()} SolveAI. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
