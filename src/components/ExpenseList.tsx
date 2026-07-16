// 记账app - 支出列表
import type { ExpenseRecord } from "../data/types";
import { getCategoryIcon } from "../data/categories";

interface Props {
  expenses: ExpenseRecord[];
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function ExpenseList({ expenses, onDelete, showDelete = false }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 text-stone-300">
        <div className="text-4xl mb-4 opacity-40">—</div>
        <p className="text-sm text-stone-400">暂无记录</p>
      </div>
    );
  }

  // 按日期分组
  const grouped: { date: string; items: ExpenseRecord[]; total: number }[] = [];
  for (const expense of expenses) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === expense.date) {
      last.items.push(expense);
      last.total += expense.amount;
    } else {
      grouped.push({ date: expense.date, items: [expense], total: expense.amount });
    }
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let dateLabel: string;
        if (group.date === today) {
          dateLabel = "今天";
        } else if (group.date === yesterday) {
          dateLabel = "昨天";
        } else {
          const d = new Date(group.date);
          dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`;
        }

        const dayOfWeek = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
          new Date(group.date).getDay()
        ];

        return (
          <div key={group.date}>
            {/* 日期标题行 — 杂志排版感 */}
            <div className="flex items-end justify-between mb-2 px-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-stone-700">
                  {dateLabel}
                </span>
                <span className="text-xs text-stone-400">{dayOfWeek}</span>
              </div>
              <span className="text-xs text-stone-400">
                支出{" "}
                <span className="amount text-sm font-semibold text-stone-600">
                  ¥{group.total.toFixed(2)}
                </span>
              </span>
            </div>

            {/* 支出条目 — 极简卡片 */}
            <div className="bg-white rounded-lg border border-stone-100 overflow-hidden">
              {group.items.map((expense) => {
                const icon = getCategoryIcon(expense.categoryL1, expense.categoryL2);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between px-4 py-3
                               border-b border-stone-50 last:border-b-0
                               hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-base">
                        {icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-stone-700">
                          {expense.categoryL2}
                        </div>
                        <div className="text-xs text-stone-400">
                          {expense.categoryL1}
                          {expense.note && ` · ${expense.note}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="amount text-sm font-semibold text-stone-700">
                        -¥{expense.amount.toFixed(2)}
                      </span>
                      {showDelete && onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(expense.id)}
                          className="text-stone-200 hover:text-red-400 transition-colors text-xs px-1"
                          title="删除"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
