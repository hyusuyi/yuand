import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// 扩展 Vitest 的 expect 断言
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock window.getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: () => "",
    width: "0",
    height: "0",
  })),
});

// 抑制 React 18 的 act() 警告（这些警告通常是由 Ant Design 内部状态更新引起的）
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    const errorMessage = typeof args[0] === "string" ? args[0] : "";

    // 过滤 act() 相关警告
    if (errorMessage.includes("was not wrapped in act")) {
      return;
    }

    // 过滤 key prop 警告
    if (errorMessage.includes("Each child in a list should have a unique")) {
      return;
    }

    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    const warnMessage = typeof args[0] === "string" ? args[0] : "";

    if (warnMessage.includes("Each child in a list should have a unique")) {
      return;
    }

    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
