"use client";

import { AppShell } from "@/components/app-shell";
import { TasksContent } from "@/components/tasks-content";

export default function TasksPage() {
  return (
    <AppShell>
      <TasksContent />
    </AppShell>
  );
}
