import { useEffect, useRef, useState, useMemo, useCallback, type ReactNode, memo } from "react";

export interface MarqueeProps {
  /** 走马灯内容 */
  children: ReactNode;
  /** 滚动速度（像素/秒），默认 50 */
  speed?: number;
  /** 滚动方向，默认 'left' */
  direction?: "left" | "right" | "up" | "down";
  /** 是否暂停滚动，默认 false */
  pauseOnHover?: boolean;
  /** 是否自动开始，默认 true */
  autoStart?: boolean;
  /** 每次滚动完成后的回调函数 */
  onComplete?: () => void;
  /** 容器类名 */
  className?: string;
  /** 内容间隙（px），默认 20 */
  gap?: number;
  /** 重复次数，用于填充视口，默认 2 */
  repeat?: number;
  /** 容器宽度，支持数字（px）或字符串（如 "100%", "500px"） */
  width?: number | string;
  /** 容器高度，支持数字（px）或字符串（如 "100px", "50vh"） */
  height?: number | string;
}

// 子组件：单个内容项，使用 memo 优化
const MarqueeItem = memo<{ 
  children: ReactNode; 
  isHorizontal: boolean; 
  gap: number; 
  isLast: boolean;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}>(({ children, isHorizontal, gap, isLast, innerRef }) => (
  <div
    ref={innerRef}
    className={`flex-shrink-0 ${isHorizontal ? "flex flex-row" : "flex flex-col"}`}
    style={
      isHorizontal
        ? { marginRight: !isLast ? `${gap}px` : 0 }
        : { marginBottom: !isLast ? `${gap}px` : 0 }
    }
  >
    {children}
  </div>
));

MarqueeItem.displayName = "MarqueeItem";

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  speed = 50,
  direction = "left",
  pauseOnHover = false,
  autoStart = true,
  onComplete,
  className = "",
  gap = 20,
  repeat = 2,
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationIdRef = useRef<string>("");

  const isHorizontal = useMemo(() => direction === "left" || direction === "right", [direction]);
  const isReverse = useMemo(() => direction === "right" || direction === "down", [direction]);

  // 格式化尺寸值 - 使用 useCallback 优化
  const formatSize = useCallback((
    size: number | string | undefined
  ): string | undefined => {
    if (size === undefined) return undefined;
    return typeof size === "number" ? `${size}px` : size;
  }, []);

  // 测量内容尺寸 - 添加防抖优化
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const measureContent = () => {
      // 防抖处理
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (contentRef.current) {
          const size = isHorizontal
            ? contentRef.current.scrollWidth
            : contentRef.current.scrollHeight;
          setContentSize(size + gap);
        }
      }, 100);
    };

    measureContent();

    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(measureContent);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [children, gap, isHorizontal]);

  // 生成唯一的动画名称
  useEffect(() => {
    animationIdRef.current = `marquee-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 动态注入 CSS 动画
  useEffect(() => {
    if (contentSize === 0 || !autoStart) return;

    const duration = contentSize / speed;
    const animationName = animationIdRef.current;

    // 创建 style 标签
    const styleId = `${animationName}-style`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // 定义关键帧动画
    if (isHorizontal) {
      const startX = isReverse ? -contentSize : 0;
      const endX = isReverse ? 0 : -contentSize;
      styleElement.textContent = `
        @keyframes ${animationName} {
          0% { transform: translate3d(${startX}px, 0, 0); }
          100% { transform: translate3d(${endX}px, 0, 0); }
        }
      `;
    } else {
      const startY = isReverse ? -contentSize : 0;
      const endY = isReverse ? 0 : -contentSize;
      styleElement.textContent = `
        @keyframes ${animationName} {
          0% { transform: translate3d(0, ${startY}px, 0); }
          100% { transform: translate3d(0, ${endY}px, 0); }
        }
      `;
    }

    // 应用动画到元素
    if (animationRef.current) {
      animationRef.current.style.animation = `${animationName} ${duration}s linear infinite`;
    }

    // 清理函数
    return () => {
      const elem = document.getElementById(styleId);
      if (elem) {
        elem.remove();
      }
    };
  }, [contentSize, speed, isHorizontal, isReverse, autoStart]);

  // 监听动画完成
  useEffect(() => {
    if (!onComplete || contentSize === 0) return;

    const duration = contentSize / speed;
    const interval = setInterval(() => {
      if (!isPaused) {
        onComplete();
      }
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [onComplete, contentSize, speed, isPaused]);

  // 处理暂停/恢复 - 使用 useCallback 优化
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(true);
      if (animationRef.current) {
        animationRef.current.style.animationPlayState = "paused";
      }
    }
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) {
      setIsPaused(false);
      if (animationRef.current) {
        animationRef.current.style.animationPlayState = "running";
      }
    }
  }, [pauseOnHover]);

  // 容器样式 - 使用 useMemo 优化
  const containerStyle = useMemo<React.CSSProperties>(() => ({
    width: formatSize(width),
    height: formatSize(height),
  }), [width, height, formatSize]);

  // 动画容器样式 - 使用 useMemo 优化
  const animationStyle = useMemo<React.CSSProperties>(() => ({
    willChange: isHorizontal ? "transform" : "transform",
    backfaceVisibility: "hidden",
    perspective: 1000,
  }), [isHorizontal]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={animationRef}
        className={`flex ${isHorizontal ? "flex-row" : "flex-col"}`}
        style={animationStyle}
      >
        {Array.from({ length: repeat }).map((_, index) => (
          <MarqueeItem
            key={index}
            isHorizontal={isHorizontal}
            gap={gap}
            isLast={index === repeat - 1}
            innerRef={index === 0 ? contentRef : undefined}
          >
            {children}
          </MarqueeItem>
        ))}
      </div>
    </div>
  );
};
