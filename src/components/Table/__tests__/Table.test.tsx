import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Form, Input } from "antd";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProTable from "../index";
import { I18nContext } from "../../TableConfig";

// Mock fetch
vi.mock("../../../fetch", () => ({
  rq: {
    request: vi.fn(),
  },
}));

import { rq } from "../../../fetch";
const mockFetch = rq.request as any;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nContext.Provider value={{ lang: "zh_CN" }}>
        {children}
      </I18nContext.Provider>
    </QueryClientProvider>
  );
};

describe("ProTable 组件测试", () => {
  const mockColumns = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 100,
      sorter: true,
    },
    {
      title: "年龄",
      dataIndex: "age",
      key: "age",
      width: 100,
    },
    {
      title: "地址",
      dataIndex: "address",
      key: "address",
      width: 200,
    },
  ];

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      data: [
        { id: 1, name: "User 1", age: 25, address: "Address 1" },
        { id: 2, name: "User 2", age: 30, address: "Address 2" },
      ],
      total: 2,
    });
  });

  it("应该正确渲染表格", async () => {
    const TestComponent = () => {
      const [table] = ProTable.useTable();
      return (
        <ProTable
          request={{ url: "/api/users" }}
          table={table}
          columns={mockColumns}
        />
      );
    };

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("User 1")).toBeInTheDocument();
      expect(screen.getByText("共 2 条记录")).toBeInTheDocument();
    });
  });

  it(
    "应该支持搜索功能",
    async () => {
      const user = userEvent.setup();

      // 在渲染前设置 mock
      const allData = [
        { id: 1, name: "User 1", age: 25, address: "Address 1" },
        { id: 2, name: "User 2", age: 30, address: "Address 2" },
        { id: 3, name: "User 10", age: 28, address: "Address 10" },
      ];

      mockFetch.mockClear();
      mockFetch.mockImplementation(({ json = {} }) => {
        const { keyword = "" } = json;

        const filtered = keyword
          ? allData.filter((item) => item.name.includes(keyword))
          : allData;

        return Promise.resolve({
          data: filtered,
          total: filtered.length,
        });
      });

      const TestComponent = () => {
        const [table] = ProTable.useTable();
        return (
          <ProTable
            request={{ url: "/api/users" }}
            table={table}
            columns={mockColumns}
            form={{
              items: (
                <Form.Item name="keyword" label="关键词">
                  <Input data-testid="keyword-input" />
                </Form.Item>
              ),
            }}
          />
        );
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // 等待初始数据加载
      await waitFor(
        () => {
          expect(screen.getByText("User 1")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // 搜索
      const input = screen.getByTestId("keyword-input");
      await user.clear(input);
      await user.type(input, "10");

      // 使用 role 和 type 来查找按钮，避免空格问题
      const searchButton = screen.getByRole("button", { name: /搜/ });
      await user.click(searchButton);

      await waitFor(
        () => {
          expect(screen.getByText("User 10")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    },
    { timeout: 30000 }
  );

  it("应该支持外部控制", async () => {
    const user = userEvent.setup();
    let tableRef: any = null;

    const TestComponent = () => {
      const [table] = ProTable.useTable();
      tableRef = table;

      return (
        <div>
          <button onClick={() => table.refresh()} data-testid="refresh-btn">
            刷新
          </button>
          <ProTable
            request={{ url: "/api/users" }}
            table={table}
            columns={mockColumns}
          />
        </div>
      );
    };

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("User 1")).toBeInTheDocument();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // 刷新
    mockFetch.mockClear();
    await user.click(screen.getByTestId("refresh-btn"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  it("应该支持动态列", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: 1, name: "John", age: 28, vip: true }],
      total: 1,
      hasVip: true,
    });

    const TestComponent = () => {
      const [table] = ProTable.useTable();

      const dynamicColumns = (data: any) => {
        const baseColumns = [...mockColumns];
        if (data.hasVip) {
          baseColumns.push({
            title: "VIP",
            dataIndex: "vip",
            key: "vip",
            width: 80,
          } as any);
        }
        return baseColumns;
      };

      return (
        <ProTable
          request={{ url: "/api/users" }}
          table={table}
          columns={dynamicColumns}
        />
      );
    };

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("VIP")).toBeInTheDocument();
    });
  });
});
