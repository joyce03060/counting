// 记账app - CSV 导出 单元测试
import { describe, it, expect } from "vitest";
import { exportToCSV, generateExportFilename } from "./export";
import type { ExpenseRecord } from "../data/types";

// 辅助函数：创建一条测试用的支出记录
function makeRecord(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  return {
    id: "test-001",
    amount: 25.5,
    categoryL1: "餐饮美食",
    categoryL2: "外卖",
    date: "2026-07-15",
    note: "",
    createdAt: "2026-07-15T10:30:00.000Z",
    ...overrides,
  };
}

// ==================== exportToCSV ====================

describe("exportToCSV", () => {
  it("空记录应该只返回表头", () => {
    const result = exportToCSV([]);
    expect(result).toBe("日期,一级分类,二级分类,金额(元),备注");
  });

  it("单条记录应该输出一行数据", () => {
    const records = [makeRecord()];
    const result = exportToCSV(records);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("2026-07-15,餐饮美食,外卖,25.50,");
  });

  it("多条记录应该按顺序输出", () => {
    const records = [
      makeRecord({ amount: 10, date: "2026-07-15", note: "午餐" }),
      makeRecord({ amount: 20, date: "2026-07-15", note: "晚餐" }),
    ];
    const result = exportToCSV(records);
    const lines = result.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("10.00");
    expect(lines[2]).toContain("20.00");
  });

  it("金额应该保留两位小数", () => {
    const records = [makeRecord({ amount: 99 })]; // 整数
    const result = exportToCSV(records);
    const lines = result.split("\n");
    expect(lines[1]).toContain("99.00");
  });

  it("含逗号的备注应该用引号包裹", () => {
    const records = [makeRecord({ note: "牛奶,面包" })];
    const result = exportToCSV(records);
    expect(result).toContain('"牛奶,面包"');
  });

  it("含双引号的备注应该转义", () => {
    const records = [makeRecord({ note: '他说"好的"' })];
    const result = exportToCSV(records);
    // CSV 中双引号转义为两个双引号
    expect(result).toContain('"他说""好的"""');
  });

  it("无逗号无引号的普通备注不额外加引号", () => {
    const records = [makeRecord({ note: "午饭" })];
    const result = exportToCSV(records);
    // 不应该被引号包裹
    expect(result.split("\n")[1]).toBe("2026-07-15,餐饮美食,外卖,25.50,午饭");
  });
});

// ==================== generateExportFilename ====================

describe("generateExportFilename", () => {
  it("默认前缀是 记账app", () => {
    const filename = generateExportFilename();
    expect(filename).toMatch(/^记账app_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("可以自定义前缀", () => {
    const filename = generateExportFilename("月报");
    expect(filename).toMatch(/^月报_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("文件名以 .csv 结尾", () => {
    const filename = generateExportFilename();
    expect(filename.endsWith(".csv")).toBe(true);
  });

  it("包含今天的日期", () => {
    const today = new Date().toISOString().slice(0, 10);
    const filename = generateExportFilename();
    expect(filename).toContain(today);
  });
});
