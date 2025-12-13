import type {
  FormInstance,
  TableColumnType,
  TableProps,
  FormProps,
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
  //执行搜索
  run: () => void;
  //清除列表数据
  clear: () => void;
  //api 刷新会保留当前所有搜索参数
  refresh: () => void;
  //重置所有参数并搜索,仅在传入form时生效
  reset: () => void;
  //排序  table.sortOrder('列名')
  sortOrder: (key: string) => any;
  update: () => void;
  form?: FormInstance;
}

interface FormOptions extends Omit<FormProps, "form" | "title"> {
  //form左侧标题
  title?: React.ReactNode;
  //form items 表单项
  /** @deprecated 此属性已废弃，请使用新的formItem属性代替 */
  items?: React.ReactNode | React.ReactNode[];
  formItem?: React.ReactNode | React.ReactNode[];
  //扩展内容  放在查询，重置 后方
  extra?: React.ReactNode;
  //表单右侧ui
  right?: React.ReactNode;
  //onfinish完成后处理表单值,必需返回值,如果返回false, 则后续不再执行
  handleValues?: (values: Record<string, any>) => any;
  //是否在点击重置按钮后自动提交表单重新搜索，默认true
  reset?: boolean;
  //重置前操作,如果返回false, 则后续不再执行
  onResetBefore?: () => void | boolean;
  //数据列表表单属性 antd from props
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
  //api config  request 配置方式
  request?: {
    url?: string;
    method?: HttpMethod;
    params?: RecordType;
    //  发送前处理
    onBefore?: () => any;
    // 请求成功后处理
    onSuccess?: (data: Tdata) => any;
  };
  //Table.useTable()实例,  返回状态库，常用方法
  table: TableInstance<Tdata> | null;
  // rowKey: string | ((record: RecordType, index?: number) => string);
  //antd locale 国际化
  locale?: Record<string, any>;
  //后端数据列表的键名，例如：'data'、'list.data'   {code: 0, data: {  }, message: '11'}, 默认使用的是data
  dataKey?: string;
  //总量的键名，例如：'total'、'list.total'   {code: 0, total: '11'}, 默认使用 total
  totalKey?: string;
  //是否手动发送请求 为false时手动调用table.run();
  manual?: boolean;
  //是否不含className
  nostyle?: boolean;
  //antd table columns 支持函数返回一个列数组:参数data api返回数据,  一般使用function 时用于根据data，动态生成列
  columns:
    | ((data: Tdata) => TableColumnType<unknown>[])
    | TableColumnType<unknown>[];
  //search表单form配置
  form?: FormOptions;
  //统计提示
  alert?: React.ReactNode | ((data: Tdata) => React.ReactNode);
  //操作按钮组,独立成一行
  toolbar?: React.ReactNode;
  pageSizeOptions?: number[];
  pagination?: {
    showQuickJumper?: boolean;
    showSizeChanger?: boolean;
    hideOnSinglePage?: boolean;
  };
  loadingDelay?: number;
}

export interface UseTableProps {
  page?: number;
  size?: number;
  sorter?: SorterType;
}

export interface TableRef {
  form: FormInstance;
  useStore: UseStoreType<any>;
  run: () => void;
  clear: () => void;
  refresh: () => void;
  reset: () => void;
  sortOrder: (key: string) => "ascend" | "descend" | null;
  update: () => void;
}

export interface ProTableConfigOptions {
  getQuery?: (data: GetQueryProps) => Record<string, unknown>;
  pageSizeOptions?: number[];
}
