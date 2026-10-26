import { useCallback } from "react";

import {
  getMyAppointments,
  getSlots,
} from "../../services/api/patients";
import { useAsyncResource } from "../../hooks/useAsyncResource";

/** The signed-in patient's own appointments. */
export function useMyAppointments() {
  const load = useCallback(
    (signal: AbortSignal) => getMyAppointments({ signal }),
    [],
  );

  return useAsyncResource(load);
}

/** Free slots for one clinic day (YYYY-MM-DD). Reloads when the day changes. */
export function useSlots(date: string) {
  const load = useCallback(
    (signal: AbortSignal) => getSlots(date, { signal }),
    [date],
  );

  return useAsyncResource(load);
}
