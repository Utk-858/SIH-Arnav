import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Force dynamic rendering to avoid Firebase initialization during build
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <p>User profile information will be displayed here.</p>
            </CardContent>
        </Card>
    );
}