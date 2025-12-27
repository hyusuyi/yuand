import { useRequest } from "ahooks";
import { rq } from "../fetch";
import { isObject } from "../utils/util";
import type { HttpClientConfig, RequestOptions, HttpMethod } from "../fetch";
import type { Result, Service } from "ahooks/lib/useRequest/src/types";
import type { Options } from "ahooks/lib/useRequest/src/types";

export interface UseFetchOption<TData = any> extends Options<TData, any[]> {
  ignoreError?: boolean;
  returnData?: boolean;
  json?: unknown;
  data?: unknown;
  method?: HttpMethod;
  headers?: HeadersInit;
  onLogout?: (error: any) => any;
}

const useFetch = <TData = any>(
  url: string,
  options?: UseFetchOption<TData>
): Result<TData, any[]> => {
  const { ignoreError, returnData, method, json, data, headers, onLogout, ...others } =
    options || {};
  let body = json ?? data;

  const fetcher: Service<any, any> = (fetcherData?: unknown, fetcherOptions?: RequestOptions) => {
    if (isObject(fetcherData) && Object.prototype.hasOwnProperty.call(fetcherData, "nativeEvent")) {
      fetcherData = undefined;
    }
    body = fetcherData ?? body;
    fetcherOptions = fetcherOptions ?? {};
    fetcherOptions = {
      json: body,
      returnData,
      method,
      ignoreError,
      headers,
      onLogout,
      ...fetcherOptions,
    };
    return rq.request(url, fetcherOptions);
  };

  return useRequest(fetcher, others);
};
useFetch.config = (options: HttpClientConfig = {}) => {
  rq.config(options);
};
export default useFetch;
