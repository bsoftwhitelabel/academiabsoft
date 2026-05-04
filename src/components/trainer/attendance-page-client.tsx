"use client";

import { useState, useMemo } from "react";
import { AttendanceSummary } from "./attendance-summary";
import { AttendanceList } from "./attendance-list";
import {
  type AttendanceSession,
  computeAttendanceMetrics,
} from "@/lib/mock-data";

type Props = { session: AttendanceSession };

type Filter = "all" | "present" | "absent";

export function AttendancePageClient({ session }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const metrics = useMemo(() => computeAttendanceMetrics(session), [session]);

  const filteredTrainees = useMemo(() => {
    if (filter === "present") {
      return session.trainees.filter(
        (t) =>
          t.status === "PRESENT" ||
          t.status === "CHECKED_IN" ||
          t.status === "MANUAL_PRESENT" ||
          t.status === "EARLY_LEAVE"
      );
    }
    if (filter === "absent") {
      return session.trainees.filter(
        (t) => t.status === "ABSENT" || t.status === "PENDING"
      );
    }
    return session.trainees;
  }, [filter, session.trainees]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <AttendanceSummary
        metrics={metrics}
        activeFilter={filter}
        onFilterChange={setFilter}
      />
      <AttendanceList trainees={filteredTrainees} />
    </div>
  );
}
