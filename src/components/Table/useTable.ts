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
      resetStore() {
        useStore.getState().setState(initState);
      },
      update: () => update((v) => v + 1),
    };
  }
  return [tableRef.current];
};

export default useTable;
