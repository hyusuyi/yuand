import type { ProTableProps, ProTableConfigOptions } from "./types";
import type { HttpMethod } from "../../fetch";
import { rq } from "../../fetch";
import { I18nContext, t } from "../TableConfig";
import { useShallow } from "zustand/react/shallow";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useContext } from "react";
import { Table, Form, Button, Space, type PaginationProps } from "antd";
import { isObject } from "../../utils/util";
import {
  getDataSource,
  getQuery,
  getTotal,
  formatDate,
  removeEmpty,
} from "../../utils/table";
import useX from "../../hooks/useX";
import useTable from "./useTable";
import "./style.css";

// 统一默认配置管理
type DefaultConfig = {
  classNames: {
    root: string;
    form: string;
    table: string;
  };
  styles: {
    root: React.CSSProperties;
    form: React.CSSProperties;
    table: React.CSSProperties;
    toolbar: React.CSSProperties;
  };
  pagination: PaginationProps;
};
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_CONFIG: DefaultConfig = {
  classNames: {
    root: "main-container",
    form: "search-form",
    table: "main-table",
  },
  styles: {
    root: {},
    form: { display: "flex", justifyContent: "space-between" },
    table: {},
    toolbar: { marginBottom: 15 },
  },
  pagination: {
    showQuickJumper: true,
    showSizeChanger: true,
    hideOnSinglePage: false,
  },
} as const;

const ProTable = <T extends Record<string, any>>(props: ProTableProps<T>) => {
  const {
    request = {},
    classNames = DEFAULT_CONFIG.classNames,
    styles = DEFAULT_CONFIG.styles,
    table,
    locale,
    dataKey = "data",
    totalKey = "total",
    nostyle,
    columns,
    form = {},
    alert,
    toolbar = null,
    pagination = DEFAULT_CONFIG.pagination,
    scroll,
    useData,
    ...prop
  } = props;

  const { lang } = useContext(I18nContext);
  pagination.showTotal ??= (total: number) =>
    `${t("共", lang)} ${total} ${t("条记录", lang)}`;
  pagination.pageSizeOptions ??= ProTable.pageSizeOptions;

  const {
    title: formTitle,
    extra: formExtra,
    right: formRight,
    layout = "inline",
    items: formItems,
    reset: formReset,
    dataForm,
    handleValues: formHandleValues,
    onResetBefore: formOnResetBefore,
    ...otherFormProps
  } = form;
  const forceKey = useRef(0);
  const queryClient = useQueryClient();
  const { page, size, sorter, search, ready, setState } = table.useStore(
    useShallow((state) => {
      return {
        page: state.page,
        size: state.size,
        sorter: state.sorter,
        search: state.search,
        ready: state.ready,
        setState: state.setState,
      };
    })
  );

  const queryKey = useMemo(
    () => [
      request.url,
      ProTable.getQuery({
        page,
        size,
        sorter,
        search,
        params: request.params,
      }),
      forceKey.current,
    ],
    [request, page, size, sorter, search]
  );
  const {
    data = {},
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async ({ queryKey }) => {
      if (!request.url) return Promise.resolve({});
      request.onBefore?.();
      const [url, json] = queryKey as [string, any];
      const lowerMethod = request.method?.toLocaleUpperCase() as HttpMethod;
      return rq.request(url, {
        method: lowerMethod,
        json,
        onSuccess: request.onSuccess,
      });
    },
    enabled: ready,
  });

  useEffect(() => {
    if (useData) {
      setState({
        data,
      });
    }
  }, [data, useData]);

  const { dataSource, total, column, renderAlert } = useMemo(() => {
    return {
      column: typeof columns === "function" ? columns(data as any) : columns,
      dataSource: getDataSource<T>(data as any, dataKey),
      renderAlert: typeof alert === "function" ? alert(data as any) : alert,
      total: getTotal(totalKey, data),
    };
  }, [columns, data, dataKey, totalKey]);

  const onSearch = () => {
    if (formItems) {
      table.form.submit();
    } else {
      setState({
        ready: true,
      });
    }
  };
  const onReset = () => {
    setState({
      size:
        (pagination?.pageSizeOptions?.[0] as number) ??
        ProTable.pageSizeOptions[0],
      sorter: {},
    });
    if (formItems) {
      if (formOnResetBefore?.() === false) return;
      table.form.resetFields();
      if (formReset === undefined || formReset === true) {
        table.form.submit();
      }
    }
  };
  if (table) {
    table.queryKey = queryKey;
    table.clear = () => queryClient.setQueryData(queryKey, {});
    table.run = onSearch;
    table.refresh = refetch;
    table.reset = () => {
      if (formItems) {
        onReset();
      }
    };
  }

  useEffect(() => {
    if (request.manual) return;
    if (formItems) {
      table.form.submit();
    } else {
      setState({
        ready: true,
      });
    }
  }, []);
  useEffect(() => {
    return () => {
      table.resetStore();
    };
  }, [table]);

  const onFinish = useCallback((values: Record<string, unknown>) => {
    if (formHandleValues) {
      values = formHandleValues(values);
    }
    if (!values) return;
    //更新 queryKey, userquery force refetch
    forceKey.current += 1;
    setState({
      page: 1,
      search: values,
      ready: true,
    });
  }, []);

  const tableChange = useCallback((pagination: any, sorter: any) => {
    setState({
      page: pagination.current,
      size: pagination.pageSize,
      sorter,
      ready: true,
    });
  }, []);
  const x = scroll?.x ?? useX(column);
  const y = scroll?.y;

  const renderTable = () => {
    return (
      <Table
        columns={column as any}
        loading={isLoading}
        scroll={{ x, y }}
        locale={locale}
        onChange={(p, _, sorter) => tableChange(p, sorter)}
        pagination={{
          current: page,
          pageSize: size,
          total,
          ...pagination,
        }}
        dataSource={dataSource}
        {...prop}
      />
    );
  };

  return (
    <div
      className={classNames?.root ?? DEFAULT_CONFIG.classNames.root}
      style={styles.root}
    >
      {!!formItems && (
        <div
          className={classNames?.form ?? DEFAULT_CONFIG.classNames.form}
          style={styles.form}
        >
          <Form
            form={table.form}
            layout={layout}
            onFinish={onFinish}
            {...otherFormProps}
          >
            {formTitle && <Form.Item>{formTitle}</Form.Item>}
            {formItems}
            <Form.Item>
              <Space>
                <Button type="primary" loading={isLoading} htmlType="submit">
                  {t("搜索", lang)}
                </Button>
                <Button onClick={onReset} disabled={isLoading}>
                  {t("重置", lang)}
                </Button>
                {formExtra}
              </Space>
            </Form.Item>
          </Form>
          {formRight}
        </div>
      )}
      <div
        className={classNames?.table ?? DEFAULT_CONFIG.classNames.table}
        style={styles.table}
      >
        {toolbar && <div style={styles.toolbar}>{toolbar}</div>}
        {renderAlert}
        {!!dataForm ? (
          <Form {...dataForm}>{renderTable()}</Form>
        ) : (
          renderTable()
        )}
      </div>
    </div>
  );
};

ProTable.useTable = useTable;
ProTable.getQuery = getQuery;
ProTable.formatDate = formatDate;
ProTable.removeEmpty = removeEmpty;
ProTable.pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS;

/**
 * 自定义配置参数组合方式.
 * getQuery函数配置默认提供 page,size，orderField，isAsc，...params,...search
 * @param options
 * @returns
 */
ProTable.config = (options: ProTableConfigOptions) => {
  if (!options || !isObject(options)) return;
  if (options.getQuery) {
    ProTable.getQuery = options.getQuery;
  }
  if (options.pageSizeOptions) {
    ProTable.pageSizeOptions = options.pageSizeOptions;
  }
};

export default ProTable;
