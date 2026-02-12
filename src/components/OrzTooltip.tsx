import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type OrzTooltipProps = {
  title: string;
  description?: string;
  meta?: string;
  children: React.ReactNode;
};

export function OrzTooltip({ title, description, meta, children }: OrzTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, close]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
          if (e.key === "Escape") {
            close();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2"
          >
            <div
              className="relative overflow-hidden rounded-sm border px-3.5 py-3 text-xs shadow-lg"
              style={{
                borderColor: "var(--orz-border)",
                backgroundColor: "rgba(255,255,255,0.96)",
                boxShadow: "var(--orz-shadow-lg)",
              }}
            >
              <span className="ornament-corner ornament-corner-tl" />
              <span className="ornament-corner ornament-corner-br" />
              <div className="space-y-1.5">
                <p
                  className="font-medium"
                  style={{ color: "var(--orz-ink)" }}
                >
                  {title}
                </p>
                {description && (
                  <p
                    className="leading-snug"
                    style={{ color: "var(--orz-ink-muted)" }}
                  >
                    {description}
                  </p>
                )}
                {meta && (
                  <p
                    className="text-[0.7rem]"
                    style={{ color: "var(--orz-ink-faint)" }}
                  >
                    出处：{meta}
                  </p>
                )}
              </div>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-full -mt-[1px] h-2 w-2 -translate-x-1/2 rotate-45 border-t border-l"
              style={{
                borderColor: "var(--orz-border)",
                backgroundColor: "rgba(255,255,255,0.96)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

