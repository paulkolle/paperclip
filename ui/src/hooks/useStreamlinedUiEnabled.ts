import { useContext } from "react";
import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import type { InstanceExperimentalSettings } from "@paperclipai/shared";
import { ApiError } from "@/api/client";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { queryKeys } from "@/lib/queryKeys";

export function resolveStreamlinedUiEnabled(
  settings:
    | Pick<InstanceExperimentalSettings, "enableStreamlinedUi">
    | null
    | undefined,
): boolean {
  return settings?.enableStreamlinedUi !== false;
}

let detachedClient: QueryClient | null = null;
function getDetachedClient(): QueryClient {
  detachedClient ??= new QueryClient();
  return detachedClient;
}

/**
 * The streamlined shell is the default experience. Missing legacy values,
 * loading states, and read failures all fail open so the app never flashes or
 * falls back to the legacy shell unless an instance explicitly opts out.
 */
export function useStreamlinedUiEnabled(): { enabled: boolean; loaded: boolean } {
  const contextClient = useContext(QueryClientContext);
  const query = useQuery(
    {
      queryKey: queryKeys.instance.experimentalSettings,
      queryFn: () => instanceSettingsApi.getExperimental(),
      enabled: contextClient != null,
      // Signed-out visitors get 401/403 here. Retrying only delays the auth
      // gate (and pauses entirely in hidden tabs), so fail fast on auth errors.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && (error.status === 401 || error.status === 403)) &&
        failureCount < 3,
    },
    contextClient ?? getDetachedClient(),
  );

  if (!contextClient) return { enabled: true, loaded: true };

  return {
    enabled: resolveStreamlinedUiEnabled(query.data),
    loaded: query.isFetched,
  };
}
