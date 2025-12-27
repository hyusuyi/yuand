import type {
  FormInstance,
  TableColumnType,
  TableProps,
  FormProps,
  PaginationProps,
} from "antd";
import type { HttpMethod } from "../../fetch";
import type { UseBoundStore, StoreApi } from "zustand";
import type { GetQueryProps } from "../../utils/table";

type RecordType = Record<string, any>;

interface SorterType {
  field?: string;
  order?: "ascend" | "descend";
}
export interface TableState<TData = any> {
  page: number;
  size: number;
  sorter: SorterType;
  data: TData;
  search: RecordType | null | undefined;
  params: any[] | Record<string, any> | null | undefined;
  setState: (values: Partial<TableState>) => void;
  ready: boolean;
}

type UseStoreType<TData> = UseBoundStore<StoreApi<TableState<TData>>>;
export interface TableInstance<TData = any> {
  useStore: UseStoreType<TData>;
  //useQuery : queryKey
  queryKey: any[];
  //开始搜索
  run: () => void;
  //清除列表数据
  clear: () => void;
  //刷新请求并保留当前所有搜索参数 queryKey不变
  refresh: () => void;
  //重置所有参数并搜索,仅在配置form属性时生效
  reset: () => void;
  update: () => void;
  //重置store状态
  resetStore: () => void;
  form?: FormInstance;
}

interface FormOptions extends Omit<FormProps, "form" | "title" | "children"> {
  //form左侧标题
  title?: React.ReactNode;
  //form items 表单项
  items?: React.ReactNode | React.ReactNode[];
  //扩展内容  放在查询，重置 后方
  extra?: React.ReactNode;
  //表单右侧ui
  right?: React.ReactNode;
  //重置前操作,如果返回false, 则后续不再执行
  reset?: boolean;
  //onfinish完成后处理表单值,必需返回值,如果返回false, 则后续不再执行
  handleValues?: (values: Record<string, any>) => any;
  //是否在点击重置按钮后自动提交表单重新搜索，默认true
  onResetBefore?: () => void | boolean;
  //table表数据 插入antd form，配置
  dataForm?: FormProps;
}

export interface ProTableProps<Tdata = any>
  extends Omit<TableProps<Tdata>, "columns"> {
  classNames?: {
    root?: string;
    form?: string;
    table?: string;
  };
  styles?: {
    root?: React.CSSProperties;
    form?: React.CSSProperties;
    table?: React.CSSProperties;
    toolbar?: React.CSSProperties;
  };
  /** API 请求配置 */
  request: {
    /** 请求地址方法 */
    url?: string;
    /** 手动调用发送 table.run */
    manual?: boolean;
    method?: HttpMethod;
    /** 请求额外参数 */
    params?: Record<string, any>;
    onBefore?: () => any;
    onSuccess?: (data: any) => any;
  };
  //Table.useTable()实例,  返回状态库，常用方法
  table: TableInstance<Tdata> | null;
  //antd locale 国际化
  locale?: Record<string, any>;
  //后端数据列表的键名，例如：'data'、'list.data'   {code: 0, data: {  }, message: '11'}, 默认使用的是data
  dataKey?: string;
  //总量的键名，例如：'total'、'list.total'   {code: 0, total: '11'}, 默认使用 total
  totalKey?: string;
  //是否不含className
  nostyle?: boolean;
  //antd table columns 支持函数返回一个列数组:参数data api返回数据,  一般使用function 时用于根据data，动态生成列
  columns:
    | ((data: Tdata) => TableColumnType<unknown>[])
    | TableColumnType<unknown>[];
  //搜索表单form配置
  form?: FormOptions;
  //统计栏位渲染
  alert?: React.ReactNode | ((data: Tdata) => React.ReactNode);
  //功能操作按钮渲染
  toolbar?: React.ReactNode;
  pagination?: PaginationProps;
  //开启后 useStore()会返回 api data数据
  useData?: boolean;
}

export interface UseTableProps {
  page?: number;
  size?: number;
  sorter?: SorterType;
}

export interface ProTableConfigOptions {
  getQuery?: (data: GetQueryProps) => Record<string, unknown>;
  pageSizeOptions?: number[];
}
