"use client";
import { useEffect, useState } from "react";
import { formatDisplay } from "@/lib/dayjs";
import dayjs from "@/lib/dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  User as UserIcon, 
  Search, 
  Loader2, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ArrowRight,
  List,
  Info,
  Edit,
  Trash2,
  Timer
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const months = [
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
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

export default function MonthlyReportPage() {
  const [user, setUser] = useState<any>(null);
  
  // Initialize with current business month cutoff
  const now = dayjs().tz("Asia/Bangkok");
  
  // Logic for old Year/Month selection
  const initialYear = now.date() >= 26 ? now.year() : (now.month() === 0 ? now.year() - 1 : now.year());
  const initialMonth = now.date() >= 26 ? now.month() + 1 : now.month() || 12;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Logic for new Date Range selection (Admin only)
  const defaultEnd = dayjs.tz(`${now.year()}-${String(now.month() + 1).padStart(2, '0')}-25`, "Asia/Bangkok");
  const defaultStart = defaultEnd.subtract(1, "month").add(1, "day").startOf("day");

  const [startDate, setStartDate] = useState(defaultStart.format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(defaultEnd.format("YYYY-MM-DD"));
  
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Admin specific states
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Calendar specific states
  const [selectedDayRecords, setSelectedDayRecords] = useState<any[]>([]);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [selectedDateLabel, setSelectedDateLabel] = useState("");

  // Edit/Delete states
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

    fetch("/api/departments")
      .then((r) => r.json())
      .then((json) => setDepartments(json.data || []))
      .catch(console.error);
  }, []);

  async function loadSummary() {
    setData([]); // Clear old data to prevent key conflicts during transition
    setLoading(true);
    setView("summary");
    setSelectedUser(null);
    try {
      const q = new URLSearchParams();
      if (isAdmin) {
        q.set("startDate", dayjs.tz(startDate, "Asia/Bangkok").startOf("day").toISOString());
        q.set("endDate", dayjs.tz(endDate, "Asia/Bangkok").endOf("day").toISOString());
      } else {
        q.set("year", String(year));
        q.set("month", String(month));
      }
      q.set("summary", "true");
      
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
      const q = new URLSearchParams();
      if (isAdmin && (view === "summary" || selectedUser)) {
        q.set("startDate", dayjs.tz(startDate, "Asia/Bangkok").startOf("day").toISOString());
        q.set("endDate", dayjs.tz(endDate, "Asia/Bangkok").endOf("day").toISOString());
      } else {
        q.set("year", String(year));
        q.set("month", String(month));
      }
      q.set("userId", targetUser.id);
      
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

  const openEditDialog = (record: any) => {
    setEditingRecord({
      ...record,
      // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
      startWorkTime: dayjs(record.startWorkTime).tz("Asia/Bangkok").format("YYYY-MM-DDTHH:mm"),
      endWorkTime: record.endWorkTime ? dayjs(record.endWorkTime).tz("Asia/Bangkok").format("YYYY-MM-DDTHH:mm") : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/clock/${editingRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: editingRecord.departmentId,
          startWorkTime: dayjs.tz(editingRecord.startWorkTime, "Asia/Bangkok").toISOString(),
          endWorkTime: editingRecord.endWorkTime ? dayjs.tz(editingRecord.endWorkTime, "Asia/Bangkok").toISOString() : null,
          workDetail: editingRecord.workDetail,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update record");
      }

      toast.success("Record updated successfully");
      setIsEditDialogOpen(false);
      // Refresh data
      if (isAdmin && view === "summary") {
        loadSummary();
      } else {
        loadUserReport(selectedUser || user);
      }
      // Also update selectedDayRecords if dialog is open
      if (isDayDialogOpen) {
        const updatedRecord = await res.json();
        setSelectedDayRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...updatedRecord.data, department: departments.find(d => d.id === editingRecord.departmentId) } : r));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/clock/${recordToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete record");
      }

      toast.success("Record deleted successfully");
      setIsDeleteDialogOpen(false);
      // Refresh data
      if (isAdmin && view === "summary") {
        loadSummary();
      } else {
        loadUserReport(selectedUser || user);
      }
      // Also update selectedDayRecords if dialog is open
      if (isDayDialogOpen) {
        setSelectedDayRecords(prev => prev.filter(r => r.id !== recordToDelete));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
      setRecordToDelete(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  const renderCalendar = () => {
    // For admins using range picker, use the start date of the range
    // For regular users, use the selected year/month
    const startObj = isAdmin && (view === "summary" || selectedUser) 
      ? dayjs(startDate) 
      : dayjs(`${year}-${month}-01`);
      
    const startOfMonth = startObj.startOf('month');
    const daysInMonth = startOfMonth.daysInMonth();
    const firstDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
    
    const recordsByDay = data.reduce((acc: Record<number, any[]>, record) => {
      const recordDate = dayjs(record.startWorkTime).tz("Asia/Bangkok");
      if (recordDate.month() === startOfMonth.month() && recordDate.year() === startOfMonth.year()) {
        const d = recordDate.date();
        if (!acc[d]) acc[d] = [];
        acc[d].push(record);
      }
      return acc;
    }, {});

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="grid grid-cols-7 gap-px bg-muted border rounded-xl overflow-hidden shadow-sm w-full">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-muted/50 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider border-b">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
        {days.map((day, i) => {
          const dayRecords = day ? recordsByDay[day] : null;
          const hasRecords = dayRecords && dayRecords.length > 0;
          
          return (
            <div 
              key={i} 
              className={cn(
                "bg-background min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 transition-all duration-200 border-b border-r",
                day ? "hover:bg-primary/5 cursor-pointer group" : "bg-muted/5"
              )}
              onClick={() => {
                if (day && hasRecords) {
                  setSelectedDayRecords(dayRecords);
                  setSelectedDateLabel(dayjs(`${startOfMonth.year()}-${startOfMonth.month() + 1}-${day}`).format("MMMM D, YYYY"));
                  setIsDayDialogOpen(true);
                }
              }}
            >
              {day && (
                <div className="flex flex-col h-full gap-1 sm:gap-2">
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold h-5 w-5 sm:h-7 sm:w-7 flex items-center justify-center rounded-full transition-colors",
                    hasRecords ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {day}
                  </span>
                  <div className="flex-1 space-y-0.5 sm:space-y-1 overflow-hidden">
                    {dayRecords?.slice(0, 3).map(r => (
                      <div key={r.id} className="text-[8px] sm:text-[10px] leading-tight px-1 py-0.5 sm:px-1.5 sm:py-1 rounded bg-muted border border-transparent hover:border-primary/20 transition-all truncate font-medium">
                        {r.totalHours?.toFixed(1)}h <span className="hidden sm:inline">| {r.department?.name}</span>
                      </div>
                    ))}
                    {dayRecords && dayRecords.length > 3 && (
                      <div className="text-[7px] sm:text-[9px] text-muted-foreground pl-1 font-medium italic">
                        + {dayRecords.length - 3} <span className="hidden sm:inline">more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Attendance Report</h1>
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
            <CardDescription>
              {isAdmin ? "Select a date range to view attendance." : "Select a month to view attendance."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={view === "summary" ? loadSummary : () => loadUserReport(selectedUser || user)} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  {view === "summary" ? "Load Users" : "Refresh Report"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Year
                  </label>
                  <Select
                    value={String(year)}
                    onValueChange={(val) => setYear(Number(val))}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
                    value={String(month)}
                    onValueChange={(val) => setMonth(Number(val))}
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
                <Button 
                  onClick={() => loadUserReport(user)} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Refresh Report
                </Button>
              </div>
            )}
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
                // USER / ADMIN DETAIL VIEW WITH TABS
                <Tabs defaultValue="calendar" className="w-full">
                  <div className="px-6 py-2 border-b bg-muted/20 flex items-center justify-between">
                    <TabsList variant="line">
                      <TabsTrigger value="calendar">
                        <Calendar className="h-4 w-4 mr-2" /> Calendar View
                      </TabsTrigger>
                      <TabsTrigger value="table">
                        <List className="h-4 w-4 mr-2" /> Table View
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="calendar" className="mt-0 p-6 outline-none bg-background">
                    {data.length === 0 && !loading ? (
                       <div className="py-20 text-center text-muted-foreground">
                         <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                         <p>No records available for calendar view.</p>
                       </div>
                    ) : (
                      renderCalendar()
                    )}
                  </TabsContent>

                  <TabsContent value="table" className="mt-0 outline-none">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Department</th>
                          <th className="px-6 py-4 font-medium">Time Range</th>
                          <th className="px-6 py-4 font-medium">Total</th>
                          <th className="px-6 py-4 font-medium">Work Detail</th>
                          <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => openEditDialog(r)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => confirmDelete(r.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </Card>
        </div>

        {/* Day Details Dialog */}
        <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5 text-primary" />
                Records for {selectedDateLabel}
              </DialogTitle>
              <DialogDescription>
                Detailed clocking records for this day.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 overflow-hidden border rounded-xl bg-background shadow-sm">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Dept</th>
                      <th className="px-4 py-3 font-medium">Time Range</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Work Detail</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedDayRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <MapPin className="h-3 w-3 text-muted-foreground" />
                             {r.department?.name || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDisplay(r.startWorkTime).split(' ')[1]} - {r.endWorkTime ? formatDisplay(r.endWorkTime).split(' ')[1] : "Active"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-primary">
                            {r.totalHours ? `${r.totalHours.toFixed(2)}h` : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground italic text-xs min-w-[150px]">
                          {r.workDetail || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => openEditDialog(r)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => confirmDelete(r.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDayDialogOpen(false)} className="sm:w-32">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Record Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Clock Record</DialogTitle>
              <DialogDescription>
                Update the details for this clocking record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Department
                </label>
                <Select 
                  value={editingRecord?.departmentId} 
                  onValueChange={(val) => setEditingRecord({ ...editingRecord, departmentId: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  value={editingRecord?.startWorkTime}
                  onChange={(e) => setEditingRecord({ ...editingRecord, startWorkTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  End Time
                </label>
                <Input
                  type="datetime-local"
                  value={editingRecord?.endWorkTime}
                  onChange={(e) => setEditingRecord({ ...editingRecord, endWorkTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  Work Detail
                </label>
                <textarea
                  placeholder="What did you work on during this session?"
                  value={editingRecord?.workDetail || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, workDetail: e.target.value })}
                  disabled={isUpdating}
                  className="flex min-h-[100px] w-full rounded-2xl border border-input bg-input/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
