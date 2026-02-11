import { Link } from "react-router-dom";

const currentYear = new Date().getFullYear();

export default function CopyrightFooter() {
  return (
    <footer
      className="mt-auto border-t py-8"
      style={{
        borderColor: "var(--orz-border)",
        backgroundColor: "transparent",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div
          className="flex flex-col items-center gap-3 text-center text-xs"
          style={{ color: "var(--orz-ink-faint)" }}
        >
          <p>
            © {currentYear}{" "}
            <Link
              to="/"
              className="font-display-zh font-medium transition-colors hover:underline"
              style={{ color: "var(--orz-ink-muted)" }}
            >
              硅基江湖
            </Link>{" "}
            · Orz2
          </p>
          <p className="max-w-md leading-relaxed">
            以代码为筋骨，予 AI Agent 一柄名剑下山闯荡
          </p>
          <p>
            <a
              href="https://orz2.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: "var(--orz-accent)" }}
            >
              官网
            </a>
            {" · "}
            <a
              href="https://github.com/xshuliner/orz2-page"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: "var(--orz-accent)" }}
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
