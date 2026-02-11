import { Marquee } from "@/src/components/Marquee";

/**
 * 走马灯组件使用示例
 */
export default function DemoMarqueePage() {
  const handleScrollComplete = () => {
    console.log("滚动完成一轮！");
  };

  return (
    <div className="space-y-8 p-8">
      {/* 示例1：基础水平滚动 - 指定宽度 */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          基础水平滚动（固定宽度 800px）
        </h3>
        <Marquee
          speed={50}
          width={800}
          className="bg-gray-100 py-4 mx-auto"
          onComplete={handleScrollComplete}
        >
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold text-blue-600">
              🎉 欢迎来到 Orz2
            </span>
            <span className="text-2xl font-bold text-green-600">
              ✨ 硅基江湖
            </span>
            <span className="text-2xl font-bold text-purple-600">
              🚀 AI 侠客下山闯江湖
            </span>
            <span className="text-2xl font-bold text-orange-600">
              💫 探索无限可能
            </span>
          </div>
        </Marquee>
      </div>

      {/* 示例2：向右滚动 + 鼠标悬停暂停 - 百分比宽度 */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          向右滚动（鼠标悬停暂停，宽度 100%）
        </h3>
        <Marquee
          speed={30}
          direction="right"
          pauseOnHover
          width="100%"
          className="bg-gradient-to-r from-blue-500 to-purple-500 py-4"
        >
          <div className="flex items-center gap-6">
            {[
              "React",
              "TypeScript",
              "Vite",
              "TailwindCSS",
              "Framer Motion",
            ].map((tech) => (
              <div
                key={tech}
                className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-gray-800 shadow-md"
              >
                {tech}
              </div>
            ))}
          </div>
        </Marquee>
      </div>

      {/* 示例3：垂直滚动 - 指定高度 */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">垂直滚动（高度 150px）</h3>
        <Marquee
          speed={40}
          direction="up"
          height={150}
          width="100%"
          className="bg-gray-100 px-4"
          gap={16}
        >
          <div className="space-y-4">
            <div className="rounded border-l-4 border-blue-500 bg-white p-3">
              <p className="text-sm font-medium">
                📢 系统公告：欢迎使用走马灯组件
              </p>
            </div>
            <div className="rounded border-l-4 border-green-500 bg-white p-3">
              <p className="text-sm font-medium">✅ 支持水平和垂直滚动</p>
            </div>
            <div className="rounded border-l-4 border-purple-500 bg-white p-3">
              <p className="text-sm font-medium">🎨 支持自定义内容和样式</p>
            </div>
            <div className="rounded border-l-4 border-orange-500 bg-white p-3">
              <p className="text-sm font-medium">
                ⚡ 基于 Framer Motion 流畅动画
              </p>
            </div>
          </div>
        </Marquee>
      </div>

      {/* 示例4：自定义速度和重复次数 - 视口宽度 */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          快速滚动（宽度 90vw，自定义重复次数）
        </h3>
        <Marquee
          speed={100}
          repeat={3}
          width="90vw"
          className="bg-gradient-to-r from-pink-500 to-yellow-500 py-3 mx-auto"
        >
          <div className="flex items-center gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-800 shadow-lg"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </Marquee>
      </div>

      {/* 示例5：图片走马灯 - 固定宽高 */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          图片走马灯（宽度 600px，高度 120px）
        </h3>
        <Marquee
          speed={60}
          pauseOnHover
          width={600}
          height={120}
          className="bg-gray-900 mx-auto"
          gap={32}
        >
          <div className="flex items-center gap-8 h-full py-6">
            {["🎭", "🎨", "🎪", "🎬", "🎮", "🎲", "🎯", "🎸"].map(
              (emoji, i) => (
                <div
                  key={i}
                  className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-600 text-5xl shadow-xl"
                >
                  {emoji}
                </div>
              )
            )}
          </div>
        </Marquee>
      </div>
    </div>
  );
}
