// 记账app - 两级分类选择器
import { useState, useMemo } from "react";
import type { Category } from "../data/types";

interface Props {
  categories: Category[];
  selectedL1: string;
  selectedL2: string;
  onChange: (l1: string, l2: string) => void;
}

export default function CategoryPicker({ categories, selectedL1, selectedL2, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [step, setStep] = useState<"l1" | "l2">("l1");

  const workingL1 = useMemo(() => categories.find((c) => c.name === selectedL1), [categories, selectedL1]);

  function handleSelectL1(l1Name: string) {
    onChange(l1Name, "");
    setStep("l2");
  }

  function handleSelectL2(l2Name: string) {
    onChange(selectedL1 || workingL1?.name || categories[0]?.name || "", l2Name);
    setShowPicker(false);
    setStep("l1");
  }

  function openPicker() {
    setStep("l1");
    setShowPicker(true);
  }

  const selectedSub = workingL1?.children.find((s) => s.name === selectedL2);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:border-indigo-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          {selectedL1 && selectedL2 ? (
            <>
              <span className="text-lg">{selectedSub?.icon ?? "📦"}</span>
              <span className="text-gray-700">{selectedL1} / {selectedL2}</span>
            </>
          ) : (
            <span className="text-gray-400">选择分类</span>
          )}
        </span>
        <span className="text-gray-400 text-xs">▼</span>
      </button>

      {showPicker && (
        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            {step === "l2" ? (
              <button
                type="button"
                onClick={() => setStep("l1")}
                className="text-indigo-500 text-sm font-medium"
              >
                ← 返回大类
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-600">选择分类</span>
            )}
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {step === "l1" && (
            <div className="max-h-60 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleSelectL1(cat.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedL1 === cat.name
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "l2" && workingL1 && (
            <div className="max-h-60 overflow-y-auto p-2">
              <div className="text-xs text-gray-400 px-2 pb-2">
                {workingL1.icon} {workingL1.name} 的子分类
              </div>
              <div className="grid grid-cols-3 gap-1">
                {workingL1.children.map((sub) => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => handleSelectL2(sub.name)}
                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-colors ${
                      selectedL2 === sub.name && selectedL1 === workingL1.name
                        ? "bg-indigo-50 text-indigo-600"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-xl">{sub.icon}</span>
                    <span className="text-xs">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
