import type { ProTableProps, ProTableConfigOptions } from "./types";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useMemo } from "react";
import { Table, Form, Button, Space } from "antd";
import {
  getDataSource,
  getQuery,
  getTotal,
  formatDate,
  removeEmpty,
} from "../../utils/table";
import { isObject } from "../../utils/util";
import useFetch from "../../hooks/useFetch";
import useX from "../../hooks/useX";
import useTable from "./useTable";
import "./style.css";

const defaultClassNames = {
  root: "main-container",
  form: "search-form",
  table: "main-table",
};
const defaultStyles = {
  root: {},
  form: {
    display: "flex",
    justifyContent: "space-between",
  },
  table: {},
  toolbar: {
    marginBottom: 15,
  },
};
const ProTable = <T extends Record<string, any>>(props: ProTableProps<T>) => {
  const {
    classNames = defaultClassNames,
    styles = defaultStyles,
    table,
    locale,
    dataKey = "data",
    totalKey = "total",
    manual = false,
    nostyle,
    request = {},
    columns,
    form = {},
    alert,
    toolbar = null,
    pageSizeOptions = [10, 20, 50, 100],
    pagination,
    loadingDelay = 300,
    scroll,
    ...prop
  } = props;

  const {
    title: formTitle,
    extra: formExtra,
    right: formRight,
    formItem,
    items,
    reset: formReset,
    dataForm,
    handleValues: formHandleValues,
    onResetBefore: formOnResetBefore,
    ...otherFormProps
  } = form;

  const formItems = formItem || items;
  const { data, page, size, sorter, search, ready, setState } = table.useStore(
    useShallow((state) => {
      return {
        data: state.data,
        page: state.page,
        size: state.size,
        sorter: state.sorter,
        search: state.search,
        ready: state.ready,
        setState: state.setState,
      };
    })
  );
  const { loading } = useFetch(request.url, {
    method: request.method,
    onBefore: request.onBefore,
    json: ProTable.getQuery({
      page,
      size,
      sorter,
      search,
      params: request.params,
    }),
    ready,
    onFinally: () => {
      setState({
        ready: false,
      });
    },
    onSuccess(data) {
      setState({
        data,
      });
    },
    loadingDelay,
  });

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
      size: 10,
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
    table.run = onSearch;
    table.reset = () => {
      if (formItems) {
        onReset();
      }
    };
  }
  useEffect(() => {
    if (manual) return;
    if (formItems) {
      table.form.submit();
    } else {
      setState({
        ready: true,
      });
    }
  }, [table]);

  const onFinish = (values: Record<string, unknown>) => {
    if (formHandleValues) {
      values = formHandleValues(values);
    }
    if (!values) return;
    setState({
      page: 1,
      search: values,
      ready: true,
    });
  };

  const tableChange = (pagination: any, sorter: any) => {
    setState({
      page: pagination.current,
      size: pagination.pageSize,
      sorter,
      ready: true,
    });
  };
  const x = useX(column);
  const y = scroll?.y;

  const renderTable = () => {
    return (
      <Table
        columns={column as any}
        loading={loading}
        scroll={{ x, y }}
        locale={locale}
        onChange={(p, _, sorter) => tableChange(p, sorter)}
        pagination={{
          current: page,
          pageSize: size,
          showQuickJumper: pagination ? pagination.showQuickJumper : true,
          showSizeChanger: pagination ? pagination.showSizeChanger : true,
          hideOnSinglePage: pagination ? pagination.hideOnSinglePage : false,
          pageSizeOptions,
          total,
          showTotal(total) {
            return `共 ${total} 条记录`;
          },
        }}
        dataSource={dataSource}
        {...prop}
      />
    );
  };

  return (
    <div
      className={classNames?.root ?? defaultClassNames.root}
      style={styles.root}
    >
      {!!formItems && (
        <div
          className={classNames?.form ?? defaultClassNames.form}
          style={styles.form}
        >
          <Form
            form={table.form}
            layout="inline"
            onFinish={onFinish}
            {...otherFormProps}
          >
            {formTitle && <Form.Item>{formTitle}</Form.Item>}
            {formItems}
            <Form.Item>
              <Space>
                <Button type="primary" loading={loading} htmlType="submit">
                  查询
                </Button>
                <Button onClick={onReset} disabled={loading}>
                  重置
                </Button>
                {formExtra}
              </Space>
            </Form.Item>
          </Form>
          {formRight}
        </div>
      )}
      <div
        className={classNames?.table ?? defaultClassNames.table}
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
ProTable.getQuery = (options) => {
  const { page, size, sorter, search, params } = options;
  return getQuery({
    page,
    size,
    sorter,
    search,
    params: params as Record<string, string | number | boolean>,
  });
};
ProTable.formatDate = formatDate;
ProTable.removeEmpty = removeEmpty;
ProTable.pageSizeOptions = [10, 20, 50, 100];
//自定义配置参数组合方式.  默认提供 page,size，orderField，isAsc，...urlParams,...search
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
