// 记账app - 分类数据 单元测试
import { describe, it, expect } from "vitest";
import {
  mergeCategories,
  getSubCategories,
  getCategoryIcon,
  PRESET_CATEGORIES,
  CATEGORY_L1_NAMES,
} from "./categories";
import type { CustomCategory } from "./types";

// ==================== mergeCategories ====================

describe("mergeCategories", () => {
  it("无自定义分类时应返回预设分类（不修改原始数据）", () => {
    const result = mergeCategories([]);
    // 预设的 10 个大类应该都在
    expect(result).toHaveLength(10);
    expect(result[0].name).toBe("餐饮美食");
  });

  it("返回的是深拷贝，修改结果不影响原始预设", () => {
    const result = mergeCategories([]);
    result[0].name = "被改了";
    // 原始预设不应该被改
    expect(PRESET_CATEGORIES[0].name).toBe("餐饮美食");
  });

  it("自定义一级分类（parentL1 为 null）应该追加到末尾", () => {
    const custom: CustomCategory[] = [
      {
        id: "c1",
        name: "养宠物",
        icon: "🐱",
        parentL1: null,
        createdAt: "2026-01-01",
      },
    ];
    const result = mergeCategories(custom);
    expect(result).toHaveLength(11); // 10 预设 + 1 自定义
    expect(result[10].name).toBe("养宠物");
    expect(result[10].preset).toBe(false);
  });

  it("自定义一级分类应该有空的 children 数组", () => {
    const custom: CustomCategory[] = [
      {
        id: "c1",
        name: "养宠物",
        icon: "🐱",
        parentL1: null,
        createdAt: "2026-01-01",
      },
    ];
    const result = mergeCategories(custom);
    expect(result[10].children).toEqual([]);
  });

  it("自定义二级分类（parentL1 有值）应该追加到对应大类的 children 里", () => {
    const custom: CustomCategory[] = [
      {
        id: "c2",
        name: "自助餐",
        icon: "🍽️",
        parentL1: "餐饮美食",
        createdAt: "2026-01-01",
      },
    ];
    const result = mergeCategories(custom);
    const foodCat = result.find((c) => c.name === "餐饮美食")!;
    const names = foodCat.children.map((s) => s.name);
    expect(names).toContain("自助餐");
    // 原来的 5 个 + 1 个自定义
    expect(foodCat.children).toHaveLength(6);
  });

  it("parentL1 指向不存在的大类时应静默忽略", () => {
    const custom: CustomCategory[] = [
      {
        id: "c3",
        name: "看电影",
        icon: "🎬",
        parentL1: "不存在的大类",
        createdAt: "2026-01-01",
      },
    ];
    const result = mergeCategories(custom);
    // 不该崩溃，也不该多出奇怪的东西
    expect(result).toHaveLength(10);
  });

  it("多个自定义分类混合应该同时处理", () => {
    const custom: CustomCategory[] = [
      {
        id: "c1",
        name: "养宠物",
        icon: "🐱",
        parentL1: null,
        createdAt: "2026-01-01",
      },
      {
        id: "c2",
        name: "自助餐",
        icon: "🍽️",
        parentL1: "餐饮美食",
        createdAt: "2026-01-01",
      },
    ];
    const result = mergeCategories(custom);
    expect(result).toHaveLength(11);
    const foodCat = result.find((c) => c.name === "餐饮美食")!;
    expect(foodCat.children.map((s) => s.name)).toContain("自助餐");
  });
});

// ==================== getSubCategories ====================

describe("getSubCategories", () => {
  it("餐饮美食应该返回 5 个小类", () => {
    const subs = getSubCategories("餐饮美食");
    expect(subs).toHaveLength(5);
    expect(subs[0].name).toBe("三餐");
  });

  it("不存在的大类应该返回空数组", () => {
    const subs = getSubCategories("不存在的");
    expect(subs).toEqual([]);
  });

  it("返回的是深拷贝吗？— 不是，但按设计直接返回 children 引用即可", () => {
    const subs = getSubCategories("餐饮美食");
    // 只验证返回了正确数据
    expect(subs.length).toBeGreaterThan(0);
  });
});

// ==================== getCategoryIcon ====================

describe("getCategoryIcon", () => {
  it("只传一级分类名应该返回大类的图标", () => {
    const icon = getCategoryIcon("餐饮美食");
    expect(icon).toBe("🍜");
  });

  it("传两级分类名应该返回小类图标", () => {
    const icon = getCategoryIcon("餐饮美食", "外卖");
    expect(icon).toBe("🥡");
  });

  it("不存在的大类应该返回默认图标 📦", () => {
    const icon = getCategoryIcon("不存在");
    expect(icon).toBe("📦");
  });

  it("不存在的小类应该返回大类的图标", () => {
    const icon = getCategoryIcon("餐饮美食", "不存在的小类");
    expect(icon).toBe("🍜"); // 回退到大类图标
  });
});

// ==================== 常量检查 ====================

describe("PRESET_CATEGORIES", () => {
  it("应该有 10 个一级大类", () => {
    expect(PRESET_CATEGORIES).toHaveLength(10);
  });

  it("每个大类都标记为 preset: true", () => {
    for (const cat of PRESET_CATEGORIES) {
      expect(cat.preset).toBe(true);
    }
  });

  it("每个大类都有 name 和 icon", () => {
    for (const cat of PRESET_CATEGORIES) {
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    }
  });
});

describe("CATEGORY_L1_NAMES", () => {
  it("应该有 10 个分类名", () => {
    expect(CATEGORY_L1_NAMES).toHaveLength(10);
  });

  it("应该包含常见的分类名", () => {
    expect(CATEGORY_L1_NAMES).toContain("餐饮美食");
    expect(CATEGORY_L1_NAMES).toContain("交通出行");
    expect(CATEGORY_L1_NAMES).toContain("医疗健康");
  });
});
