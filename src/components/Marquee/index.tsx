import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
  const [contentSize, setContentSize] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isHorizontal = direction === "left" || direction === "right";
  const isReverse = direction === "right" || direction === "down";

  // 格式化尺寸值
  const formatSize = (
    size: number | string | undefined
  ): string | undefined => {
    if (size === undefined) return undefined;
    return typeof size === "number" ? `${size}px` : size;
  };

  // 测量内容尺寸
  useEffect(() => {
    const measureContent = () => {
      if (contentRef.current) {
        const size = isHorizontal
          ? contentRef.current.scrollWidth
          : contentRef.current.scrollHeight;
        setContentSize(size + gap);
      }
    };

    measureContent();

    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(measureContent);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children, gap, isHorizontal]);

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

  // 处理暂停/恢复
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsHovered(true);
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsHovered(false);
      setIsPaused(false);
    }
  };

  // 计算动画属性
  const getAnimationProps = () => {
    if (!autoStart || contentSize === 0) {
      return {};
    }

    const duration = contentSize / speed;

    if (isHorizontal) {
      const startX = isReverse ? -contentSize : 0;
      const endX = isReverse ? 0 : -contentSize;

      return {
        animate: isHovered ? {} : { x: [startX, endX] },
        transition: {
          duration,
          ease: "linear" as const,
          repeat: Infinity,
          repeatType: "loop" as const,
        },
      };
    } else {
      const startY = isReverse ? -contentSize : 0;
      const endY = isReverse ? 0 : -contentSize;

      return {
        animate: isHovered ? {} : { y: [startY, endY] },
        transition: {
          duration,
          ease: "linear" as const,
          repeat: Infinity,
          repeatType: "loop" as const,
        },
      };
    }
  };

  const animationProps = getAnimationProps();

  // 容器样式
  const containerStyle: React.CSSProperties = {
    width: formatSize(width),
    height: formatSize(height),
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        {...animationProps}
        className={`flex ${isHorizontal ? "flex-row" : "flex-col"}`}
      >
        {Array.from({ length: repeat }).map((_, index) => (
          <div
            key={index}
            ref={index === 0 ? contentRef : null}
            className={`flex-shrink-0 ${
              isHorizontal ? "flex flex-row" : "flex flex-col"
            }`}
            style={
              isHorizontal
                ? { marginRight: index < repeat - 1 ? `${gap}px` : 0 }
                : { marginBottom: index < repeat - 1 ? `${gap}px` : 0 }
            }
          >
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
