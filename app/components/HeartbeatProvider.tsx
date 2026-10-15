"use client";

import { useHeartbeat } from "@/lib/useHeartbeat";

export default function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  useHeartbeat();
  return <>{children}</>;
}
