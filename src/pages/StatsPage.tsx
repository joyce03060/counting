// 记账app - 统计页面（月度汇总 + 饼图）
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getMonthlyStats, getAllExpenses } from "../data/database";
import { getCategoryIcon } from "../data/categories";
import { exportToCSV, saveCSV, generateExportFilename } from "../utils/export";

// 饼图色板 — 暖色调，克制不刺眼
const COLORS = [
  "#b45309", "#d97706", "#ca8a04", "#a16207", "#854d0e",
  "#92400e", "#b91c1c", "#c2410c", "#7c2d12", "#9a7b4f",
];

export default function StatsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<
    { category: string; icon: string; amount: number; percentage: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [year, month]);

  async function loadStats() {
    setLoading(true);
    try {
      const stats = await getMonthlyStats(year, month);
      setTotal(stats.total);

      const withIcons = stats.byCategory.map((c) => ({
        ...c,
        icon: getCategoryIcon(c.category),
        percentage: stats.total > 0 ? Math.round((c.amount / stats.total) * 100) : 0,
      }));
      setByCategory(withIcons);
    } catch (e) {
      console.error("加载统计数据失败:", e);
      setByCategory([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    const now = new Date();
    const maxMonth = now.getMonth() + 1;
    const maxYear = now.getFullYear();
    if (year === maxYear && month >= maxMonth) return;
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function isCurrentMonth() {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  }

  async function handleExport() {
    try {
      const records = await getAllExpenses();
      const csv = exportToCSV(records);
      await saveCSV(csv, generateExportFilename());
    } catch (e) {
      console.error("导出失败:", e);
    }
  }

  const pieData = byCategory.map((c) => ({
    name: c.category,
    value: c.amount,
    icon: c.icon,
  }));

  const monthLabel = `${year}年${month}月`;

  const renderCustomLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }: {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; percent: number;
  }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle"
            dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 月份切换器 */}
      <div className="flex items-center justify-center gap-5 mb-5">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors text-sm"
        >
          ◀
        </button>
        <span className="text-sm font-semibold text-stone-600 tracking-wide min-w-[90px] text-center">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth()}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors text-sm disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ▶
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-stone-300 text-sm">
          加载中...
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
          <div className="text-4xl mb-3 opacity-40">—</div>
          <p className="text-sm text-stone-400">{monthLabel}暂无支出记录</p>
        </div>
      ) : (
        <>
          {/* 支出总额 — 杂志排版核心：大数字 + 呼吸空间 */}
          <div className="text-center mb-5">
            <div className="text-xs text-stone-400 mb-3 tracking-widest">
              本月总支出
            </div>
            <div className="text-4xl font-bold amount text-stone-700 tracking-tight">
              ¥{total.toFixed(2)}
            </div>
          </div>

          {/* 饼图 */}
          <div className="bg-white rounded-xl p-3 mb-4 border border-stone-100">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`¥${value.toFixed(2)}`, "金额"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 分类明细 */}
          <div className="bg-white rounded-lg border border-stone-100 overflow-hidden">
            {byCategory.map((cat, index) => (
              <div
                key={cat.category}
                className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm text-stone-600">{cat.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold amount text-stone-700">
                    ¥{cat.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-stone-400">{cat.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={handleExport}
          className="w-full py-2.5 border border-stone-200 text-stone-500 text-xs font-medium rounded-lg
                     hover:bg-stone-50 hover:text-stone-700 transition-colors tracking-wide"
        >
          导出全部数据为 CSV
        </button>
      </div>
    </div>
  );
}
