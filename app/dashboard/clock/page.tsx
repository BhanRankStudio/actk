"use client";
import { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save, Info, Loader2, MapPin, Calendar, Timer } from "lucide-react";
import { toast } from "sonner";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

function TimePicker({ 
  label, 
  date, 
  setDate, 
  hour, 
  setHour, 
  minute, 
  setMinute, 
  disabled 
}: { 
  label: string;
  date: string;
  setDate: (v: string) => void;
  hour: string;
  setHour: (v: string) => void;
  minute: string;
  setMinute: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <div className="flex gap-2 shrink-0">
          <Select value={hour} onValueChange={setHour} disabled={disabled}>
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center text-muted-foreground">:</div>
          <Select value={minute} onValueChange={setMinute} disabled={disabled}>
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="mm" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default function ClockPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  
  // Start Time State
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");

  // End Time State
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("00");

  const [workDetail, setWorkDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch departments
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.data || []))
      .catch((err) => toast.error("Failed to load departments"));

    // Set default dates to today
    const today = dayjs().format("YYYY-MM-DD");
    setStartDate(today);
    setEndDate(today);
    
    // Set default hours to current or standard
    const now = dayjs();
    setStartHour(now.format("HH"));
    setStartMinute(now.format("mm"));
    setEndHour(now.add(1, 'hour').format("HH"));
    setEndMinute(now.format("mm"));
  }, []);

  async function onSubmit() {
    if (!departmentId || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const startDateTime = dayjs(startDate)
        .hour(parseInt(startHour))
        .minute(parseInt(startMinute))
        .second(0)
        .toISOString();

      const endDateTime = dayjs(endDate)
        .hour(parseInt(endHour))
        .minute(parseInt(endMinute))
        .second(0)
        .toISOString();

      const payload = {
        departmentId,
        startWorkTime: startDateTime,
        endWorkTime: endDateTime,
        workDetail,
      };

      const res = await fetch("/api/clock/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save record");
      }

      toast.success("Clock record saved successfully");
      // Reset form a bit
      setWorkDetail("");
    } catch (err: any) {
      setError(err.message || String(err));
      toast.error(err.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Manual Clock Entry</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Record Work Session</CardTitle>
            <CardDescription>
              Enter your work details, including department and session timing (24h format).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Department
              </label>
              <Select onValueChange={setDepartmentId} value={departmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <TimePicker
                label="Start Date & Time"
                date={startDate}
                setDate={setStartDate}
                hour={startHour}
                setHour={setStartHour}
                minute={startMinute}
                setMinute={setStartMinute}
                disabled={loading}
              />
              
              <TimePicker
                label="End Date & Time"
                date={endDate}
                setDate={setEndDate}
                hour={endHour}
                setHour={setEndHour}
                minute={endMinute}
                setMinute={setEndMinute}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                Work Detail
              </label>
              <textarea
                placeholder="What did you work on during this session?"
                value={workDetail}
                onChange={(e) => setWorkDetail(e.target.value)}
                disabled={loading}
                className="flex min-h-[120px] w-full rounded-2xl border border-input bg-input/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full h-12 text-lg"
              onClick={onSubmit}
              disabled={loading || !departmentId || !startDate || !endDate}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Record
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
