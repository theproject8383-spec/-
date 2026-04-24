"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, parseISO, isToday, isThisWeek, isThisMonth, isThisYear } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Plus,
  Filter,
  ArrowUpDown,
  Check,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTasks, updateTask, deleteTask, Task, TaskFilters } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/task-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly" | "all";

export function TasksContent() {
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const fetcher = () => getTasks(filters);
  const { data, error, isLoading, mutate } = useSWR(
    ["tasks", JSON.stringify(filters)],
    fetcher
  );

  const allTasks = data?.data?.tasks || [];
  
  // Filter by time period
  const filterByTime = (task: Task) => {
    if (timeFilter === "all") return true;
    const deadline = task.deadline ? parseISO(task.deadline) : null;
    const created = task.createdAt ? parseISO(task.createdAt) : null;
    const dateToCheck = deadline || created;
    if (!dateToCheck) return timeFilter === "all";
    
    switch (timeFilter) {
      case "daily":
        return isToday(dateToCheck);
      case "weekly":
        return isThisWeek(dateToCheck, { weekStartsOn: 6 });
      case "monthly":
        return isThisMonth(dateToCheck);
      case "yearly":
        return isThisYear(dateToCheck);
      default:
        return true;
    }
  };

  const tasks = allTasks.filter(filterByTime);
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / (filters.limit || 10));

  const handleStatusToggle = async (task: Task) => {
    try {
      await updateTask(task.id, {
        status: task.status === "done" ? "pending" : "done",
      });
      mutate();
    } catch {
      console.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTask(deleteId);
      setDeleteId(null);
      mutate();
    } catch {
      console.error("Failed to delete task");
    }
  };

  const handleInlineEdit = async (task: Task) => {
    if (!editTitle.trim() || editTitle === task.title) {
      setEditingTask(null);
      return;
    }
    try {
      await updateTask(task.id, { title: editTitle });
      setEditingTask(null);
      mutate();
    } catch {
      console.error("Failed to update task");
    }
  };

  const handleExportICS = async () => {
    setIsExporting(true);
    try {
      const tasksWithDeadlines = tasks.filter((t: Task) => t.deadline && t.status === "pending");
      
      if (tasksWithDeadlines.length === 0) {
        alert("لا توجد مهام بمواعيد نهائية للتصدير");
        return;
      }

      let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//مسبار//Task Manager//AR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ];

      tasksWithDeadlines.forEach((task: Task) => {
        const deadline = parseISO(task.deadline!);
        const dtStart = format(deadline, "yyyyMMdd'T'HHmmss");
        const dtEnd = format(new Date(deadline.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");
        const uid = `task-${task.id}@misbar.app`;
        const priority = task.priority === "high" ? 1 : task.priority === "medium" ? 5 : 9;

        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${task.title}`,
          task.description ? `DESCRIPTION:${task.description}` : "",
          task.category ? `CATEGORIES:${task.category}` : "",
          `PRIORITY:${priority}`,
          "END:VEVENT"
        );
      });

      icsContent.push("END:VCALENDAR");

      const blob = new Blob([icsContent.filter(Boolean).join("\r\n")], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `misbar-tasks-${format(new Date(), "yyyy-MM-dd")}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const priorityColors = {
    low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    high: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const priorityLabels = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
  };

  const timeFilterLabels: Record<TimeFilter, string> = {
    daily: "يومي",
    weekly: "أسبوعي",
    monthly: "شهري",
    yearly: "سنوي",
    all: "الكل",
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">فشل في تحميل المهام</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">المهام</h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            إدارة وتنظيم مهامك
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportICS}
            disabled={isExporting}
            className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 h-11 md:h-10 flex-1 sm:flex-none"
          >
            {isExporting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="ml-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">تصدير للتقويم (.ics)</span>
            <span className="sm:hidden">تصدير</span>
          </Button>
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="bg-gradient-to-l from-emerald-500 to-cyan-500 h-11 md:h-10 flex-1 sm:flex-none"
          >
            <Plus className="ml-2 h-4 w-4" />
            <span className="hidden sm:inline">إضافة مهمة</span>
            <span className="sm:hidden">إضافة</span>
          </Button>
        </div>
      </div>

      {/* Time Filter Tabs */}
      <Card className="border-border bg-card">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
            <ScrollArea className="w-full">
              <div className="flex items-center gap-1 md:gap-2 bg-background border border-border rounded-lg p-1">
                {(["daily", "weekly", "monthly", "yearly", "all"] as TimeFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={timeFilter === filter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeFilter(filter)}
                    className={cn(
                      "min-w-[60px] md:min-w-[70px] h-9 md:h-8 px-2 md:px-3 text-xs md:text-sm whitespace-nowrap",
                      timeFilter === filter && "bg-gradient-to-l from-emerald-500 to-cyan-500 text-white"
                    )}
                  >
                    {timeFilterLabels[filter]}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">تصفية:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.status || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    status: v === "all" ? undefined : (v as "pending" | "done"),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-[130px] bg-background h-10">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="done">مكتملة</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority || "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    priority: v === "all" ? undefined : (v as "low" | "medium" | "high"),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-[130px] bg-background h-10">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأولويات</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                    ترتيب
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() =>
                      setFilters((f) => ({ ...f, sortBy: "createdAt", sortOrder: "desc" }))
                    }
                  >
                    الأحدث أولاً
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setFilters((f) => ({ ...f, sortBy: "createdAt", sortOrder: "asc" }))
                    }
                  >
                    الأقدم أولاً
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setFilters((f) => ({ ...f, sortBy: "priority", sortOrder: "desc" }))
                    }
                  >
                    الأولوية (عالية أولاً)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setFilters((f) => ({ ...f, sortBy: "deadline", sortOrder: "asc" }))
                    }
                  >
                    الموعد النهائي (الأقرب)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(filters.status || filters.priority) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      status: undefined,
                      priority: undefined,
                      page: 1,
                    }))
                  }
                >
                  مسح التصفية
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center justify-between text-foreground text-base md:text-lg">
            <span>جميع المهام</span>
            <span className="text-sm font-normal text-muted-foreground">
              {tasks.length} مهمة
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">لا توجد مهام</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setDialogOpen(true)}
              >
                أضف مهمتك الأولى
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task: Task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border border-border bg-background p-3 md:p-4 transition-colors hover:bg-accent/50 md:flex-row md:items-center md:gap-4",
                    task.status === "done" && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3 md:items-center">
                    <Checkbox
                      checked={task.status === "done"}
                      onCheckedChange={() => handleStatusToggle(task)}
                      className="mt-0.5 md:mt-0 h-5 w-5"
                    />

                    <div className="flex-1 min-w-0">
                      {editingTask?.id === task.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleInlineEdit(task);
                              if (e.key === "Escape") setEditingTask(null);
                            }}
                            className="flex-1 h-9"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleInlineEdit(task)}
                            className="h-9 w-9"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingTask(null)}
                            className="h-9 w-9"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p
                            className={cn(
                              "font-medium truncate text-sm md:text-base",
                              task.status === "done"
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mr-8 md:mr-0 md:justify-end">
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.deadline && (
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(task.deadline), "d MMM", { locale: arSA })}
                        </span>
                      )}
                      {task.category && (
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                          {task.category}
                        </Badge>
                      )}
                      <Badge className={cn("text-xs", priorityColors[task.priority])}>
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingTask(task);
                          setEditTitle(task.title);
                        }}
                        className="h-9 w-9 md:h-8 md:w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(task.id)}
                        className="h-9 w-9 md:h-8 md:w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-xs md:text-sm text-muted-foreground">
                صفحة {filters.page} من {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) >= totalPages}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))
                  }
                  className="h-9 w-9 p-0 md:h-8 md:w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) <= 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))
                  }
                  className="h-9 w-9 p-0 md:h-8 md:w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => mutate()}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المهمة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
