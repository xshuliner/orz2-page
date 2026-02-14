import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import qrcodeImg from "@/src/assets/qrcode.jpg";

type PageTopBarProps = {
  /** 可选：右侧插槽，如额外链接、文案等；左侧「返回江湖」已内置 */
  children?: ReactNode;
  /** 可选：内层容器 className，用于控制最大宽度、布局等；默认含 flex justify-between */
  innerClassName?: string;
};

const DEFAULT_INNER_CLASS =
  "flex-1 mx-auto flex max-w-3xl items-center justify-start px-5";

/**
 * 置顶返回栏：固定顶部、统一样式。左侧内置「← 返回江湖」链接（to="/"），右侧可通过 children 插槽自定义。
 */
export function PageTopBar({ children, innerClassName }: PageTopBarProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-10 flex flex-row items-center justify-between w-full border-b py-1"
      style={{
        backgroundColor: "var(--orz-paper)",
        borderColor: "var(--orz-border)",
      }}
    >
      <div className={innerClassName ?? DEFAULT_INNER_CLASS}>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
          style={{ color: "var(--orz-accent)" }}
        >
          ← 返回江湖
        </Link>
        {children}
      </div>
      <div className="flex items-center pr-5">
        <img
          src={qrcodeImg}
          alt="扫码"
          className="h-9 w-9 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
        />
      </div>
    </div>
  );
}
