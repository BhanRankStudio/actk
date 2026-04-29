"use client";
import { useEffect, useState } from "react";
import { formatDisplay } from "@/lib/dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User as UserIcon, Search, Loader2, Clock, MapPin, History, ChevronLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function MonthlyReportPage() {
  const [user, setUser] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Admin specific states
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setUser(json.data);
          // Initial load for regular users
          if (json.data.role !== "admin") {
            loadUserReport(json.data);
          }
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setPageLoading(false));
  }, []);

  async function loadSummary() {
    setData([]); // Clear old data to prevent key conflicts during transition
    setLoading(true);
    setView("summary");
    setSelectedUser(null);
    try {
      const q = new URLSearchParams({
        year: String(year),
        month: String(month),
        summary: "true"
      });
      const res = await fetch(`/api/admin/clock?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to load summary");
      const json = await res.json();
      setData(json.data || []);
      setTotal(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }

  async function loadUserReport(targetUser: any) {
    setData([]); // Clear old data
    setLoading(true);
    if (user?.role === "admin") {
      setView("detail");
      setSelectedUser(targetUser);
    }
    try {
      const q = new URLSearchParams({
        year: String(year),
        month: String(month),
        userId: targetUser.id
      });
      const res = await fetch(`/api/admin/clock?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to load user report");
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.totalHours ?? 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user report");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Monthly Report</h1>
          </div>
          {isAdmin && view === "detail" && (
            <Button variant="outline" onClick={loadSummary} className="w-fit">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to User List
            </Button>
          )}
        </div>

        {/* Filter Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Filter Period</CardTitle>
            <CardDescription>Select a period to view attendance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Year
                </label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Month
                </label>
                <Input
                  type="number"
                  value={month}
                  min={1}
                  max={12}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <Button 
                onClick={isAdmin && view === "summary" ? loadSummary : () => loadUserReport(selectedUser || user)} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {isAdmin && view === "summary" ? "Load Users" : "Refresh Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Summary Stats for User View */}
          {total !== null && (
            <div className="flex items-center justify-between bg-background p-6 rounded-2xl border shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {selectedUser ? `${selectedUser.firstName}'s Total Hours` : "My Total Monthly Hours"}
                </p>
                <p className="text-4xl font-bold text-primary">{total.toFixed(2)} hrs</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}

          {/* Data Table */}
          <Card className="shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              {isAdmin && view === "summary" ? (
                // ADMIN SUMMARY VIEW
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Employee</th>
                      <th className="px-6 py-4 font-medium">Records</th>
                      <th className="px-6 py-4 font-medium">Total Hours</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          {loading ? "Loading users..." : "No user records found for this period."}
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{item.user.firstName} {item.user.lastName}</div>
                            <div className="text-xs text-muted-foreground">{item.user.email}</div>
                          </td>
                          <td className="px-6 py-4 font-medium">{item.recordCount}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                              {item.totalHours.toFixed(2)} hrs
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => loadUserReport(item.user)}>
                              View Details <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                // USER / ADMIN DETAIL VIEW
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Department</th>
                      <th className="px-6 py-4 font-medium">Time Range</th>
                      <th className="px-6 py-4 font-medium">Total</th>
                      <th className="px-6 py-4 font-medium">Work Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          {loading ? "Loading records..." : "No records found for this period."}
                        </td>
                      </tr>
                    ) : (
                      data.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            {formatDisplay(r.startWorkTime).split(' ')[0]}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {r.department?.name || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {formatDisplay(r.startWorkTime).split(' ')[1]} - {r.endWorkTime ? formatDisplay(r.endWorkTime).split(' ')[1] : "Active"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-primary">
                              {r.totalHours ? `${r.totalHours.toFixed(2)} hrs` : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate italic text-muted-foreground">
                            {r.workDetail || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
