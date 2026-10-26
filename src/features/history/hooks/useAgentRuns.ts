import { useCallback } from "react";

import {
  getAgentRun,
  getAgentRuns,
} from "../../../services/api/agents";
import { useAsyncResource } from "../../../hooks/useAsyncResource";

const loadRuns = (signal: AbortSignal) => getAgentRuns({ signal });

export function useAgentRuns() {
  return useAsyncResource(loadRuns);
}

export function useAgentRunDetails(runId: string) {
  // Memoized on runId so navigating to another run reloads.
  const load = useCallback(
    (signal: AbortSignal) => getAgentRun(runId, { signal }),
    [runId],
  );

  return useAsyncResource(load);
}
