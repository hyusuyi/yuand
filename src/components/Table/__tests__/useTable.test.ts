import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import useTable from "../useTable";

describe("useTable Hook", () => {
  it("应该返回 table 实例", () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;

    expect(table).toBeDefined();
    expect(table.useStore).toBeDefined();
    expect(table.form).toBeDefined();
    expect(table.run).toBeDefined();
    expect(table.reset).toBeDefined();
    expect(table.refresh).toBeDefined();
    expect(table.clear).toBeDefined();
    expect(table.sortOrder).toBeDefined();
    expect(table.resetStore).toBeDefined();
  });

  it("应该使用默认初始状态", () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;
    const state = table.useStore.getState();

    expect(state.page).toBe(1);
    expect(state.size).toBe(10);
    expect(state.sorter).toEqual({});
    expect(state.search).toEqual({});
    expect(state.params).toEqual({});
    expect(state.data).toEqual({});
    expect(state.ready).toBe(false);
  });

  it("应该使用自定义初始状态", () => {
    const { result } = renderHook(() =>
      useTable({
        page: 2,
        size: 20,
        sorter: { field: "name", order: "ascend" },
      })
    );

    const [table] = result.current;
    const state = table.useStore.getState();

    expect(state.page).toBe(2);
    expect(state.size).toBe(20);
    expect(state.sorter).toEqual({ field: "name", order: "ascend" });
  });

  it("应该更新状态", () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;

    act(() => {
      table.useStore.getState().setState({
        page: 2,
        size: 20,
      });
    });

    const state = table.useStore.getState();
    expect(state.page).toBe(2);
    expect(state.size).toBe(20);
  });

  it("sortOrder 应该返回正确的排序状态", () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;

    // 初始状态
    expect(table.sortOrder("name")).toBeNull();

    // 设置排序
    act(() => {
      table.useStore.getState().setState({
        sorter: { field: "name", order: "ascend" },
      });
    });

    expect(table.sortOrder("name")).toBe("ascend");
    expect(table.sortOrder("age")).toBeNull();

    // 修改排序
    act(() => {
      table.useStore.getState().setState({
        sorter: { field: "name", order: "descend" },
      });
    });

    expect(table.sortOrder("name")).toBe("descend");
  });

  it("resetStore 应该重置为初始状态", () => {
    const { result } = renderHook(() =>
      useTable({
        page: 1,
        size: 10,
      })
    );

    const [table] = result.current;

    // 修改状态
    act(() => {
      table.useStore.getState().setState({
        page: 5,
        size: 50,
        search: { keyword: "test" },
      });
    });

    let state = table.useStore.getState();
    expect(state.page).toBe(5);
    expect(state.size).toBe(50);

    // 重置
    act(() => {
      table.resetStore();
    });

    state = table.useStore.getState();
    expect(state.page).toBe(1);
    expect(state.size).toBe(10);
    expect(state.search).toEqual({});
  });

  it("应该在多次渲染时返回同一个实例", () => {
    const { result, rerender } = renderHook(() => useTable());
    const [table1] = result.current;

    rerender();
    const [table2] = result.current;

    expect(table1).toBe(table2);
  });

  it("应该正确处理 subscribe 回调", async () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;

    let updateCount = 0;
    const unsubscribe = table.useStore.subscribe(() => {
      updateCount++;
    });

    // 触发状态更新
    act(() => {
      table.useStore.getState().setState({ page: 2 });
    });

    await waitFor(() => {
      expect(updateCount).toBeGreaterThan(0);
    });

    unsubscribe();
  });

  it("应该在 sorter 变化时触发更新", async () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;

    // 设置排序
    act(() => {
      table.useStore.getState().setState({
        sorter: { field: "name", order: "ascend" },
      });
    });

    await waitFor(() => {
      expect(table.sortOrder("name")).toBe("ascend");
    });

    // 修改排序顺序
    act(() => {
      table.useStore.getState().setState({
        sorter: { field: "name", order: "descend" },
      });
    });

    await waitFor(() => {
      expect(table.sortOrder("name")).toBe("descend");
    });

    // 修改排序字段
    act(() => {
      table.useStore.getState().setState({
        sorter: { field: "age", order: "ascend" },
      });
    });

    await waitFor(() => {
      expect(table.sortOrder("age")).toBe("ascend");
      expect(table.sortOrder("name")).toBeNull();
    });
  });

  it("应该正确处理 form 实例", () => {
    const { result } = renderHook(() => useTable());
    const [table] = result.current;

    expect(table.form).toBeDefined();
    expect(typeof table.form.getFieldValue).toBe("function");
    expect(typeof table.form.setFieldsValue).toBe("function");
    expect(typeof table.form.resetFields).toBe("function");
  });

  it("应该在不同实例间独立状态", () => {
    const { result: result1 } = renderHook(() => useTable());
    const { result: result2 } = renderHook(() => useTable());

    const [table1] = result1.current;
    const [table2] = result2.current;

    // 修改 table1 的状态
    act(() => {
      table1.useStore.getState().setState({ page: 2 });
    });

    // table2 的状态不应该改变
    expect(table1.useStore.getState().page).toBe(2);
    expect(table2.useStore.getState().page).toBe(1);
  });
});
