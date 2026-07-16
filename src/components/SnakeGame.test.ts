// 记账app - 贪吃蛇游戏逻辑 单元测试
import { describe, it, expect } from "vitest";
import {
  directionDelta,
  isOpposite,
  randomFood,
  createInitialState,
  snakeReducer,
  GRID_SIZE,
} from "../components/SnakeGame";
import type { GameState } from "../data/snake-types";

// ==================== directionDelta ====================

describe("directionDelta", () => {
  it("UP 应该是 (0, -1)", () => {
    expect(directionDelta("UP")).toEqual({ x: 0, y: -1 });
  });

  it("DOWN 应该是 (0, 1)", () => {
    expect(directionDelta("DOWN")).toEqual({ x: 0, y: 1 });
  });

  it("LEFT 应该是 (-1, 0)", () => {
    expect(directionDelta("LEFT")).toEqual({ x: -1, y: 0 });
  });

  it("RIGHT 应该是 (1, 0)", () => {
    expect(directionDelta("RIGHT")).toEqual({ x: 1, y: 0 });
  });
});

// ==================== isOpposite ====================

describe("isOpposite", () => {
  it("上和下是相反的", () => {
    expect(isOpposite("UP", "DOWN")).toBe(true);
    expect(isOpposite("DOWN", "UP")).toBe(true);
  });

  it("左和右是相反的", () => {
    expect(isOpposite("LEFT", "RIGHT")).toBe(true);
    expect(isOpposite("RIGHT", "LEFT")).toBe(true);
  });

  it("上和左不是相反的", () => {
    expect(isOpposite("UP", "LEFT")).toBe(false);
  });

  it("同方向不是相反的", () => {
    expect(isOpposite("UP", "UP")).toBe(false);
    expect(isOpposite("LEFT", "LEFT")).toBe(false);
  });
});

// ==================== randomFood ====================

describe("randomFood", () => {
  it("生成的食物应该在 0 ~ GRID_SIZE-1 范围内", () => {
    const snake = [{ x: 5, y: 5 }];
    for (let i = 0; i < 20; i++) {
      const food = randomFood(snake);
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE);
    }
  });

  it("生成的食物不应该在蛇身上", () => {
    const snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
    ];
    for (let i = 0; i < 20; i++) {
      const food = randomFood(snake);
      // 食物不在蛇身
      const onSnake = snake.some(
        (s) => s.x === food.x && s.y === food.y,
      );
      expect(onSnake).toBe(false);
    }
  });

  it("蛇占满整个网格时应该返回 (-1, -1)", () => {
    // 构造一条占满 400 格的蛇
    const fullSnake = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        fullSnake.push({ x, y });
      }
    }
    const food = randomFood(fullSnake);
    expect(food).toEqual({ x: -1, y: -1 });
  });

  it("只有几个空位时应该返回正确位置", () => {
    // 除了 (0,0) 和 (0,1)，其余全占满
    const occupied = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!(x === 0 && y === 0) && !(x === 0 && y === 1)) {
          occupied.push({ x, y });
        }
      }
    }
    for (let i = 0; i < 10; i++) {
      const food = randomFood(occupied);
      const isExpected =
        (food.x === 0 && food.y === 0) || (food.x === 0 && food.y === 1);
      expect(isExpected).toBe(true);
    }
  });
});

// ==================== createInitialState ====================

describe("createInitialState", () => {
  const state = createInitialState();

  it("初始状态应该是 idle", () => {
    expect(state.gameStatus).toBe("idle");
  });

  it("初始得分应该是 0", () => {
    expect(state.score).toBe(0);
  });

  it("初始蛇长应该是 3", () => {
    expect(state.snake).toHaveLength(3);
  });

  it("初始方向应该是 RIGHT", () => {
    expect(state.direction).toBe("RIGHT");
    expect(state.nextDirection).toBe("RIGHT");
  });

  it("蛇应该放在棋盘中央附近", () => {
    const mid = Math.floor(GRID_SIZE / 2);
    expect(state.snake[0].y).toBe(mid);
    expect(state.snake[0].x).toBe(mid);
  });

  it("食物不应该在蛇身上", () => {
    const onSnake = state.snake.some(
      (s) => s.x === state.food.x && s.y === state.food.y,
    );
    expect(onSnake).toBe(false);
  });
});

// ==================== snakeReducer ====================

describe("snakeReducer", () => {
  function initialState(overrides: Partial<GameState> = {}): GameState {
    const state = createInitialState();
    return { ...state, ...overrides };
  }

  describe("START_GAME", () => {
    it("idle 状态下应该切换到 running", () => {
      const state = initialState();
      const next = snakeReducer(state, { type: "START_GAME" });
      expect(next.gameStatus).toBe("running");
    });

    it("gameOver 状态下重新开始应该清除旧分数", () => {
      const state = initialState({ gameStatus: "gameOver", score: 100 });
      const next = snakeReducer(state, { type: "START_GAME" });
      expect(next.gameStatus).toBe("running");
      expect(next.score).toBe(0);
    });
  });

  describe("GAME_OVER", () => {
    it("应该把状态设为 gameOver", () => {
      const state = initialState({ gameStatus: "running" });
      const next = snakeReducer(state, { type: "GAME_OVER" });
      expect(next.gameStatus).toBe("gameOver");
    });
  });

  describe("CHANGE_DIRECTION", () => {
    it("不允许 180° 掉头（当前方向 = nextDirection 时）", () => {
      // 蛇正朝右走
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "RIGHT",
      });
      // 按左键 → 被忽略
      const next = snakeReducer(state, {
        type: "CHANGE_DIRECTION",
        direction: "LEFT",
      });
      expect(next.nextDirection).toBe("RIGHT");
    });

    it("不允许与当前 direction 相反（即使 nextDirection 已在另一个方向）", () => {
      // 蛇实际朝着 RIGHT，但 nextDirection 已经是 DOWN
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "DOWN",
      });
      // 现在按 LEFT → 与当前 direction RIGHT 相反，应该被驳回
      const next = snakeReducer(state, {
        type: "CHANGE_DIRECTION",
        direction: "LEFT",
      });
      expect(next.nextDirection).toBe("DOWN");
    });

    it("同方向重复按键不更新状态", () => {
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "RIGHT",
      });
      const next = snakeReducer(state, {
        type: "CHANGE_DIRECTION",
        direction: "RIGHT",
      });
      expect(next).toBe(state); // 同一个对象引用
    });

    it("正常变向应该更新 nextDirection", () => {
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "RIGHT",
      });
      const next = snakeReducer(state, {
        type: "CHANGE_DIRECTION",
        direction: "DOWN",
      });
      expect(next.nextDirection).toBe("DOWN");
    });
  });

  describe("TICK", () => {
    it("非 running 状态下 TICK 不做任何事", () => {
      const state = initialState({ gameStatus: "idle" });
      const next = snakeReducer(state, { type: "TICK" });
      expect(next).toBe(state);
    });

    it("蛇应该朝 nextDirection 方向移动一格", () => {
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "RIGHT",
        snake: [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 3, y: 5 },
        ],
        food: { x: 10, y: 5 },
      });
      const next = snakeReducer(state, { type: "TICK" });
      // 新蛇头在 (6, 5)
      expect(next.snake[0]).toEqual({ x: 6, y: 5 });
      // 蛇长不变
      expect(next.snake).toHaveLength(3);
    });

    it("吃到食物时蛇变长，分数增加", () => {
      // 食物就在蛇头前方一格
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "RIGHT",
        snake: [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 3, y: 5 },
        ],
        food: { x: 6, y: 5 }, // 正好在蛇头前方
      });
      const next = snakeReducer(state, { type: "TICK" });
      expect(next.score).toBe(10);
      expect(next.snake).toHaveLength(4); // 长了 1 格
    });

    it("撞到上边界应该 game over", () => {
      const state = initialState({
        gameStatus: "running",
        direction: "UP",
        nextDirection: "UP",
        snake: [
          { x: 5, y: 0 },
          { x: 5, y: 1 },
        ],
        food: { x: 10, y: 10 },
      });
      const next = snakeReducer(state, { type: "TICK" });
      expect(next.gameStatus).toBe("gameOver");
    });

    it("撞到自己身体应该 game over", () => {
      // 蛇形成了一个 U 形回路，朝 UP 走会撞到自己身体
      // 蛇形：头在 (4,4)，身体蜿蜒到 (4,3) 形成回路
      // [0]=(4,4) [1]=(3,4) [2]=(3,3) [3]=(4,3) [4]=(5,3) [5]=(5,4)
      const state = initialState({
        gameStatus: "running",
        direction: "UP",
        nextDirection: "UP",
        snake: [
          { x: 4, y: 4 },
          { x: 3, y: 4 },
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 5, y: 3 },
          { x: 5, y: 4 },
        ],
        food: { x: 10, y: 10 },
      });
      // 朝上走，新蛇头在 (4, 3)，而 (4, 3) 是身体第 4 段（索引 3）
      // 没吃食物所以尾部 (5,4) 移走，但 (4,3) 仍在 bodyToCheck 中 → game over
      const next = snakeReducer(state, { type: "TICK" });
      expect(next.gameStatus).toBe("gameOver");
    });

    it("TICK 时 direction 应该更新为 nextDirection", () => {
      const state = initialState({
        gameStatus: "running",
        direction: "RIGHT",
        nextDirection: "DOWN",
        snake: [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 3, y: 5 },
        ],
        food: { x: 10, y: 10 },
      });
      const next = snakeReducer(state, { type: "TICK" });
      // direction 同步为 nextDirection
      expect(next.direction).toBe("DOWN");
    });
  });
});

// ==================== 导出常量检查 ====================

describe("游戏常量", () => {
  it("GRID_SIZE 应该为 20", () => {
    expect(GRID_SIZE).toBe(20);
  });
});
