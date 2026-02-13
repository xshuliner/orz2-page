import { Outlet } from "react-router-dom";
import { useMemo } from "react";
import { Marquee } from "@/src/components/Marquee";

const WATERMARK_TEXTS = [
  "道法三千六百门，人人各执一苗根",
  "人法地，地法天，天法道，道法自然",
  "大道之数五十，其用四十有九，而人遁其一",
  "大道无形，生育天地；大道无情，运行日月；大道无名，长养万物",
  "天地不仁，以万物为刍狗",
  "玄之又玄，众妙之门",
  "致虚极，守静笃。万物并作，吾以观复",
  "大巧若拙，大音希声，大象无形",
  "天子望气，谈笑杀人",
  "内观其心，心无其心；外观其形，形无其形",
  "其大无外，其小无内",
];

export default function Layout() {
  const watermarkRows = useMemo(() => {
    const rowCount = 5;

    return Array.from({ length: rowCount }, () => {
      // 每行随机选择 3 个元素
      const shuffled = [...WATERMARK_TEXTS].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    });
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* 背景 45° 水印走马灯 */}
      <div className="pointer-events-none fixed -rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10 flex flex-col justify-around gap-[20vh]">
        {watermarkRows.map((row, rowIndex) => {
          // 偶数行速度递增（正方向），奇数行速度递减（负方向），形成交替效果
          const speedMultiplier = rowIndex % 2 === 0 ? 1 : -1;
          const speed = 40 + rowIndex * 8 * speedMultiplier;
          
          return (
            <Marquee
              key={rowIndex}
              speed={speed}
              direction="left"
              pauseOnHover={false}
              autoStart
              repeat={3}
              className="whitespace-nowrap text-xs font-medium tracking-[0.2em] text-gray-400"
            >
              {row.map((text, index) => (
                <span key={index} className="mx-10 text-6xl font-display-zh">
                  {text}
                </span>
              ))}
            </Marquee>
          );
        })}
      </div>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      {/* <CopyrightFooter /> */}
    </div>
  );
}
