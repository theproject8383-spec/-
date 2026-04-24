"use client";

import { useState } from "react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { CalendarIcon, Compass, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createTask, parseTasks, Task } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editTask?: Task;
}

export function TaskDialog({ open, onOpenChange, onSuccess, editTask }: TaskDialogProps) {
  const [title, setTitle] = useState(editTask?.title || "");
  const [description, setDescription] = useState(editTask?.description || "");
  const [deadline, setDeadline] = useState<Date | undefined>(
    editTask?.deadline ? new Date(editTask.deadline) : undefined
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    editTask?.priority || "medium"
  );
  const [category, setCategory] = useState(editTask?.category || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Parse state
  const [parseText, setParseText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]>([]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline(undefined);
    setPriority("medium");
    setCategory("");
    setParseText("");
    setParsedTasks([]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({
        title,
        description: description || null,
        deadline: deadline?.toISOString() || null,
        priority,
        category: category || null,
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      console.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParse = async () => {
    if (!parseText.trim()) return;
    setIsParsing(true);
    try {
      const response = await parseTasks(parseText);
      if (response.success && response.data.tasks) {
        setParsedTasks(response.data.tasks);
      }
    } catch {
      console.error("Failed to parse tasks");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddParsedTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createTask(task);
      setParsedTasks((prev) => prev.filter((t) => t.title !== task.title));
      onSuccess?.();
    } catch {
      console.error("Failed to add task");
    }
  };

  const handleAddAllParsed = async () => {
    setIsSubmitting(true);
    try {
      for (const task of parsedTasks) {
        await createTask(task);
      }
      setParsedTasks([]);
      setParseText("");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      console.error("Failed to add tasks");
    } finally {
      setIsSubmitting(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] bg-card border-border overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-foreground text-base md:text-lg">إضافة مهمة جديدة</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="manual" className="text-xs md:text-sm">إدخال يدوي</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs md:text-sm">
              <Compass className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
              تحليل ذكي
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            <TabsContent value="manual" className="space-y-4 mt-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">العنوان</Label>
                <Input
                  id="title"
                  placeholder="عنوان المهمة"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background h-11 md:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">الوصف</Label>
                <Textarea
                  id="description"
                  placeholder="وصف اختياري"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">الموعد النهائي</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal h-11 md:h-10",
                          !deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP", { locale: arSA }) : "اختر تاريخاً"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">الأولوية</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                    <SelectTrigger className="bg-background h-11 md:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm">التصنيف</Label>
                <Input
                  id="category"
                  placeholder="مثال: عمل، شخصي، صحة"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-background h-11 md:h-10"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-start gap-2 sm:gap-3 pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !title.trim()}
                  className="h-11 md:h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    "إضافة المهمة"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="h-11 md:h-10"
                >
                  إلغاء
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="parseText" className="text-sm">صِف مهامك بلغة طبيعية</Label>
                <Textarea
                  id="parseText"
                  placeholder="مثال: ذاكر للامتحان يوم الإثنين واتصل بالطبيب غداً صباحاً"
                  value={parseText}
                  onChange={(e) => setParseText(e.target.value)}
                  className="min-h-[100px] bg-background"
                />
              </div>

              <Button 
                onClick={handleParse} 
                disabled={isParsing || !parseText.trim()}
                className="w-full bg-gradient-to-l from-emerald-500 to-cyan-500 h-11 md:h-10"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Compass className="ml-2 h-4 w-4" />
                    تحليل المهام
                  </>
                )}
              </Button>

              {parsedTasks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">المهام المستخرجة</Label>
                    <Button 
                      size="sm" 
                      onClick={handleAddAllParsed} 
                      disabled={isSubmitting}
                      className="h-9"
                    >
                      إضافة الكل ({parsedTasks.length})
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {parsedTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={cn("text-xs", priorityColors[task.priority])}>
                              {priorityLabels[task.priority]}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline" className="text-xs">
                                {task.category}
                              </Badge>
                            )}
                            {task.deadline && (
                              <span className="text-xs text-muted-foreground">
                                الموعد: {format(new Date(task.deadline), "d MMM", { locale: arSA })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddParsedTask(task)}
                          className="h-9 w-full sm:w-auto"
                        >
                          إضافة
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
