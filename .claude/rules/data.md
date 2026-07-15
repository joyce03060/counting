# 数据处理规范

> 本规范适用于 `src/data/`、`src/shared/utils/`、`src/store/` 等数据相关代码。

---

## 数据结构定义

### 支出一条记录

```typescript
interface ExpenseRecord {
  id: string;           // 唯一标识
  amount: number;       // 金额（元），最多两位小数
  categoryL1: string;   // 一级分类
  categoryL2: string;   // 二级分类
  date: string;         // 日期，格式 YYYY-MM-DD
  note: string;         // 备注（可选）
  createdAt: string;    // 创建时间 ISO 8601
  updatedAt: string;    // 最后修改时间 ISO 8601
}
```

### 分类定义

```typescript
interface Category {
  id: string;
  name: string;         // 分类名
  icon: string;         // 图标（emoji 或图标名）
  children?: Category[];// 二级子分类
}
```

### 月度统计

```typescript
interface MonthlyStats {
  year: number;
  month: number;
  total: number;
  byCategory: { category: string, amount: number, percentage: number }[];
}
```

---

## 数据校验规则

1. **金额**：必须大于 0，最多两位小数，不能为负数
2. **分类**：必须选择一级和二级分类，不能为空
3. **日期**：必须是有效日期，不能是未来日期（允许当天）
4. **备注**：最大长度 200 字，可选
5. **ID**：使用 UUID v4 生成

---

## 数据持久化规则

1. 所有数据保存在用户本地设备
2. 不得向任何远程服务器发送用户数据
3. 数据格式变更时需向后兼容旧数据
4. 定期自动备份（可选功能）

---

## 金额计算规则

1. 所有金额以「元」为单位，内部存储以「分」为单位（整数），避免浮点数精度问题
2. 显示时除以 100 转换为元，保留两位小数
3. 汇总计算在展示层处理，不在存储层
