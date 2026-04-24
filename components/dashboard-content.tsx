"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, isPast, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { 
  ListTodo, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  Compass
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getTasks, createTask, Task } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/task-dialog";

const fetcher = () => getTasks({ limit: 100 });

export function DashboardContent() {
  const { data, error, isLoading, mutate } = useSWR("dashboard-tasks", fetcher);
  const [quickTask, setQuickTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tasks = data?.data?.tasks || [];

  // Calculate stats
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t: Task) => t.status === "pending").length;
  const doneTasks = tasks.filter((t: Task) => t.status === "done").length;
  const overdueTasks = tasks.filter(
    (t: Task) => t.status === "pending" && t.deadline && isPast(parseISO(t.deadline))
  ).length;

  const recentTasks = tasks.slice(0, 5);

  const handleQuickAdd = async () => {
    if (!quickTask.trim()) return;
    setIsAdding(true);
    try {
      await createTask({ title: quickTask, priority: "medium" });
      setQuickTask("");
      mutate();
    } catch {
      console.error("Failed to add task");
    } finally {
      setIsAdding(false);
    }
  };

  const stats = [
    {
      label: "إجمالي المهام",
      value: totalTasks,
      icon: ListTodo,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "قيد الانتظار",
      value: pendingTasks,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "مكتملة",
      value: doneTasks,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "متأخرة",
      value: overdueTasks,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">فشل في تحميل المهام</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground">
          مرحباً بك! إليك نظرة عامة على مهامك.
        </p>
      </div>

      {/* Stats Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 md:block">
                  <div className={cn("rounded-full p-2 md:hidden", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">
                      {isLoading ? "-" : stat.value}
                    </p>
                  </div>
                </div>
                <div className={cn("rounded-full p-3 hidden md:block", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Add */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-foreground text-base md:text-lg">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            إضافة مهمة سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="ما الذي يجب القيام به؟"
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              className="flex-1 bg-background h-11 md:h-10"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleQuickAdd} 
                disabled={isAdding || !quickTask.trim()}
                className="flex-1 md:flex-none h-11 md:h-10"
              >
                {isAdding ? "جاري الإضافة..." : "إضافة"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(true)}
                className="flex-1 md:flex-none h-11 md:h-10"
              >
                <Compass className="ml-2 h-4 w-4" />
                <span className="hidden sm:inline">تفاصيل أكثر</span>
                <span className="sm:hidden">المزيد</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground text-base md:text-lg">المهام الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ListTodo className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">لا توجد مهام بعد</p>
              <p className="text-sm text-muted-foreground">
                أضف مهمتك الأولى أعلاه أو استخدم محادثة الذكاء الاصطناعي
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 md:p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full mt-1.5 md:mt-0 shrink-0",
                        task.status === "done" ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-medium text-sm md:text-base",
                          task.status === "done"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.deadline && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                          الموعد: {format(parseISO(task.deadline), "d MMM yyyy", { locale: arSA })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mr-6 md:mr-0">
                    {task.category && (
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", priorityColors[task.priority])}>
                      {priorityLabels[task.priority]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
