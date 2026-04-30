"use client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar, User, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const years = [
  { value: "all", label: "All Years" },
  ...Array.from({ length: 11 }, (_, i) => ({ 
    value: String(currentYear - 5 + i), 
    label: String(currentYear - 5 + i) 
  }))
];

export default function AdminExportPage() {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");

  async function doExport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData(e.target as HTMLFormElement);
      const userId = form.get("userId");
      const q = new URLSearchParams();
      if (year !== "all") q.set("year", year);
      if (month !== "all") q.set("month", month);
      if (userId) q.set("userId", String(userId));
      const url = `/api/admin/export?${q.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `clock-report-${year || 'all'}-${month || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success("Report exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <FileDown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Export Reports</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Export Clock Records</CardTitle>
            <CardDescription>
              Generate and download an XLSX report for a specific period or user.
            </CardDescription>
          </CardHeader>
          <form onSubmit={doExport}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Year
                  </label>
                  <Select
                    value={year}
                    onValueChange={setYear}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Month
                  </label>
                  <Select
                    value={month}
                    onValueChange={setMonth}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  User ID (Optional)
                </label>
                <Input
                  name="userId"
                  placeholder="Leave empty for all users"
                  disabled={loading}
                />
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  The exported file will include all clock-in and clock-out details, total hours, and work descriptions for the selected criteria.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full h-12 text-lg" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
                Export XLSX
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
