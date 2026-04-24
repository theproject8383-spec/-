"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Send,
  Compass,
  Bot,
  User,
  Check,
  Loader2,
  Pencil,
  Trash2,
  Paperclip,
  X,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sendChatMessage, Task } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionsPerformed?: {
    created: Task[];
    updated: Task[];
    deleted: number[];
  };
  needsClarification?: boolean;
  attachment?: {
    name: string;
    type: string;
  };
}

export function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "أهلاً! أنا مِسبار، مساعدك الذكي للتخطيط الاستراتيجي. أخبرني بمهامك وسأساعدك في تنظيمها وجدولتها. جرّب شيئاً مثل: \"ذكرني بالاتصال بالعميل الساعة 6 مساءً وإنهاء التقرير بحلول يوم الجمعة\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || (attachment ? `تم رفع ملف: ${attachment.name}` : ""),
      attachment: attachment ? { name: attachment.name, type: attachment.type } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const currentAttachment = attachment;
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true);

    try {
      // If there's an attachment, we would handle it here
      // For now, we'll send the text message and indicate there was an attachment
      const messageContent = currentAttachment 
        ? `${input}\n\n[مرفق: ${currentAttachment.name}]`
        : input;
      
      const response = await sendChatMessage(messageContent);

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.reply,
          actionsPerformed: response.data.actions_performed,
          needsClarification: response.data.needs_clarification,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "عذراً، واجهت صعوبة في فهم ذلك. هل يمكنك المحاولة مرة أخرى؟",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
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
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)] overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3">
            <Compass className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
            محادثة الذكاء الاصطناعي
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            صِف مهامك بشكل طبيعي وسأساعدك في تنظيمها
          </p>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-border bg-card overflow-hidden min-h-0">
          <CardHeader className="border-b border-border py-3 md:py-4 shrink-0">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bot className="h-4 w-4" />
              مساعد مِسبار الذكي
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
            <div className="space-y-4 md:space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 md:gap-3",
                    message.role === "user" ? "justify-start" : "justify-end"
                  )}
                >
                  {message.role === "user" && (
                    <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[80%] space-y-2 md:space-y-3",
                      message.role === "user" ? "items-start" : "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 md:px-4 md:py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.attachment && (
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{message.attachment.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Performed */}
                    {message.actionsPerformed && !message.needsClarification && (
                      <div className="space-y-2 md:space-y-3 w-full">
                        {/* Created Tasks */}
                        {message.actionsPerformed.created.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-500" />
                              تم إنشاء المهام:
                            </p>
                            {message.actionsPerformed.created.map((task) => (
                              <div
                                key={task.id}
                                className="flex flex-col gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 md:p-3 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        priorityColors[task.priority]
                                      )}
                                    >
                                      {priorityLabels[task.priority]}
                                    </Badge>
                                    {task.category && (
                                      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
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
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 w-fit">
                                  <Check className="ml-1 h-3 w-3" />
                                  محفوظة
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Updated Tasks */}
                        {message.actionsPerformed.updated.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Pencil className="h-3 w-3 text-amber-500" />
                              تم تحديث المهام:
                            </p>
                            {message.actionsPerformed.updated.map((task) => (
                              <div
                                key={task.id}
                                className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 md:p-3 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        priorityColors[task.priority]
                                      )}
                                    >
                                      {priorityLabels[task.priority]}
                                    </Badge>
                                    {task.deadline && (
                                      <span className="text-xs text-muted-foreground">
                                        الموعد: {format(new Date(task.deadline), "d MMM", { locale: arSA })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 w-fit">
                                  <Pencil className="ml-1 h-3 w-3" />
                                  محدّثة
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Deleted Tasks */}
                        {message.actionsPerformed.deleted.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Trash2 className="h-3 w-3 text-red-500" />
                              تم حذف المهام:
                            </p>
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 md:p-3">
                              <p className="text-sm text-muted-foreground">
                                تم حذف {message.actionsPerformed.deleted.length} مهمة
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === "assistant" && (
                    <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 md:gap-3 justify-end">
                  <div className="rounded-2xl bg-muted px-3 py-2 md:px-4 md:py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">جاري التفكير...</span>
                    </div>
                  </div>
                  <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600">
                    <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <CardContent className="border-t border-border p-3 md:p-4 shrink-0">
            {/* Attachment Preview */}
            {attachment && (
              <div className="mb-2 md:mb-3 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">{attachment.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={handleRemoveAttachment}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 md:gap-3">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg"
                className="hidden"
              />
              
              {/* Upload button with tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="shrink-0 h-11 w-11 md:h-10 md:w-10"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] md:max-w-[280px] text-center">
                  <p className="text-xs md:text-sm">ارفع جدولك الجامعي أو خطة عملك ليبني الذكاء الاصطناعي خطتك بناءً عليها</p>
                </TooltipContent>
              </Tooltip>

              <Input
                ref={inputRef}
                placeholder="أخبرني بما تريد القيام به..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isLoading}
                className="flex-1 bg-background h-11 md:h-10"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || (!input.trim() && !attachment)}
                className="bg-gradient-to-l from-emerald-500 to-cyan-500 h-11 w-11 md:h-10 md:w-10 p-0"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] md:text-xs text-muted-foreground text-center">
              جرّب: &quot;جدولة اجتماع غداً الساعة 2 ظهراً&quot;
            </p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
