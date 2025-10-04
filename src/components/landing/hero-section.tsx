"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/login-dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function HeroSection() {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  return (
    <div>
      <section className="relative w-full py-8 xs:py-12 tablet:py-16 desktop:py-24 desktop-lg:py-32">
        <div className="container px-4 xs:px-6 tablet:px-8">
          <div className="grid gap-6 tablet:grid-cols-[1fr_400px] desktop:grid-cols-[1fr_500px] desktop-lg:grid-cols-[1fr_600px] tablet:gap-8 desktop:gap-12">
            <div className="flex flex-col justify-center space-y-3 tablet:space-y-4">
              <div className="space-y-3 tablet:space-y-4">
                <h1 className="text-2xl font-bold tracking-tighter font-headline xs:text-3xl tablet:text-4xl desktop:text-5xl desktop-lg:text-6xl/none text-balance leading-tight">
                  Harmonize Your Health with AI-Powered Ayurvedic Nutrition
                </h1>
                <p className="max-w-[600px] text-sm xs:text-base tablet:text-lg desktop:text-xl text-foreground/80 text-balance">
                  SolveAI combines ancient wisdom with modern technology to create personalized diet plans that align with your unique constitution and health goals.
                </p>
              </div>
              <div className="flex flex-col gap-2 xs:flex-row tablet:flex-row min-[400px]:flex-row pt-2">
                <Button size="default" className="w-full xs:w-auto" onClick={() => setIsLoginOpen(true)}>
                  Get Started
                </Button>
              </div>
            </div>
            {heroImage && (
              <div className="order-first tablet:order-last">
                <Image
                  alt="Hero"
                  className="mx-auto aspect-video overflow-hidden rounded-lg tablet:rounded-xl object-cover w-full tablet:w-full desktop:w-full max-w-md tablet:max-w-none"
                  data-ai-hint={heroImage.imageHint}
                  height="550"
                  src={heroImage.imageUrl}
                  width="550"
                />
              </div>
            )}
          </div>
        </div>
      </section>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </div>
  );
}
