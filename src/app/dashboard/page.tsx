import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

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
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Welcome, {session.user?.name || session.user?.email}</p>
    </div>
  );
}


