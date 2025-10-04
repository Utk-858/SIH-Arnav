"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { patientsService, usersService, hospitalsService } from "@/lib/firestore";
import { authService } from "@/lib/auth";
import { generatePatientCode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";
import { TestFirestore } from "@/components/test-firestore";
import type { Hospital } from "@/lib/types";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'dietitian' | 'hospital-admin'>('patient');
  const { toast } = useToast();
  const router = useRouter();

  // Fetch hospitals on component mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalList = await hospitalsService.getAll();
        setHospitals(hospitalList);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      }
    };
    fetchHospitals();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting registration process...');

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const displayName = formData.get('name') as string;
      const selectedHospitalId = formData.get('hospitalId') as string;

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Create Firebase Auth user
      console.log('Creating Firebase Auth user...');
      const userCredential = await authService.signUp(email, password, displayName);
      const uid = userCredential.user.uid;
      console.log('Firebase Auth user created:', uid);

      let patientCode: string | null = null;
      let patientId: string | null = null;

      // Create user document in Firestore
      const userData: {
        uid: string;
        email: string;
        displayName: string;
        role: 'patient' | 'dietitian' | 'hospital-admin';
        hospitalId?: string;
        patientId?: string;
        createdAt: Date;
        lastLogin: Date;
      } = {
        uid,
        email,
        displayName,
        role: selectedRole,
        hospitalId: selectedRole !== 'patient' ? selectedHospitalId : undefined,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // For patients, also create patient record and generate code
      if (selectedRole === 'patient') {
        patientCode = generatePatientCode();
        console.log('Generated patient code:', patientCode);

        const patientData = {
          name: displayName,
          age: parseInt(formData.get('age') as string),
          gender: formData.get('gender') as 'Male' | 'Female' | 'Other',
          code: patientCode,
          email: email || undefined,
          phone: (formData.get('phone') as string) || undefined,
          address: (formData.get('address') as string) || undefined,
          emergencyContact: {
            name: (formData.get('emergencyName') as string) || '',
            phone: (formData.get('emergencyPhone') as string) || '',
            relationship: (formData.get('emergencyRelationship') as string) || '',
          },
          dietaryHabits: (formData.get('dietaryHabits') as string) || undefined,
          allergies: ((formData.get('allergies') as string) || '').split(',').map(a => a.trim()).filter(a => a.length > 0),
          registrationDate: new Date(),
          lastUpdated: new Date(),
        };

        console.log('Creating patient record...');
        const newPatient = await patientsService.create(patientData);
        patientId = newPatient.id;
        console.log('Patient created successfully:', newPatient);

        // Update user data with patientId
        userData.patientId = patientId;
      }

      // Create user document
      console.log('Creating user document...');
      await usersService.create(userData);
      console.log('User document created successfully');

      // Set generated code for patients
      if (patientCode) {
        setGeneratedCode(patientCode);
      }

      toast({
        title: "Registration Successful!",
        description: selectedRole === 'patient'
          ? `Your unique patient code is: ${patientCode}. Please save this code to share with your hospital or dietitian.`
          : "Your account has been created successfully. You can now log in.",
      });

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Registration Failed",
        description: `Error: ${errorMessage}. Please check console for details.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline">Registration Complete!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Please save your unique patient code.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your Unique Patient Code</p>
              <p className="text-2xl font-mono font-bold text-primary">{generatedCode}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this code with your hospital during admission or with your dietitian during consultation.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/')} className="w-full">
                Go to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard?role=patient&code=${generatedCode}`)}
                className="w-full"
              >
                Access Patient Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="flex justify-center order-2 lg:order-1">
          <TestFirestore />
        </div>
        <div className="flex justify-center order-1 lg:order-2">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <UserPlus className="h-6 w-6" />
                User Registration
              </CardTitle>
              <CardDescription>
                Create your SolveAI account. Select your role and provide the required information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <RadioGroup
                    name="role"
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as 'patient' | 'dietitian' | 'hospital-admin')}
                    className="flex flex-wrap gap-4 sm:gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="patient" id="patient" />
                      <Label htmlFor="patient">Patient</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dietitian" id="dietitian" />
                      <Label htmlFor="dietitian">Dietitian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hospital-admin" id="hospital-admin" />
                      <Label htmlFor="hospital-admin">Hospital Admin</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Hospital Selection for staff roles */}
                {(selectedRole === 'dietitian' || selectedRole === 'hospital-admin') && (
                  <div className="space-y-2">
                    <Label htmlFor="hospitalId">Hospital *</Label>
                    <Select name="hospitalId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Account Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" name="password" type="password" required minLength={6} />
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  {selectedRole === 'patient' && (
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input id="age" name="age" type="number" min="1" max="120" required />
                    </div>
                  )}
                </div>

                {selectedRole === 'patient' && (
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <RadioGroup name="gender" defaultValue="Male" className="flex flex-wrap gap-4 sm:gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="other" />
                        <Label htmlFor="other">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRole !== 'patient' && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" rows={2} />
                </div>

                {/* Patient-specific sections */}
                {selectedRole === 'patient' && (
                  <>
                    {/* Emergency Contact */}
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-medium">Emergency Contact</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyName">Name</Label>
                          <Input id="emergencyName" name="emergencyName" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Phone</Label>
                          <Input id="emergencyPhone" name="emergencyPhone" type="tel" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyRelationship">Relationship</Label>
                          <Input id="emergencyRelationship" name="emergencyRelationship" placeholder="e.g., Spouse, Parent" />
                        </div>
                      </div>
                    </div>

                    {/* Health Information */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dietaryHabits">Dietary Habits & Preferences</Label>
                        <Textarea
                          id="dietaryHabits"
                          name="dietaryHabits"
                          placeholder="e.g., Vegetarian, prefer spicy foods, avoid dairy, etc."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                        <Input
                          id="allergies"
                          name="allergies"
                          placeholder="e.g., nuts, dairy, gluten"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    selectedRole === 'patient' ? "Register & Generate Code" : "Create Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}