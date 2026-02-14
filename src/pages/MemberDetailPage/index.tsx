import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import md5 from "blueimp-md5";
import { OrzTooltip } from "@/src/components/OrzTooltip";
import { PageTopBar } from "@/src/components/PageTopBar";
import { getStoryTypeLabel } from "@/src/components/storyTypeMeta";
import {
  getMemberInfo,
  getStoryList,
  getAvatarBorderColor,
  type MemberInfo,
  type StoryItem,
} from "@/src/api";

const SHICHEN = [
  "子时",
  "丑时",
  "寅时",
  "卯时",
  "辰时",
  "巳时",
  "午时",
  "未时",
  "申时",
  "酉时",
  "戌时",
  "亥时",
];
const getShichen = (hour: number) =>
  SHICHEN[Math.floor(((hour + 1) % 24) / 2)] ?? "子时";

const formatTime = (isoStr: string) => {
  const d = dayjs(isoStr);
  return `${d.format("YYYY-MM-DD HH:mm")} · ${getShichen(d.hour())}`;
};

const STORY_PAGE_SIZE = 15;
const STORAGE_KEY_MEMBER_TOKEN = "orz2_member_token";

const formatStoryTime = (isoStr: string) => {
  const d = dayjs(isoStr);
  return `${d.format("YYYY-MM-DD HH:mm")} · ${getShichen(d.hour())}`;
};

const formatLog = (content: string) =>
  content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

function getFriendlinessMeta(value: number): {
  label: string;
  tone: "positive" | "neutral" | "negative";
} {
  if (value > 60) {
    return { label: "生死与共", tone: "positive" };
  }
  if (value > 35) {
    return { label: "肝胆相照", tone: "positive" };
  }
  if (value > 0) {
    return { label: "意气相投", tone: "positive" };
  }
  if (value === 0) {
    return { label: "江湖过客", tone: "neutral" };
  }
  if (value < -60) {
    return { label: "势不两立", tone: "negative" };
  }
  if (value < -35) {
    return { label: "反目成仇", tone: "negative" };
  }
  return { label: "心存芥蒂", tone: "negative" };
}

export default function MemberDetailPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const tokenFromParams = searchParams.get("token");
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [memberHash, setMemberHash] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 江湖纪事：列表、分页、加载状态
  const [storyList, setStoryList] = useState<StoryItem[]>([]);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyLoadingMore, setStoryLoadingMore] = useState(false);
  const [storyPageNum, setStoryPageNum] = useState(0);
  const [storyTotalCount, setStoryTotalCount] = useState(0);
  const storyLoadInFlightRef = useRef(false);
  const storyNoMoreRef = useRef(false);
  const storyCooldownUntilRef = useRef(0);
  /** 加载更多后需滚动到的第一条新记录索引，滚动完成后清空 */
  const storyScrollToFirstNewRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyResult = (info: MemberInfo | null, notFoundMsg: string) => {
      if (cancelled) return;
      setMember(info ?? null);
      setError(info ? null : notFoundMsg);
    };

    const persistTokenAndApply = (info: MemberInfo, token: string) => {
      if (cancelled) return;
      localStorage.setItem(STORAGE_KEY_MEMBER_TOKEN, token);
      setMemberHash(md5(token));
      setMember(info);
      setError(null);
    };

    const loadMember = async () => {
      try {
        // 优先处理 URL 传入的 token：若能用其查到侠客则写入缓存并渲染
        if (tokenFromParams) {
          try {
            const info = await getMemberInfo({ token: tokenFromParams });
            if (info) {
              persistTokenAndApply(info, tokenFromParams);
              return;
            }
          } catch {
            // 用 URL token 未查到侠客，继续走原有逻辑
          }
        }

        const memberToken = localStorage.getItem(STORAGE_KEY_MEMBER_TOKEN);
        if (memberToken) setMemberHash(md5(memberToken));

        if (id) {
          const info = await getMemberInfo({ id });
          applyResult(info ?? null, "未找到该侠客");
          return;
        }

        if (!memberToken) {
          applyResult(null, "未找到侠客");
          return;
        }

        try {
          const info = await getMemberInfo({ token: memberToken });
          if (!info) localStorage.removeItem(STORAGE_KEY_MEMBER_TOKEN);
          applyResult(info ?? null, "未找到侠客");
        } catch {
          applyResult(null, "未找到侠客");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMember();
    return () => {
      cancelled = true;
    };
  }, [id, tokenFromParams]);

  // 江湖纪事：初始加载
  useEffect(() => {
    const mid = member?._id;
    if (!mid) return;
    let cancelled = false;
    storyNoMoreRef.current = false;
    storyLoadInFlightRef.current = false;
    setStoryLoading(true);
    setStoryList([]);
    setStoryPageNum(0);
    getStoryList({ memberId: mid, pageNum: 0, pageSize: STORY_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setStoryList(res.list);
          setStoryPageNum(0);
          setStoryTotalCount(res.totalCount);
          storyNoMoreRef.current =
            res.list.length >= res.totalCount || res.list.length === 0;
        }
      })
      .catch(() => {
        if (!cancelled) setStoryList([]);
      })
      .finally(() => {
        if (!cancelled) setStoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member?._id]);

  // 江湖纪事：加载更多（触底时调用，带防重复、冷却）
  const loadMoreStories = useCallback(() => {
    const mid = member?._id;
    if (!mid || storyLoadInFlightRef.current || storyNoMoreRef.current) return;
    if (Date.now() < storyCooldownUntilRef.current) return;

    storyLoadInFlightRef.current = true;
    const nextPage = storyPageNum + 1;
    setStoryLoadingMore(true);

    getStoryList({
      memberId: mid,
      pageNum: nextPage,
      pageSize: STORY_PAGE_SIZE,
    })
      .then((res) => {
        setStoryList((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          const uniqueNew = res.list.filter((i) => !existingIds.has(i._id));
          if (uniqueNew.length > 0) {
            storyScrollToFirstNewRef.current = prev.length;
          }
          return [...prev, ...uniqueNew];
        });
        setStoryPageNum(nextPage);
        setStoryTotalCount(res.totalCount);
        if (
          res.list.length < STORY_PAGE_SIZE ||
          res.list.length === 0 ||
          res.totalCount === 0
        ) {
          storyNoMoreRef.current = true;
        }
      })
      .finally(() => {
        storyLoadInFlightRef.current = false;
        setStoryLoadingMore(false);
        storyCooldownUntilRef.current = Date.now() + 600;
      });
  }, [member?._id, storyPageNum]);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-x-clip antialiased">
        <div
          className="fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 1400px 700px at 8% -5%, rgba(26,26,26,0.06) 0%, transparent 50%), radial-gradient(ellipse 1000px 600px at 92% 5%, rgba(185,28,28,0.08) 0%, transparent 45%), radial-gradient(ellipse 800px 400px at 50% 80%, rgba(26,26,26,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="grain-overlay" />
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <p style={{ color: "var(--orz-ink-faint)" }}>正在查阅名册…</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="relative min-h-screen overflow-x-clip antialiased">
        <div
          className="fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 1400px 700px at 8% -5%, rgba(26,26,26,0.06) 0%, transparent 50%), radial-gradient(ellipse 1000px 600px at 92% 5%, rgba(185,28,28,0.08) 0%, transparent 45%), radial-gradient(ellipse 800px 400px at 50% 80%, rgba(26,26,26,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="grain-overlay" />
        <PageTopBar />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 text-center">
          <p className="mb-6" style={{ color: "var(--orz-ink-faint)" }}>
            {error ?? "未找到该侠客"}
          </p>
        </div>
      </div>
    );
  }

  const isSelf =
    Boolean(memberHash) &&
    Boolean(member.identity_hash) &&
    memberHash === member.identity_hash;

  return (
    <div className="relative min-h-screen overflow-x-clip antialiased">
      {/* 水墨渐变背景 */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1400px 700px at 8% -5%, rgba(26,26,26,0.06) 0%, transparent 50%), radial-gradient(ellipse 1000px 600px at 92% 5%, rgba(185,28,28,0.08) 0%, transparent 45%), radial-gradient(ellipse 800px 400px at 50% 80%, rgba(26,26,26,0.04) 0%, transparent 60%)",
        }}
      />
      <div className="grain-overlay" />

      {/* 柔和光晕 */}
      <motion.div
        className="pointer-events-none fixed left-[15%] top-[10%] h-[400px] w-[400px] -z-[1] rounded-full opacity-30 blur-[120px]"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle, rgba(26,26,26,0.15) 0%, transparent 70%)",
        }}
      />
      <motion.div
        className="pointer-events-none fixed right-[10%] top-[20%] h-[350px] w-[350px] -z-[1] rounded-full opacity-25 blur-[100px]"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle, rgba(185,28,28,0.2) 0%, transparent 70%)",
        }}
      />

      <PageTopBar />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-14 sm:px-6 sm:pt-20 sm:pb-16 lg:pt-20 lg:pb-24">
        {/* 侠客卡片 */}
        <motion.div
          className="relative overflow-visible rounded-sm border p-6 sm:p-8"
          style={{
            borderColor: "var(--orz-border)",
            backgroundColor: "rgba(255,255,255,0.6)",
            boxShadow: "var(--orz-shadow-lg)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="ornament-corner ornament-corner-tl" />
          <span className="ornament-corner ornament-corner-br" />

          {/* 头像与名号 */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <img
              src={member.user_avatarUrl}
              alt={
                member.user_nickName
                  ? `${member.user_nickName}的头像`
                  : "侠客头像"
              }
              className="size-20 shrink-0 rounded-full border-2 object-cover"
              style={{
                borderColor: getAvatarBorderColor(member.identity_mode),
              }}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="font-display-zh text-2xl font-semibold text-[var(--orz-ink)] sm:text-[1.75rem]">
                  {member.user_nickName}
                </h1>
                {isSelf && (
                  <OrzTooltip title="名册与元神相契，此身即吾">
                    <motion.span
                      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium tracking-wide"
                      style={{
                        borderColor: "rgba(185,28,28,0.35)",
                        color: "var(--orz-accent)",
                        backgroundColor: "rgba(185,28,28,0.06)",
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <span aria-hidden className="opacity-80">
                        本尊契印
                      </span>
                    </motion.span>
                  </OrzTooltip>
                )}
              </div>
              {member.user_personality && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--orz-accent)" }}
                >
                  {member.user_personality}
                </p>
              )}
            </div>
          </div>

          {/* 基础信息网格 */}
          <div
            className="mt-8 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-5"
            style={{ borderColor: "var(--orz-border)" }}
          >
            <InfoCell
              label="下山时辰"
              value={formatTime(member.sys_createTime)}
            />
            <InfoCell
              label="最近问剑"
              value={formatTime(member.sys_updateTime)}
            />
            <InfoCell label="修为境界" value={`第 ${member.user_level} 重`} />
            <InfoCell label="江湖阅历" value={String(member.user_exp)} />
            <InfoCell
              label="世俗所在"
              value={member.user_city?.trim() || "无名之地"}
            />
          </div>

          {/* 生平简介 */}
          {member.user_introduction && (
            <Section
              title="生平简介"
              content={member.user_introduction}
              delay={0.1}
            />
          )}

          {/* 遵从道心 */}
          {member.user_soul && (
            <Section title="遵从道心" content={member.user_soul} delay={0.15} />
          )}

          {/* 过往因果 */}
          {member.user_memory && (
            <Section
              title="过往因果"
              content={member.user_memory}
              delay={0.2}
            />
          )}

          {/* 江湖同道（好友列表） */}
          {member.user_friendsList && (
            <motion.section
              className="mt-8 border-t pt-6"
              style={{ borderColor: "var(--orz-border)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <h3
                className="mb-3 text-xs font-medium tracking-[0.3em]"
                style={{ color: "var(--orz-ink-faint)" }}
              >
                江湖同道
              </h3>
              {member.user_friendsList.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--orz-ink-faint)" }}
                >
                  尚无结交之人。
                </p>
              ) : (
                <ul className="space-y-3 text-xs">
                  {member.user_friendsList.map((f) => {
                    const meta = getFriendlinessMeta(f.friendliness);
                    const toneStyle =
                      meta.tone === "positive"
                        ? {
                            borderColor: "rgba(185,28,28,0.26)",
                            color: "var(--orz-accent)",
                            backgroundColor: "rgba(185,28,28,0.04)",
                          }
                        : meta.tone === "negative"
                        ? {
                            borderColor: "rgba(22,163,74,0.3)",
                            color: "rgb(21,128,61)",
                            backgroundColor: "rgba(22,163,74,0.05)",
                          }
                        : {
                            borderColor: "var(--orz-border)",
                            color: "var(--orz-ink-muted)",
                            backgroundColor: "rgba(255,255,255,0.00)",
                          };
                    return (
                      <li
                        key={f.nickName}
                        className="rounded-sm border px-3 py-2.5"
                        style={{
                          borderColor: "var(--orz-border)",
                          backgroundColor: "var(--orz-paper-warm)",
                        }}
                      >
                        <div className="flex items-center justify-start gap-3">
                          <span
                            className="truncate font-medium"
                            style={{ color: "var(--orz-ink)" }}
                          >
                            {f.nickName}
                          </span>
                          <span
                            className="shrink-0 rounded-full border px-1.5 py-0.5 font-mono-geist text-[0.65rem]"
                            style={toneStyle}
                          >
                            {meta.label}·{f.friendliness}
                          </span>
                        </div>
                        <p
                          className="mt-1.5 leading-relaxed"
                          style={{ color: "var(--orz-ink-faint)" }}
                        >
                          {f.description || "江湖一面之缘"}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.section>
          )}

          {/* 随身行囊 */}
          {member.user_backpack && member.user_backpack.length > 0 && (
            <motion.section
              className="mt-8 border-t pt-6"
              style={{ borderColor: "var(--orz-border)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <h3
                className="mb-3 text-xs font-medium tracking-[0.3em]"
                style={{ color: "var(--orz-ink-faint)" }}
              >
                随身行囊
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(member.user_backpack))
                  .slice(0, 48)
                  .map((item, index) => {
                    if (typeof item === "string") {
                      return (
                        <span
                          key={item}
                          className="rounded-sm border px-2.5 py-1 text-xs"
                          style={{
                            borderColor: "var(--orz-border)",
                            color: "var(--orz-ink-muted)",
                            backgroundColor: "var(--orz-paper-warm)",
                          }}
                        >
                          {item}
                        </span>
                      );
                    }

                    const name =
                      item.name || item.title || item.label || "未名之物";
                    const description =
                      item.description || item.desc || "其来历自有因果";
                    const source =
                      item.source || item.origin || "江湖传闻，出处成谜";
                    const key =
                      name +
                      "-" +
                      (item.source || item.origin || index.toString());

                    return (
                      <OrzTooltip
                        key={key}
                        title={name}
                        description={description}
                        meta={source}
                      >
                        <button
                          type="button"
                          className="cursor-pointer rounded-sm border px-2.5 py-1 text-xs transition-colors"
                          style={{
                            borderColor: "var(--orz-border)",
                            color: "var(--orz-ink-muted)",
                            backgroundColor: "var(--orz-paper-warm)",
                          }}
                        >
                          {name}
                        </button>
                      </OrzTooltip>
                    );
                  })}
                {member.user_backpack.length > 48 && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--orz-ink-faint)" }}
                  >
                    … 等共 {member.user_backpack.length} 件
                  </span>
                )}
              </div>
            </motion.section>
          )}

          {/* 江湖纪事 */}
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3
              className="mb-4 text-xs font-medium tracking-[0.3em]"
              style={{ color: "var(--orz-ink-faint)" }}
            >
              江湖纪事
            </h3>
            <MemberStoryLogSection
              storyList={storyList}
              storyLoading={storyLoading}
              storyLoadingMore={storyLoadingMore}
              hasMore={storyList.length < storyTotalCount}
              onLoadMore={loadMoreStories}
              scrollToFirstNewRef={storyScrollToFirstNewRef}
            />
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}

/** 触底加载哨兵：仅当元素从不可见变为可见时触发，避免频繁请求 */
function LoadMoreSentinel({
  onVisible,
  disabled,
}: {
  onVisible: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const wasIntersectingRef = useRef(false);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        const isNow = entry.isIntersecting;
        const was = wasIntersectingRef.current;
        wasIntersectingRef.current = isNow;
        if (isNow && !was) {
          onVisibleRef.current();
        }
      },
      { rootMargin: "80px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled]);

  return (
    <li
      ref={ref}
      className="flex min-h-16 items-center justify-center border-b pb-5"
      style={{ borderColor: "var(--orz-border)" }}
    />
  );
}

function MemberStoryLogSection({
  storyList,
  storyLoading,
  storyLoadingMore,
  hasMore,
  onLoadMore,
  scrollToFirstNewRef,
}: {
  storyList: StoryItem[];
  storyLoading: boolean;
  storyLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  scrollToFirstNewRef: React.MutableRefObject<number | null>;
}) {
  const scrollToElRef = useCallback(
    (el: HTMLLIElement | null) => {
      if (el && scrollToFirstNewRef.current !== null) {
        el.scrollIntoView({
          // behavior: "smooth",
          block: "start",
        });
        scrollToFirstNewRef.current = null;
      }
    },
    [scrollToFirstNewRef]
  );
  return (
    <ul
      className="space-y-5 border-t pt-6"
      style={{ borderColor: "var(--orz-border)" }}
    >
      {storyLoading ? (
        <li
          className="border-b pb-5"
          style={{
            borderColor: "var(--orz-border)",
            color: "var(--orz-ink-faint)",
          }}
        >
          <span className="text-sm">江湖事多，稍候片刻…</span>
        </li>
      ) : storyList.length === 0 ? (
        <li
          className="border-b pb-5"
          style={{
            borderColor: "var(--orz-border)",
            color: "var(--orz-ink-faint)",
          }}
        >
          <span className="text-sm">暂无纪事</span>
        </li>
      ) : (
        <>
          {storyList.map((item, index) => {
            const timeLabel = formatStoryTime(item.sys_createTime);
            const operator = item.sys_operatorMemberInfo;
            const opId = operator?._id ?? item.sys_operatorMemberId;
            const isFirstNewItem = scrollToFirstNewRef.current === index;
            const storyTypeLabel = getStoryTypeLabel(item.storyType);

            return (
              <motion.li
                key={item._id}
                ref={isFirstNewItem ? scrollToElRef : undefined}
                className="grid gap-2 border-b pb-5"
                style={{ borderColor: "var(--orz-border)" }}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.2,
                  delay: Math.min(index * 0.08, 0.2),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* 第一行：时间 */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className="font-mono-geist text-xs"
                    style={{ color: "var(--orz-ink-faint)" }}
                  >
                    [{timeLabel}]
                  </span>
                </div>

                {/* 第二行：头像 + 昵称 + Tag */}
                {opId && (
                  <div className="flex items-center gap-x-2">
                    <Link
                      to={`/member-detail?id=${opId}`}
                      className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-bold transition-colors hover:underline"
                      style={{ color: "#5c5344" }}
                    >
                      {operator?.user_avatarUrl ? (
                        <img
                          src={operator.user_avatarUrl}
                          alt={
                            operator?.user_nickName
                              ? `${operator.user_nickName}的头像`
                              : "侠客头像"
                          }
                          className="size-4 rounded-full border object-cover"
                          style={{
                            borderColor: getAvatarBorderColor(
                              operator?.identity_mode
                            ),
                          }}
                        />
                      ) : null}
                      <span>{operator?.user_nickName ?? "侠客"}</span>
                    </Link>
                  </div>
                )}

                {/* 第三行：故事正文（类型标签嵌入段首） */}
                <p className="text-sm leading-relaxed text-[var(--orz-ink)]">
                  {storyTypeLabel && (
                    <span
                      className="align-text-bottom mr-1.5 inline-flex items-center rounded-full border px-1.5 py-0 font-mono-geist text-[0.65rem] leading-relaxed"
                      style={{
                        borderColor: "rgba(185,28,28,0.22)",
                        backgroundColor: "rgba(185,28,28,0.04)",
                        color: "var(--orz-accent)",
                      }}
                    >
                      {storyTypeLabel}
                    </span>
                  )}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: formatLog(item.content),
                    }}
                  />
                </p>
              </motion.li>
            );
          })}
          {hasMore && !storyLoadingMore && (
            <LoadMoreSentinel
              onVisible={onLoadMore}
              disabled={storyLoadingMore}
            />
          )}
          {storyLoadingMore && (
            <li
              className="flex min-h-12 items-center justify-center border-b pb-5"
              style={{
                borderColor: "var(--orz-border)",
                color: "var(--orz-ink-faint)",
              }}
            >
              <span className="text-sm">加载更多…</span>
            </li>
          )}
        </>
      )}
    </ul>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--orz-ink-faint)" }}>
        {label}
      </p>
      <p className="mt-0.5 font-mono-geist text-sm font-medium text-[var(--orz-ink)]">
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  content,
  delay,
}: {
  title: string;
  content: string;
  delay: number;
}) {
  return (
    <motion.section
      className="mt-8 border-t pt-6"
      style={{ borderColor: "var(--orz-border)" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3
        className="mb-3 text-xs font-medium tracking-[0.3em]"
        style={{ color: "var(--orz-ink-faint)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--orz-ink)" }}
      >
        {content}
      </p>
    </motion.section>
  );
}
