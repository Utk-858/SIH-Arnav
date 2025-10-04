import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Force dynamic rendering to avoid Firebase initialization during build
export const dynamic = 'force-dynamic';

export default function UpdateVitalsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Patient Vitals</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="patientCode">Patient Code</Label>
                        <Input id="patientCode" placeholder="Enter patient's unique code" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vitals">Vitals</Label>
                        <Input id="vitals" placeholder="e.g., BP: 120/80, Temp: 98.6°F" />
                    </div>
                    <Button type="submit">Update Vitals</Button>
                </form>
            </CardContent>
        </Card>
    );
}