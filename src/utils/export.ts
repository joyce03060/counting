// 记账app - CSV 导出
import type { ExpenseRecord } from "../data/types";

// 导出支出记录为 CSV 文件
export function exportToCSV(records: ExpenseRecord[]): string {
  // CSV 表头
  const headers = ["日期", "一级分类", "二级分类", "金额(元)", "备注"];

  // 转义 CSV 字段（处理逗号、引号、换行）
  function escapeField(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  // 组装 CSV 内容
  const lines = [headers.join(",")];

  for (const record of records) {
    const row = [
      record.date,
      record.categoryL1,
      record.categoryL2,
      record.amount.toFixed(2),
      record.note,
    ];
    lines.push(row.map(escapeField).join(","));
  }

  return lines.join("\n");
}

// 保存 CSV 文件到本地
export async function saveCSV(content: string, filename: string): Promise<void> {
  // 在 Tauri 环境外使用浏览器下载（开发阶段）
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// 生成导出文件名
export function generateExportFilename(prefix: string = "记账app"): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  return `${prefix}_${dateStr}.csv`;
}
