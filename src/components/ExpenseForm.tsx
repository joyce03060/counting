// 记账app - 记账表单
import { useState } from "react";
import CategoryPicker from "./CategoryPicker";
import type { Category, NewExpense } from "../data/types";

interface Props {
  onSubmit: (expense: NewExpense) => void;
  categories: Category[];
}

export default function ExpenseForm({ onSubmit, categories }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState("");
  const [categoryL1, setCategoryL1] = useState("");
  const [categoryL2, setCategoryL2] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleCategoryChange(l1: string, l2: string) {
    setCategoryL1(l1);
    setCategoryL2(l2);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("请输入有效的金额");
      return;
    }
    if (amountNum > 99999999) {
      setError("金额不能超过 99,999,999 元");
      return;
    }
    if (!categoryL1 || !categoryL2) {
      setError("请选择分类");
      return;
    }
    if (!date) {
      setError("请选择日期");
      return;
    }
    if (date > today) {
      setError("日期不能是未来时间");
      return;
    }
    if (note.length > 200) {
      setError("备注不能超过 200 字");
      return;
    }

    onSubmit({
      amount: Math.round(amountNum * 100) / 100,
      categoryL1,
      categoryL2,
      date,
      note: note.trim(),
    });

    setAmount("");
    setCategoryL1("");
    setCategoryL2("");
    setNote("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const quickAmounts = [10, 20, 50, 100, 200];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 金额输入 — 杂志风核心：数字是主角 */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-2 tracking-wide">
          金额
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xl font-light">
            ¥
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg text-2xl font-medium amount
                       bg-stone-50/50
                       focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:bg-white
                       transition-colors"
            autoFocus
          />
        </div>
        <div className="flex gap-2 mt-2">
          {quickAmounts.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setAmount(String(n));
                setError("");
              }}
              className="flex-1 py-1.5 text-xs font-medium text-stone-500 bg-stone-50 rounded-md
                         hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              ¥{n}
            </button>
          ))}
        </div>
      </div>

      {/* 分类选择 */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-2 tracking-wide">
          分类
        </label>
        <CategoryPicker
          categories={categories}
          selectedL1={categoryL1}
          selectedL2={categoryL2}
          onChange={handleCategoryChange}
        />
      </div>

      {/* 日期和备注一行 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-2 tracking-wide">
            日期
          </label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-700
                       bg-stone-50/50
                       focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:bg-white
                       transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-2 tracking-wide">
            备注
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError("");
            }}
            placeholder="选填"
            maxLength={200}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-700
                       bg-stone-50/50 placeholder:text-stone-300
                       focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:bg-white
                       transition-colors"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {/* 提交按钮 — 唯一使用强调色的地方 */}
      <button
        type="submit"
        className="w-full py-3 bg-amber-600 text-white text-sm font-medium rounded-lg
                   hover:bg-amber-700 active:bg-amber-800 transition-colors tracking-wide"
      >
        记一笔
      </button>
    </form>
  );
}
