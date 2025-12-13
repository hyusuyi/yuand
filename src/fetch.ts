export const isObject = (oj: unknown) =>
  Object.prototype.toString.call(oj) === "[object Object]";
export const isFunction = (oj: unknown) =>
  Object.prototype.toString.call(oj) === "[object Function]";

const DEFAULT_SUCCESS_CODES = [200] as const;
const DEFAULT_LOGOUT_CODES = [401, 403] as const;
const DEFAULT_METHOD = "GET" as const;
const DEFAULT_CODE_KEY = "code" as const;
const DEFAULT_DATA_KEY = "data" as const;
const DEFAULT_MESSAGE_KEY = "message" as const;
const DEFAULT_CONTENT_TYPE = "application/json;charset=UTF-8";
const BLOB_CONTENT_TYPES = [
  "stream",
  "excel",
  "download",
  "blob",
  "octet-stream",
] as const;
const METHODS_WITHOUT_BODY = ["GET", "HEAD"] as const;

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | undefined;
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type RequestData = unknown;

export interface HttpClientConfig {
  /** 请求的基础 URL */
  baseUrl?: string;
  /** 流数据响应头类型关键字 */
  blobContentTypes?: readonly string[];
  /** 请求头配置 */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** 响应数据状态码的 key，默认: 'code' */
  codeKey?: string;
  /** 响应数据的 data key，默认: 'data' */
  dataKey?: string;
  /** 响应消息的 key，默认: 'message' */
  messageKey?: string;
  /** 是否默认返回 data 层数据，默认: false */
  returnData?: boolean;
  /** 默认请求方法，默认: 'GET' */
  defaultMethod?: HttpMethod;
  /** 请求超时时间(ms)，默认: 30000 */
  timeout?: number;
  /** 状态码配置 */
  codes?: {
    /** 成功状态码列表 */
    success?: readonly number[];
    /** 需要登出的状态码列表 */
    logout?: readonly number[];
    /** 忽略错误的状态码列表 */
    ignoreError?: readonly number[];
  };
  /** 错误处理回调 */
  onError?: (error: HttpError) => void | Promise<void>;
  /** 登出回调 */
  onLogout?: (error: HttpError) => void | Promise<void>;
  onSuccess?: (data: any) => void | Promise<void>;
  /** 请求拦截器 */
  requestInterceptor?: (
    url: string,
    options: RequestInit
  ) => Promise<void> | void;
  /** 响应拦截器 */
  responseInterceptor?: <T>(
    response: HttpResponse<T>
  ) => Promise<HttpResponse<T>> | HttpResponse<T>;
}

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  /** 请求方法 */
  method?: HttpMethod;
  /** 请求体数据(对象会自动转为 JSON) */
  json?: RequestData;
  /** URL 查询参数 */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** 是否忽略当前请求的错误，不触发 onError */
  ignoreError?: boolean;
  /** 是否返回 data 层数据 */
  returnData?: boolean;
  /** 请求超时时间(ms) */
  timeout?: number;
  /** 自定义错误回调(仅本次请求) */
  onError?: (error: HttpError) => void;
  /** 自定义登出回调(仅本次请求) */
  onLogout?: (error: HttpError) => void;
  /** 自定义成功回调(仅本次请求) */
  onSuccess?: (data: any) => void;
}

export interface HttpResponse<T = any> {
  [key: string]: any;
  data?: T;
}

export interface BlobResponse {
  data: Blob;
  filename?: string;
  response: Response;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public code?: number,
    public response?: any,
    public statusCode?: number
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class HttpClient {
  private configure: HttpClientConfig;
  constructor(configure: HttpClientConfig = {}) {
    this.configure = {
      baseUrl: configure.baseUrl ?? "",
      blobContentTypes: configure.blobContentTypes ?? [...BLOB_CONTENT_TYPES],
      headers: configure.headers,
      codeKey: configure.codeKey ?? DEFAULT_CODE_KEY,
      dataKey: configure.dataKey ?? DEFAULT_DATA_KEY,
      messageKey: configure.messageKey ?? DEFAULT_MESSAGE_KEY,
      returnData: configure.returnData ?? false,
      defaultMethod: configure.defaultMethod ?? DEFAULT_METHOD,
      timeout: configure.timeout ?? 30000,
      codes: {
        success: configure.codes?.success ?? [...DEFAULT_SUCCESS_CODES],
        logout: configure.codes?.logout ?? [...DEFAULT_LOGOUT_CODES],
        ignoreError: configure.codes?.ignoreError ?? [],
      },
      onError: configure.onError,
      onLogout: configure.onLogout,
      onSuccess: configure.onSuccess,
      requestInterceptor: configure.requestInterceptor,
      responseInterceptor: configure.responseInterceptor,
    };
  }

  /**
   * 更新客户端配置
   */
  config(configure: HttpClientConfig): void {
    if (!isObject(configure)) {
      throw new TypeError("Config must be an object");
    }
    this.configure = { ...this.configure, ...configure };
  }

  get<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  post<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: "POST" });
  }

  put<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: "PUT" });
  }

  delete<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }

  patch<T = any>(
    url: string,
    options?: Omit<RequestOptions, "method">
  ): Promise<T> {
    return this.request<T>(url, { ...options, method: "PATCH" });
  }

  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      json,
      params,
      ignoreError = false,
      returnData = this.configure.returnData,
      timeout = this.configure.timeout,
      onError,
      onLogout,
      onSuccess,
      ...restOptions
    } = options;

    const fetchOptions: RequestInit = { ...restOptions };

    try {
      // 构建完整 URL
      let fullUrl = this.buildUrl(url);

      // 处理查询参数
      if (params) {
        fullUrl = this.appendParams(fullUrl, params);
      }

      // 设置请求方法
      const method = (
        options.method ?? this.configure.defaultMethod
      ).toUpperCase() as HttpMethod;
      fetchOptions.method = method;

      // 设置请求头
      fetchOptions.headers = await this.buildHeaders(options.headers);

      // 处理请求体
      if (json) {
        if (METHODS_WITHOUT_BODY.includes(method as any)) {
          // GET/HEAD 请求将 json 转为查询参数
          if (isObject(json) && !(json instanceof FormData)) {
            fullUrl = this.appendParams(fullUrl, json as Record<string, any>);
          }
        } else {
          // 其他方法处理 body
          if (json instanceof FormData) {
            (fetchOptions.headers as Headers).delete("Content-Type");
            fetchOptions.body = json;
          } else {
            fetchOptions.body = JSON.stringify(json);
          }
        }
      }

      // 执行请求拦截器
      if (this.configure.requestInterceptor) {
        await this.configure.requestInterceptor(fullUrl, fetchOptions);
      }

      // 发起请求(带超时控制)
      const response = await this.fetchWithTimeout(
        fullUrl,
        fetchOptions,
        timeout
      );

      // 检查 HTTP 状态码
      if (!response.ok) {
        throw new HttpError(
          response.statusText || "Request failed",
          undefined,
          response,
          response.status
        );
      }

      // 处理响应
      const result = await this.handleResponse<T>(
        response,
        returnData,
        ignoreError,
        onSuccess
      );

      // 执行响应拦截器
      if (this.configure.responseInterceptor && isObject(result)) {
        return (await this.configure.responseInterceptor(
          result as HttpResponse<T>
        )) as T;
      }

      return result;
    } catch (error) {
      return this.handleError(error, ignoreError, onError, onLogout);
    }
  }

  /**
   * 构建完整 URL
   */
  private buildUrl(url: string): string {
    if (typeof url !== "string") {
      throw new TypeError("URL must be a string");
    }

    // 如果是完整 URL,直接返回
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const baseUrl = this.configure.baseUrl;
    if (!baseUrl) return url;

    const normalizedBase = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

    return normalizedBase + normalizedUrl;
  }

  /**
   * 添加查询参数
   */
  private appendParams(url: string, params: Record<string, any>): string {
    if (!isObject(params)) {
      throw new TypeError("Params must be an object");
    }

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    if (!queryString) return url;

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${queryString}`;
  }

  /**
   * 构建请求头
   */
  private async buildHeaders(customHeaders?: HeadersInit): Promise<Headers> {
    let baseHeaders: HeadersInit | undefined;

    const configureHeaders = this.configure.headers;

    // 如果是函数,执行获取
    if (configureHeaders && isFunction(configureHeaders)) {
      baseHeaders = await (
        configureHeaders as () => HeadersInit | Promise<HeadersInit>
      )();
    } else if (configureHeaders) {
      baseHeaders = configureHeaders as HeadersInit;
    }

    const headers = new Headers(baseHeaders);

    // 合并自定义请求头
    if (customHeaders) {
      const custom = new Headers(customHeaders);
      custom.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    // 设置默认 Content-Type
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", DEFAULT_CONTENT_TYPE);
    }

    return headers;
  }

  /**
   * 带超时的 fetch 请求
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new HttpError(
          `Request timeout after ${timeout}ms`,
          undefined,
          undefined,
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 处理响应数据
   */
  private async handleResponse<T>(
    response: Response,
    returnData: boolean,
    ignoreError: boolean,
    onSuccess?: (data: any) => void
  ): Promise<T> {
    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";
    const { codeKey, dataKey, messageKey, codes } = this.configure;
    const successCodes = codes.success ?? DEFAULT_SUCCESS_CODES;
    const logoutCodes = codes.logout ?? DEFAULT_LOGOUT_CODES;
    const ignoreErrorCodes = codes.ignoreError ?? [];

    // 处理文件下载(Blob)
    if (
      this.configure.blobContentTypes.some((type) => contentType.includes(type))
    ) {
      const blob = await response.blob();
      const filename = this.extractFilename(response.headers);

      return {
        [codeKey]: successCodes[0],
        data: blob,
        filename,
        response,
      } as T;
    }

    // 处理 JSON 响应
    const data = await response.json();

    // 如果响应没有 code 字段,直接返回
    if (!data.hasOwnProperty(codeKey)) {
      return data as T;
    }

    const code = data[codeKey];
    const message = data[messageKey];

    // 成功响应
    if (successCodes.includes(code)) {
      if (returnData && data.hasOwnProperty(dataKey)) {
        return data[dataKey] as T;
      }
      onSuccess?.(data);
      return data as T;
    }

    // 忽略错误的状态码
    if (ignoreError || ignoreErrorCodes.includes(code)) {
      return data as T;
    }

    // 登出状态码
    if (logoutCodes.includes(code)) {
      throw new HttpError(message || "Unauthorized", code, data);
    }

    // 其他错误状态码
    throw new HttpError(message || "Request failed", code, data);
  }

  /**
   * 从响应头提取文件名
   */
  private extractFilename(headers: Headers): string | undefined {
    const disposition = headers.get("content-disposition");
    if (!disposition) return undefined;

    const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (!matches?.[1]) return undefined;

    let filename = matches[1].replace(/['"]/g, "");
    try {
      filename = decodeURIComponent(filename);
    } catch {
      // 解码失败时使用原始文件名
    }

    return filename;
  }

  /**
   * 统一错误处理
   */
  private handleError(
    error: any,
    ignoreError: boolean,
    customOnError?: (error: HttpError) => void,
    customOnLogout?: (error: HttpError) => void
  ): never {
    const httpError =
      error instanceof HttpError
        ? error
        : new HttpError(error.message || "Unknown error", undefined, error);

    // 不忽略错误时执行回调
    if (!ignoreError) {
      // 登出错误
      const logoutCodes = this.configure.codes?.logout ?? DEFAULT_LOGOUT_CODES;
      if (httpError.code && logoutCodes.includes(httpError.code)) {
        const logoutHandler = customOnLogout ?? this.configure.onLogout;
        logoutHandler?.(httpError);
      }

      // 通用错误处理
      const errorHandler = customOnError ?? this.configure.onError;
      errorHandler?.(httpError);
    }

    throw httpError;
  }
}

// ==================== 工具函数 ====================

/**
 * 下载文件(用于 Blob 响应)
 * @example
 * const response = await http.get('/api/download');
 * downloadfile(response);
 */
export function downloadfile(
  response: BlobResponse | { data: Blob; filename?: string }
): void {
  const { data, filename } = response;

  if (!(data instanceof Blob)) {
    throw new TypeError("Data must be a Blob");
  }

  const url = URL.createObjectURL(data);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename || `download-${Date.now()}`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // 清理
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
export const rq = new HttpClient();
export default HttpClient;
