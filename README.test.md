# Table 组件测试说明

## 安装测试依赖

```bash
npm install -D vitest @vitest/ui @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D @types/testing-library__jest-dom
```

## 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage

# 运行 UI 界面
npm test -- --ui

# 运行特定测试文件
npm test src/components/Table/__tests__/index.test.tsx
```

## 测试覆盖范围

### 1. 组件基础功能测试 (`index.test.tsx`)
- ✅ 基础渲染
- ✅ 加载状态
- ✅ 自定义 classNames 和 styles
- ✅ 自定义 dataKey 和 totalKey
- ✅ 表单搜索功能
- ✅ 表单提交和重置
- ✅ handleValues 表单值处理
- ✅ 分页器显示和切换
- ✅ 每页大小变化
- ✅ 列排序功能
- ✅ Table 实例方法（run, reset, refresh, sortOrder）
- ✅ 动态列配置（函数形式 columns）
- ✅ Alert 和 Toolbar 渲染
- ✅ 国际化支持
- ✅ 静态方法（config, formatDate, removeEmpty）

### 2. useTable Hook 测试 (`useTable.test.ts`)
- ✅ 返回正确的实例结构
- ✅ 默认和自定义初始状态
- ✅ 状态更新
- ✅ sortOrder 方法
- ✅ resetStore 方法
- ✅ 实例稳定性（多次渲染）
- ✅ subscribe 回调
- ✅ sorter 变化触发更新
- ✅ Form 实例
- ✅ 多实例独立性

### 3. 集成测试 (`integration.test.tsx`)
- ✅ 完整的搜索-分页-排序流程
- ✅ 表单验证与条件搜索
- ✅ 自定义 handleValues 转换
- ✅ 动态列与数据联动
- ✅ Alert 统计信息显示
- ✅ 外部控制刷新与清空

## 测试配置文件

### vitest.config.ts
配置了测试环境、覆盖率报告、路径别名等。

### src/test/setup.ts
测试环境初始化，包括：
- jest-dom 断言扩展
- 自动清理
- window.matchMedia mock
- IntersectionObserver mock
- ResizeObserver mock

## 覆盖率目标

- **语句覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%

## 常见问题

### Q: 如何调试测试？
A: 使用 `--ui` 参数打开 Vitest UI 界面进行可视化调试。

### Q: 测试运行很慢怎么办？
A: 可以使用 `--run` 参数禁用监听模式，或使用 `--isolate=false` 提升性能。

### Q: 如何 mock API 请求？
A: 在测试文件中使用 `vi.mock()` mock fetch 模块，参考测试文件中的示例。

## package.json 脚本配置

在 package.json 中添加以下脚本：

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```
