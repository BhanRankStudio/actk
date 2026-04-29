"use client";
import { useEffect, useState } from "react";
import { formatDisplay } from "@/lib/dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Calendar, Clock, MapPin, FileText, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function HistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clock/my")
      .then((r) => r.json())
      .then((json) => setRecords(json.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading history...</p>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Clock History</h1>
        </div>

        <div className="grid gap-4">
          {records.length === 0 ? (
            <Card className="bg-background/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">No records found</CardTitle>
                <CardDescription>
                  You haven&apos;t started any work sessions yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            records.map((r: any) => (
              <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="bg-primary/5 p-6 flex flex-col justify-center border-r border-border/50 md:w-48">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Date
                    </div>
                    <div className="text-lg font-bold tracking-tight">
                      {formatDisplay(r.startWorkTime).split(' ')[0]}
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Time Range
                        </div>
                        <div className="text-sm font-semibold">
                          {formatDisplay(r.startWorkTime).split(' ')[1]} - {r.endWorkTime ? formatDisplay(r.endWorkTime).split(' ')[1] : "Active"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          Department
                        </div>
                        <div className="text-sm font-semibold">{r.department?.name || "N/A"}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <History className="h-4 w-4" />
                          Total Hours
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {r.totalHours ? `${Number(r.totalHours).toFixed(2)} hrs` : "-"}
                        </div>
                      </div>
                    </div>

                    {r.workDetail && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Work Detail
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed italic">
                            &quot;{r.workDetail}&quot;
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
