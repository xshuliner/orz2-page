# Marquee 走马灯组件

一个优雅的走马灯组件，基于 React + TypeScript + Framer Motion 实现，支持水平和垂直方向的无缝滚动效果。

## 特性

- ✨ 支持水平（左/右）和垂直（上/下）四个方向的滚动
- 🎯 自动检测内容尺寸，适配动态内容
- 🔄 无缝循环滚动，视觉效果流畅
- ⏸️ 支持鼠标悬停暂停
- 🎨 完全自定义内容和样式
- 📢 滚动完成事件回调
- ⚡ 基于 Framer Motion，性能优秀
- 🔧 丰富的配置选项

## 安装依赖

组件依赖以下库（项目已安装）：

```json
{
  "framer-motion": "^12.0.0",
  "react": "^19.0.0"
}
```

## 基础使用

```tsx
import { Marquee } from './components/Marquee';

function App() {
  return (
    <Marquee>
      <div className="flex items-center gap-8">
        <span>内容 1</span>
        <span>内容 2</span>
        <span>内容 3</span>
      </div>
    </Marquee>
  );
}
```

## API 参数

### MarqueeProps

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | **必填** | 走马灯显示的内容 |
| `speed` | `number` | `50` | 滚动速度（像素/秒） |
| `direction` | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | 滚动方向 |
| `pauseOnHover` | `boolean` | `false` | 鼠标悬停时是否暂停滚动 |
| `autoStart` | `boolean` | `true` | 是否自动开始滚动 |
| `onComplete` | `() => void` | `undefined` | 每次滚动完成后的回调函数 |
| `className` | `string` | `''` | 容器的自定义类名 |
| `gap` | `number` | `20` | 重复内容之间的间隙（px） |
| `repeat` | `number` | `2` | 内容重复次数，用于填充视口 |
| `width` | `number \| string` | `undefined` | 容器宽度，支持数字（px）或字符串（如 "100%", "500px", "80vw"） |
| `height` | `number \| string` | `undefined` | 容器高度，支持数字（px）或字符串（如 "100px", "50vh", "200px"） |

## 使用示例

### 1. 基础水平滚动

```tsx
<Marquee speed={50} width="100%">
  <div className="flex gap-8">
    <span>🎉 欢迎来到 Orz2</span>
    <span>✨ 硅基江湖</span>
    <span>🚀 AI 侠客下山闯江湖</span>
  </div>
</Marquee>
```

### 2. 向右滚动 + 鼠标悬停暂停

```tsx
<Marquee 
  speed={30} 
  direction="right" 
  pauseOnHover
>
  <div className="flex gap-6">
    {['React', 'TypeScript', 'Vite'].map(tech => (
      <div key={tech} className="badge">{tech}</div>
    ))}
  </div>
</Marquee>
```

### 3. 垂直滚动

```tsx
<Marquee 
  speed={40} 
  direction="up" 
  height={200}
  width="100%"
  gap={16}
>
  <div className="space-y-4">
    <div className="notification">📢 系统公告 1</div>
    <div className="notification">📢 系统公告 2</div>
    <div className="notification">📢 系统公告 3</div>
  </div>
</Marquee>
```

### 4. 监听滚动完成事件

```tsx
const handleComplete = () => {
  console.log('滚动完成一轮！');
  // 可以在这里触发其他逻辑
  // 例如：更新计数、发送统计、刷新内容等
};

<Marquee 
  speed={50}
  onComplete={handleComplete}
>
  <div className="content">...</div>
</Marquee>
```

### 5. 动态内容

```tsx
const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

// 组件会自动检测内容变化并重新计算尺寸
<Marquee speed={60}>
  <div className="flex gap-4">
    {items.map(item => (
      <div key={item}>{item}</div>
    ))}
  </div>
</Marquee>
```

### 6. 快速滚动 + 增加重复次数

```tsx
<Marquee 
  speed={100} 
  repeat={3}  // 内容重复3次，确保填满整个视口
  gap={32}
>
  <div className="flex gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="card">{i + 1}</div>
    ))}
  </div>
</Marquee>
```

## 高级用法

### 尺寸控制

组件支持灵活的尺寸控制，可以使用多种单位：

```tsx
{/* 固定像素值（数字） */}
<Marquee width={800} height={100}>
  <div>内容</div>
</Marquee>

{/* 百分比（字符串） */}
<Marquee width="100%" height="50%">
  <div>内容</div>
</Marquee>

{/* 视口单位 */}
<Marquee width="90vw" height="20vh">
  <div>内容</div>
</Marquee>

{/* CSS 计算 */}
<Marquee width="calc(100% - 40px)" height={150}>
  <div>内容</div>
</Marquee>

{/* 仅设置宽度，高度自适应内容 */}
<Marquee width={600}>
  <div className="py-4">内容</div>
</Marquee>

{/* 仅设置高度，用于垂直滚动 */}
<Marquee direction="up" height={300}>
  <div>内容</div>
</Marquee>
```

### 响应式设计

```tsx
<Marquee 
  speed={50}
  className="w-full bg-gray-100 py-4 md:py-6 lg:py-8"
>
  <div className="flex gap-4 md:gap-6 lg:gap-8">
    {/* 内容会根据容器自动调整 */}
  </div>
</Marquee>
```

### 结合 TailwindCSS 渐变效果

```tsx
<div className="relative">
  {/* 渐变遮罩层 */}
  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-white via-transparent to-white" />
  
  <Marquee speed={50} className="py-4">
    <div className="flex gap-8">
      {/* 内容 */}
    </div>
  </Marquee>
</div>
```

### 多行走马灯

```tsx
<div className="space-y-2">
  <Marquee speed={50} direction="left">
    <div className="flex gap-6">{/* 第一行内容 */}</div>
  </Marquee>
  
  <Marquee speed={40} direction="right">
    <div className="flex gap-6">{/* 第二行内容（反向）*/}</div>
  </Marquee>
</div>
```

## 性能优化建议

1. **合理设置 `repeat` 参数**：根据内容数量和容器宽度调整，避免过多重复导致性能问题
2. **使用 `pauseOnHover`**：在不需要交互时避免启用，减少事件监听
3. **优化子内容**：避免在 `children` 中渲染过于复杂的组件
4. **固定容器尺寸**：为走马灯容器设置固定的宽度/高度，避免布局抖动

## 注意事项

1. **内容长度**：确保内容长度足够或适当增加 `repeat` 参数，避免出现空白
2. **滚动方向**：垂直滚动时需要设置 `height` 参数或通过 `className` 设置固定高度
3. **尺寸单位**：`width` 和 `height` 支持数字（自动转为 px）或任意 CSS 单位字符串
4. **动画性能**：`speed` 参数不宜过大，建议范围 20-200 像素/秒
5. **回调频率**：`onComplete` 回调会在每次完整滚动后触发，注意避免执行耗时操作
6. **优先级**：如果同时设置了 `width`/`height` 参数和 `className` 中的尺寸样式，内联样式优先级更高

## 浏览器兼容性

支持所有现代浏览器：
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## 许可证

MIT License
