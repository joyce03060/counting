// 记账app - 贪吃蛇小游戏（react-konva Canvas 渲染）
import { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import type { Position, Direction, GameState, GameAction } from "../data/snake-types";

// ==================== 游戏常量 ====================

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 400px
const INITIAL_SPEED = 150; // ms/步
const SPEED_STEP = 10; // 每升一级加快 10ms
const SPEED_MIN = 60; // 最快速度
const FOODS_PER_LEVEL = 5; // 每吃 5 个食物升一级
const HIGH_SCORE_KEY = "snake_high_score";

// 颜色（匹配 app indigo 主题）
const BG_COLOR = "#eef2ff"; // indigo-50
const GRID_LINE_COLOR = "#e0e7ff"; // indigo-100
const SNAKE_COLOR = "#a5b4fc"; // indigo-300
const SNAKE_HEAD_COLOR = "#6366f1"; // indigo-500
const FOOD_COLOR = "#ef4444"; // red-500

// ==================== 工具函数 ====================

/** 方向对应的坐标偏移 */
function directionDelta(d: Direction): Position {
  switch (d) {
    case "UP":
      return { x: 0, y: -1 };
    case "DOWN":
      return { x: 0, y: 1 };
    case "LEFT":
      return { x: -1, y: 0 };
    case "RIGHT":
      return { x: 1, y: 0 };
  }
}

/** 判断两个方向是否相反 */
function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

/** 随机生成食物位置，避开蛇身 */
function randomFood(snake: Position[]): Position {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const available: Position[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }
  if (available.length === 0) {
    return { x: -1, y: -1 }; // 蛇占满网格（理论上的胜利）
  }
  return available[Math.floor(Math.random() * available.length)];
}

/** 创建初始游戏状态 */
function createInitialState(): GameState {
  const mid = Math.floor(GRID_SIZE / 2);
  const snake: Position[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    snake,
    food: randomFood(snake),
    direction: "RIGHT",
    nextDirection: "RIGHT",
    gameStatus: "idle",
    score: 0,
  };
}

// ==================== Reducer ====================

function snakeReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const initial = createInitialState();
      return { ...initial, gameStatus: "running" };
    }

    case "GAME_OVER":
      return { ...state, gameStatus: "gameOver" };

    case "CHANGE_DIRECTION": {
      // 拒绝 180° 掉头和同方向重复按键
      if (
        isOpposite(action.direction, state.direction) ||
        action.direction === state.nextDirection
      ) {
        return state;
      }
      return { ...state, nextDirection: action.direction };
    }

    case "TICK": {
      if (state.gameStatus !== "running") return state;

      const head = state.snake[0];
      const delta = directionDelta(state.nextDirection);
      const newHead: Position = {
        x: head.x + delta.x,
        y: head.y + delta.y,
      };

      // 撞墙检测
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        return { ...state, gameStatus: "gameOver" };
      }

      // 吃食物？
      const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;

      // 自碰检测：检查新蛇头是否撞到身体
      // 没吃食物时尾部会移走，所以检查蛇身去掉最后一个
      const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
      if (
        bodyToCheck.some((seg) => seg.x === newHead.x && seg.y === newHead.y)
      ) {
        return { ...state, gameStatus: "gameOver" };
      }

      // 构建新蛇身
      const newSnake = [
        newHead,
        ...(ateFood ? state.snake : state.snake.slice(0, -1)),
      ];

      // 新食物
      const newFood = ateFood ? randomFood(newSnake) : state.food;
      const newScore = ateFood ? state.score + 10 : state.score;

      return {
        ...state,
        snake: newSnake,
        food: newFood,
        direction: state.nextDirection,
        score: newScore,
      };
    }

    default:
      return state;
  }
}

// ==================== 组件 ====================

export default function SnakeGame() {
  const [state, dispatch] = useReducer(snakeReducer, null, createInitialState);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 最高分（localStorage 持久化）
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // 当前速度
  const level = Math.floor(state.score / 10 / FOODS_PER_LEVEL);
  const speed = Math.max(SPEED_MIN, INITIAL_SPEED - level * SPEED_STEP);

  // 游戏结束更新最高分
  useEffect(() => {
    if (state.gameStatus === "gameOver" && state.score > highScore) {
      setHighScore(state.score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(state.score));
      } catch {
        /* 忽略存储错误 */
      }
    }
  }, [state.gameStatus, state.score, highScore]);

  // 游戏循环：速度变化时重建定时器
  useEffect(() => {
    if (state.gameStatus === "running") {
      tickRef.current = setInterval(() => {
        dispatch({ type: "TICK" });
      }, speed);
    } else {
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
    return () => {
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
      }
    };
  }, [state.gameStatus, speed]);

  // 键盘控制
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state.gameStatus !== "running") return;

      const keyMap: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        W: "UP",
        s: "DOWN",
        S: "DOWN",
        a: "LEFT",
        A: "LEFT",
        d: "RIGHT",
        D: "RIGHT",
      };

      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        dispatch({ type: "CHANGE_DIRECTION", direction: dir });
      }
    },
    [state.gameStatus],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 开始 / 重新开始
  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  // 渲染网格线
  const gridLines = [];
  for (let i = 0; i <= GRID_SIZE; i++) {
    gridLines.push(
      <Rect
        key={`h${i}`}
        x={0}
        y={i * CELL_SIZE - 0.5}
        width={CANVAS_SIZE}
        height={1}
        fill={GRID_LINE_COLOR}
      />,
      <Rect
        key={`v${i}`}
        x={i * CELL_SIZE - 0.5}
        y={0}
        width={1}
        height={CANVAS_SIZE}
        fill={GRID_LINE_COLOR}
      />,
    );
  }

  const { snake, food, gameStatus, score } = state;

  return (
    <div className="flex flex-col items-center h-full">
      {/* 分数显示 */}
      <div className="flex items-center justify-between w-full max-w-[400px] mb-4 px-2">
        <div>
          <span className="text-xs text-gray-400">当前得分</span>
          <div className="text-2xl font-bold amount text-indigo-600">
            {score}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">最高分</span>
          <div className="text-lg font-semibold text-gray-500">
            {highScore}
          </div>
        </div>
      </div>

      {/* 游戏画布 + 覆盖层 */}
      <div className="relative rounded-xl overflow-hidden shadow-lg border-4 border-indigo-200">
        <Stage width={CANVAS_SIZE} height={CANVAS_SIZE}>
          <Layer>
            {/* 背景 */}
            <Rect
              x={0}
              y={0}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              fill={BG_COLOR}
            />

            {/* 网格线 */}
            {gridLines}

            {/* 食物 */}
            <Circle
              x={food.x * CELL_SIZE + CELL_SIZE / 2}
              y={food.y * CELL_SIZE + CELL_SIZE / 2}
              radius={CELL_SIZE / 2 - 2}
              fill={FOOD_COLOR}
            />

            {/* 蛇身 */}
            {snake.map((seg, i) => (
              <Rect
                key={`${seg.x}-${seg.y}-${i}`}
                x={seg.x * CELL_SIZE + 1}
                y={seg.y * CELL_SIZE + 1}
                width={CELL_SIZE - 2}
                height={CELL_SIZE - 2}
                fill={i === 0 ? SNAKE_HEAD_COLOR : SNAKE_COLOR}
                cornerRadius={i === 0 ? 5 : 3}
              />
            ))}
          </Layer>
        </Stage>

        {/* 待开始 / 结束覆盖层 */}
        {gameStatus !== "running" && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-xl">
            {gameStatus === "idle" && (
              <>
                <p className="text-white text-3xl mb-2">🐍</p>
                <p className="text-white text-lg font-bold mb-3">贪吃蛇</p>
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg
                             hover:bg-indigo-600 active:scale-95 transition-all cursor-pointer"
                >
                  开始游戏
                </button>
                <p className="text-white/60 text-xs mt-3">
                  方向键 或 WASD 控制方向
                </p>
              </>
            )}
            {gameStatus === "gameOver" && (
              <>
                <p className="text-white text-3xl mb-2">💀</p>
                <p className="text-white text-lg font-bold mb-1">游戏结束</p>
                <p className="text-white/80 text-sm mb-4">
                  得分：{score}
                  {score >= highScore && score > 0 && (
                    <span className="text-yellow-300 ml-1">🏆 新纪录！</span>
                  )}
                </p>
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg
                             hover:bg-indigo-600 active:scale-95 transition-all cursor-pointer"
                >
                  重新开始
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 操作提示 */}
      <p className="mt-4 text-xs text-gray-400">
        方向键 ↑↓←→ 或 WASD 控制方向
      </p>
    </div>
  );
}
