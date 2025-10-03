'use client';

import { useReplayQueue } from "../../hooks/useReplayQueue";

export default function ReplayQueueProvider() {
  useReplayQueue();
  return null; // This component doesn't render anything
}
