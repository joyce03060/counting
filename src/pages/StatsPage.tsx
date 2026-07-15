// 记账app - 统计页面（月度汇总 + 饼图）
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getMonthlyStats, getAllExpenses } from "../data/database";
import { getCategoryIcon } from "../data/categories";
import { exportToCSV, saveCSV, generateExportFilename } from "../utils/export";

// 饼图使用的颜色
const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#64748b",
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

  // 月份切换
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

  // CSV 导出
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

  // 自定义饼图标签
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
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
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 月份切换器 */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          ◀
        </button>
        <span className="text-base font-semibold text-gray-700 min-w-[100px] text-center">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ▶
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <span>加载中...</span>
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-sm">{monthLabel}暂无支出记录</p>
        </div>
      ) : (
        <>
          {/* 支出总额 */}
          <div className="text-center mb-4">
            <div className="text-xs text-gray-400 mb-1">本月总支出</div>
            <div className="text-3xl font-bold amount text-gray-800">
              ¥{total.toFixed(2)}
            </div>
          </div>

          {/* 饼图 */}
          <div className="bg-white rounded-xl p-3 mb-4">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, "金额"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 分类明细列表 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {byCategory.map((cat, index) => (
              <div
                key={cat.category}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm text-gray-700">{cat.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold amount text-gray-800">
                    ¥{cat.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">{cat.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 导出按钮 */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleExport}
          className="w-full py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          📥 导出全部数据为 CSV
        </button>
      </div>
    </div>
  );
}
