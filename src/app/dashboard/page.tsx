import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <p className="mb-4">You must be logged in.</p>
        <Link className="underline" href="/login">Go to login</Link>
      </div>
    );
  }

  // Check if user has any clinic memberships
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      clinic: true,
    },
  });

  // If no memberships, redirect to onboarding
  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  // Get user's primary clinic (first one they're admin of, or first one)
  const primaryClinic = memberships.find(m => m.role === "ADMIN")?.clinic || memberships[0]?.clinic;

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name || session.user?.email}
        </p>
        {primaryClinic && (
          <p className="text-sm text-muted-foreground mt-1">
            Managing: <span className="font-medium">{primaryClinic.name}</span>
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Today's Appointments</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Patients</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Active Services</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/patients">
                👤 Manage Patients
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/services">
                🏥 Manage Services
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/appointments">
                📅 Manage Appointments
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-muted-foreground text-sm">
            No recent activity. Start by adding patients and scheduling appointments.
          </p>
        </div>
      </div>
    </div>
  );
}


