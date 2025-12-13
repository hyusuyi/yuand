import { Form } from "antd";
import { useRef, useState } from "react";
import { create } from "zustand";
import type { UseTableProps, TableState, TableInstance } from "./types";

const useTable = (options: UseTableProps = {}) => {
  const [_, update] = useState(0);
  const [form] = Form.useForm();
  const tableRef = useRef<TableInstance>(null);

  if (!tableRef.current) {
    const initState = {
      page: options.page ?? 1,
      size: options.size ?? 10,
      sorter: options.sorter ?? {},
      search: {},
      params: {},
      data: {},
      ready: false,
    };
    const useStore = create<TableState>((set) => ({
      ...initState,
      setState(values = {}) {
        set(values);
      },
    }));
    tableRef.current = {
      form,
      useStore: useStore,
      queryKey: [],
      run() {},
      clear: () => {},
      refresh: () => {},
      reset: () => {},
      sortOrder(key: string) {
        const sorter = useStore.getState().sorter;
        if (sorter && sorter.field === key) {
          return sorter.order;
        }
        return null;
      },
      resetStore() {
        useStore.getState().setState(initState);
      },
      update: () => update((v) => v + 1),
    };
    useStore.subscribe((state, prevState) => {
      // 只在排序真正变化时才触发更新
      const sorterChanged = state.sorter !== prevState.sorter;
      const orderChanged = state.sorter?.order !== prevState.sorter?.order;
      const fieldChanged = state.sorter?.field !== prevState.sorter?.field;

      if (sorterChanged && (orderChanged || fieldChanged)) {
        // 创建新的引用以触发使用 tableRef.current 的组件更新
        tableRef.current = { ...tableRef.current! };
        update((v) => v + 1);
      }
    });
  }
  return [tableRef.current];
};

export default useTable;
