import { useCallback } from "react";

import { getAppointments } from "../../services/api/appointments";
import { useAsyncResource } from "../../hooks/useAsyncResource";

/** Appointments for one clinic day (YYYY-MM-DD). Reloads when the day changes. */
export function useAppointments(date: string) {
  const load = useCallback(
    (signal: AbortSignal) => getAppointments(date, { signal }),
    [date],
  );

  return useAsyncResource(load);
}
