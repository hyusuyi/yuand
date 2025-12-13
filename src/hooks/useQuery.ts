import { useQuery } from "@tanstack/react-query";
import { rq } from "../fetch";
import type { HttpMethod } from "../fetch";
import type { UseQueryResult, UseQueryOptions } from "@tanstack/react-query";

type UseQueryOptionsPartial<TData> = Partial<
  Pick<UseQueryOptions<TData>, "queryFn">
> &
  Omit<UseQueryOptions<TData>, "queryFn">;
interface Options<TData> extends UseQueryOptionsPartial<TData> {
  method?: HttpMethod;
  headers?: Record<string, string>;
  ignoreError?: boolean;
  returnData?: boolean;
  useSignal?: boolean;
  onBefore?: () => void;
  onLogout?: () => void;
}

function useQueryHooks<TData = unknown>(
  options: Options<TData>
): UseQueryResult<TData> {
  const {
    queryKey,
    ignoreError,
    returnData,
    method,
    headers,
    onLogout,
    onBefore,
    useSignal = false,
    ...others
  } = options || {};

  return useQuery<TData>({
    queryKey,
    queryFn: ({ queryKey, signal }) => {
      onBefore?.();
      const [url, json] = queryKey;
      return rq.request(url as string, {
        json,
        returnData,
        method,
        ignoreError,
        signal: useSignal ? signal : undefined,
        headers,
        onLogout,
      });
    },
    ...others,
  });
}
export default useQueryHooks;
