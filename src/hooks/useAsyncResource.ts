import { useCallback, useEffect, useState } from "react";

interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  errorMessage: string | null;
  reload: () => void;
}

/** Loads a resource on mount (and on reload), aborting stale requests. */
export function useAsyncResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setErrorMessage(null);

    load(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error && error.message.length > 0
            ? error.message
            : "Something went wrong. Try again.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [load, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, isLoading, errorMessage, reload };
}
