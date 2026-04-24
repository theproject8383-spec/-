"use client";

import { useState } from "react";
import useSWR from "swr";
import { isPast, parseISO, isThisWeek, isThisMonth, isThisYear, startOfDay } from "date-fns";
import { Flame, TrendingUp, Target, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTasks, Task } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const fetcher = () => getTasks({ limit: 1000 });

type TimeFilter = "week" | "month" | "year";

export function InsightsContent() {
  const { data, isLoading } = useSWR("insights-tasks", fetcher);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");

  const tasks = data?.data?.tasks || [];

  // Filter tasks based on selected time period
  const filterByTime = (task: Task) => {
    if (!task.createdAt) return false;
    const date = parseISO(task.createdAt);
    switch (timeFilter) {
      case "week":
        return isThisWeek(date, { weekStartsOn: 6 }); // Saturday start for Arabic
      case "month":
        return isThisMonth(date);
      case "year":
        return isThisYear(date);
      default:
        return true;
    }
  };

  const filteredTasks = tasks.filter(filterByTime);
  const completedTasks = filteredTasks.filter((t: Task) => t.status === "done");
  const pendingTasks = filteredTasks.filter((t: Task) => t.status === "pending");
  const overdueTasks = pendingTasks.filter(
    (t: Task) => t.deadline && isPast(parseISO(t.deadline))
  );

  // Calculate completion rate
  const completionRate = filteredTasks.length > 0 
    ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
    : 0;

  // Calculate streak (consecutive days with at least one completed task)
  const calculateStreak = () => {
    const completedDates = tasks
      .filter((t: Task) => t.status === "done" && t.updatedAt)
      .map((t: Task) => startOfDay(parseISO(t.updatedAt!)).getTime())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => b - a);

    if (completedDates.length === 0) return 0;

    let streak = 1;
    const today = startOfDay(new Date()).getTime();
    const msPerDay = 24 * 60 * 60 * 1000;

    // Check if streak is still active (completed something today or yesterday)
    if (completedDates[0] < today - msPerDay) return 0;

    for (let i = 1; i < completedDates.length; i++) {
      if (completedDates[i - 1] - completedDates[i] === msPerDay) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // Priority distribution data
  const priorityData = [
    { name: "عالية", value: filteredTasks.filter((t: Task) => t.priority === "high").length, color: "#ef4444" },
    { name: "متوسطة", value: filteredTasks.filter((t: Task) => t.priority === "medium").length, color: "#f59e0b" },
    { name: "منخفضة", value: filteredTasks.filter((t: Task) => t.priority === "low").length, color: "#10b981" },
  ];

  // Weekly completion data (last 7 days)
  const getWeeklyData = () => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = startOfDay(date);
      
      const completed = tasks.filter((t: Task) => {
        if (!t.updatedAt || t.status !== "done") return false;
        const taskDate = startOfDay(parseISO(t.updatedAt));
        return taskDate.getTime() === dayStart.getTime();
      }).length;

      const created = tasks.filter((t: Task) => {
        if (!t.createdAt) return false;
        const taskDate = startOfDay(parseISO(t.createdAt));
        return taskDate.getTime() === dayStart.getTime();
      }).length;

      data.push({
        name: days[date.getDay()],
        مكتملة: completed,
        جديدة: created,
      });
    }

    return data;
  };

  const weeklyData = getWeeklyData();

  // Category distribution
  const categoryData = filteredTasks.reduce((acc: Record<string, number>, task: Task) => {
    const category = task.category || "بدون تصنيف";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    المهام: value,
  }));

  const timeFilterLabels: Record<TimeFilter, string> = {
    week: "هذا الأسبوع",
    month: "هذا الشهر",
    year: "هذه السنة",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
            الإنجازات والتقدم
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            تابع تقدمك وإنجازاتك في تحقيق أهدافك
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 self-start md:self-auto">
          {(["week", "month", "year"] as TimeFilter[]).map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "h-9 md:h-8 px-3 text-xs md:text-sm",
                timeFilter === filter && "bg-gradient-to-l from-emerald-500 to-cyan-500 text-white"
              )}
            >
              {timeFilterLabels[filter]}
            </Button>
          ))}
        </div>
      </div>

      {/* Streak Card - Prominent */}
      <Card className="border-border bg-gradient-to-l from-orange-500/10 via-red-500/10 to-amber-500/10 border-orange-500/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={cn(
                "flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-xl md:rounded-2xl shrink-0",
                streak > 0 
                  ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30 animate-pulse" 
                  : "bg-muted"
              )}>
                <Flame className={cn("h-6 w-6 md:h-8 md:w-8", streak > 0 ? "text-white" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">سلسلة الإنجاز المتواصل</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-3xl md:text-5xl font-bold",
                    streak > 0 ? "text-orange-500" : "text-muted-foreground"
                  )}>
                    {streak}
                  </span>
                  <span className="text-sm md:text-lg text-muted-foreground">يوم متواصل</span>
                </div>
                {streak > 0 && (
                  <p className="text-xs md:text-sm text-orange-500 mt-1">استمر! أنت تبلي بلاءً حسناً</p>
                )}
              </div>
            </div>
            {streak >= 7 && (
              <div className="text-center hidden sm:block">
                <div className="text-3xl md:text-4xl">🔥</div>
                <p className="text-xs text-orange-500 mt-1">أسبوع كامل!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - 2 cols on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">إجمالي المهام</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">{filteredTasks.length}</p>
              </div>
              <div className="rounded-full p-2 md:p-3 bg-violet-500/10 w-fit">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">مكتملة</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-500 mt-1 md:mt-2">{completedTasks.length}</p>
              </div>
              <div className="rounded-full p-2 md:p-3 bg-emerald-500/10 w-fit">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">نسبة الإنجاز</p>
                <p className="text-2xl md:text-3xl font-bold text-cyan-500 mt-1 md:mt-2">{completionRate}%</p>
              </div>
              <div className="rounded-full p-2 md:p-3 bg-cyan-500/10 w-fit">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">متأخرة</p>
                <p className={cn(
                  "text-2xl md:text-3xl font-bold mt-1 md:mt-2",
                  overdueTasks.length > 0 ? "text-red-500" : "text-foreground"
                )}>
                  {overdueTasks.length}
                </p>
              </div>
              <div className="rounded-full p-2 md:p-3 bg-red-500/10 w-fit">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Stack on mobile */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-foreground text-base md:text-lg">النشاط الأسبوعي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={50} fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="مكتملة" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="جديدة" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-foreground text-base md:text-lg">توزيع الأولويات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] md:h-[300px] flex items-center justify-center">
              {filteredTasks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">لا توجد بيانات كافية</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Chart */}
      {categoryChartData.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-foreground text-base md:text-lg">المهام حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] md:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="المهام" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
