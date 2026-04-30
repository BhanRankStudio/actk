import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, FileText, LayoutDashboard, FileDown } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  return <DashboardContent />;
}

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "admin";

  const actions = isAdmin 
    ? [
        {
          title: "Monthly Report",
          description: "View and manage monthly attendance summaries for all users.",
          href: "/admin/monthly-report",
          icon: FileText,
          color: "text-purple-500",
        },
        {
          title: "Export Data",
          description: "Export attendance and clock records to Excel format.",
          href: "/admin/export",
          icon: FileDown,
          color: "text-green-500",
        },
      ]
    : [
      {
        title: "Clock In / Out",
        description: "Start or end your work session and track your time.",
        href: "/dashboard/clock",
        icon: Clock,
        color: "text-blue-500",
      },
      {
        title: "Monthly Report",
        description: "View your monthly attendance summaries and total work hours.",
        href: "/admin/monthly-report",
        icon: FileText,
        color: "text-purple-500",
      },
    ];
  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, <span className="text-foreground font-medium">{user.firstName} {user.lastName}</span>!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action) => (
            <Card key={action.href} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className={`${action.color} bg-muted rounded-xl p-3 w-fit mb-2 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href={action.href}>Go to {action.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
