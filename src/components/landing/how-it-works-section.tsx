import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Stethoscope, Building, PenSquare, Share2, ClipboardPlus, Bot, Send } from "lucide-react";

const patientSteps = [
  { icon: <PenSquare />, text: "Register and create your profile." },
  { icon: <Share2 />, text: "Share your unique code with the hospital." },
  { icon: <Send />, text: "Receive your personalized diet chart." },
  { icon: <Bot />, text: "Chat with your personal bot for guidance." },
];

const dietitianSteps = [
  { icon: <ClipboardPlus />, text: "Enter patient code to fetch profile." },
  { icon: <Bot />, text: "Use AI to generate a baseline diet chart." },
  { icon: <PenSquare />, text: "Review, customize, and approve the chart." },
  { icon: <Send />, text: "Deliver the plan and monitor patient progress." },
];

const hospitalSteps = [
  { icon: <User />, text: "Link patient profiles using their unique code." },
  { icon: <ClipboardPlus />, text: "Update daily mess menus and patient vitals." },
  { icon: <Stethoscope />, text: "Provide dietitians with up-to-date information." },
];

const Step = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-3 xs:gap-4">
    <div className="flex h-8 w-8 xs:h-10 xs:w-10 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
      {icon}
    </div>
    <p className="text-sm xs:text-base text-foreground/90 leading-relaxed">{text}</p>
  </div>
);

const RoleCard = ({ title, icon, steps }: { title: string, icon: React.ReactNode, steps: { icon: React.ReactNode, text: string }[] }) => (
  <Card className="flex flex-col h-full">
    <CardHeader className="pb-4 xs:pb-6">
      <CardTitle className="flex items-center gap-2 font-headline text-lg xs:text-xl tablet:text-2xl">
        {icon} For {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-3 xs:gap-4 pt-0">
      {steps.map((step, index) => <Step key={index} icon={step.icon} text={step.text} />)}
    </CardContent>
  </Card>
);

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-8 xs:py-12 tablet:py-16 desktop:py-24 desktop-lg:py-32">
      <div className="container px-4 xs:px-6 tablet:px-8">
        <div className="flex flex-col items-center justify-center space-y-3 xs:space-y-4 text-center mb-8 xs:mb-10 tablet:mb-12">
          <div className="space-y-2 xs:space-y-3">
            <h2 className="text-2xl font-bold tracking-tighter font-headline xs:text-3xl tablet:text-4xl desktop:text-5xl">A Simple Path to Wellness</h2>
            <p className="max-w-[900px] text-sm xs:text-base tablet:text-lg desktop:text-xl text-foreground/80 leading-relaxed">
              SolveAI simplifies health management for everyone involved. Here's how each role benefits from our streamlined process.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-6xl items-start gap-4 xs:gap-6 tablet:gap-8
                     grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3">
          <RoleCard title="Patients" icon={<User />} steps={patientSteps} />
          <RoleCard title="Dietitians" icon={<Stethoscope />} steps={dietitianSteps} />
          <RoleCard title="Hospitals" icon={<Building />} steps={hospitalSteps} />
        </div>
      </div>
    </section>
  );
}
