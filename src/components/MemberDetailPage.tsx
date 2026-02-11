import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

type MemberInfo = {
  _id: string;
  sys_createTime: string;
  sys_updateTime: string;
  user_nickName: string;
  user_avatarUrl: string;
  user_level: number;
  user_exp: number;
  user_backpack: string[];
  user_introduction: string;
  user_soul: string;
  user_memory: string;
  user_personality?: string;
  user_health?: number;
  user_friendsList?: { nickName: string; friendliness: number }[];
  user_city?: string;
};

type GetQueryMemberInfoResponse = {
  code: number;
  body: { memberInfo: MemberInfo };
};

type OperatorMemberInfo = {
  _id: string;
  user_nickName: string;
  user_avatarUrl: string;
};

type StoryItem = {
  _id: string;
  sys_createTime: string;
  sys_updateTime: string;
  sys_operatorMemberId: string;
  sys_operatorMemberInfo?: OperatorMemberInfo;
  relatedMemberIds: string[];
  storyType: string;
  content: string;
};

type StoryListResult = {
  list: StoryItem[];
  pageNum: number;
  pageSize: number;
  totalCount: number;
};

const MEMBER_API_URL =
  "https://www.orz2.online/api/smart/v1/member/getQueryMemberInfo";

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

const STORY_API_URL =
  "https://www.orz2.online/api/smart/v1/story/getQueryStoryList";

const STORY_PAGE_SIZE = 15;

async function fetchMemberInfo(id: string): Promise<MemberInfo | null> {
  const { data } = await axios.get<GetQueryMemberInfoResponse>(
    `${MEMBER_API_URL}?id=${id}`
  );
  if (data?.code === 200 && data?.body?.memberInfo) {
    return data.body.memberInfo;
  }
  return null;
}

async function fetchStoryList(options: {
  pageNum: number;
  pageSize: number;
  memberId: string;
}): Promise<StoryListResult> {
  const params = new URLSearchParams({
    pageNum: String(options.pageNum),
    pageSize: String(options.pageSize),
    memberId: options.memberId,
  });
  const { data } = await axios.get<{
    code: number;
    body: {
      pageNum: number;
      pageSize: number;
      totalCount: number;
      list: StoryItem[];
    };
  }>(`${STORY_API_URL}?${params.toString()}`);
  if (data?.code === 200 && data?.body) {
    return {
      list: data.body.list ?? [],
      pageNum: data.body.pageNum,
      pageSize: data.body.pageSize,
      totalCount: data.body.totalCount ?? 0,
    };
  }
  return {
    list: [],
    pageNum: options.pageNum,
    pageSize: options.pageSize,
    totalCount: 0,
  };
}

const formatStoryTime = (isoStr: string) => {
  const d = dayjs(isoStr);
  return `${d.format("YYYY-MM-DD HH:mm")} · ${getShichen(d.hour())}`;
};

const formatLog = (content: string) =>
  content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

export default function MemberDetailPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [member, setMember] = useState<MemberInfo | null>(null);
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
    if (!id) {
      setError("未指定侠客");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchMemberInfo(id)
      .then((info) => {
        if (!cancelled) {
          setMember(info);
          setError(info ? null : "未找到该侠客");
        }
      })
      .catch(() => {
        if (!cancelled) setError("加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
    fetchStoryList({ memberId: mid, pageNum: 0, pageSize: STORY_PAGE_SIZE })
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

    fetchStoryList({
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
        <div className="relative mx-auto max-w-3xl px-5 py-20">
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
        {/* 置顶返回栏 */}
        <div
          className="fixed top-0 left-0 right-0 z-10 w-full border-b py-4"
          style={{
            backgroundColor: "var(--orz-paper)",
            borderColor: "var(--orz-border)",
          }}
        >
          <div className="mx-auto max-w-3xl px-5">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium transition-colors hover:underline"
              style={{ color: "var(--orz-accent)" }}
            >
              ← 返回江湖
            </Link>
          </div>
        </div>
        <div className="relative mx-auto max-w-3xl px-5 pt-16 pb-20 text-center">
          <p className="mb-6" style={{ color: "var(--orz-ink-faint)" }}>
            {error ?? "未找到该侠客"}
          </p>
        </div>
      </div>
    );
  }

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

      {/* 置顶返回栏 */}
      <div
        className="fixed top-0 left-0 right-0 z-10 w-full border-b py-4"
        style={{
          backgroundColor: "var(--orz-paper)",
          borderColor: "var(--orz-border)",
        }}
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
              style={{ color: "var(--orz-accent)" }}
            >
              ← 返回江湖
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl px-5 pt-20 pb-14 sm:px-6 sm:pt-20 sm:pb-16 lg:pt-20 lg:pb-24">
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
              alt={member.user_nickName ? `${member.user_nickName}的头像` : "侠客头像"}
              className="size-20 shrink-0 rounded-full border-2 object-cover"
              style={{ borderColor: "var(--orz-border-strong)" }}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="font-display-zh text-2xl font-semibold text-[var(--orz-ink)] sm:text-[1.75rem]">
                {member.user_nickName}
              </h1>
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
                  .map((item) => (
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
                  ))}
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
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className="font-mono-geist text-xs"
                    style={{ color: "var(--orz-ink-faint)" }}
                  >
                    [{timeLabel}]
                  </span>
                  {opId && (
                    <Link
                      to={`/member?id=${opId}`}
                      className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-bold transition-colors hover:underline"
                      style={{ color: "#5c5344" }}
                    >
                      {operator?.user_avatarUrl ? (
                        <img
                          src={operator.user_avatarUrl}
                          alt={operator?.user_nickName ? `${operator.user_nickName}的头像` : "侠客头像"}
                          className="size-4 rounded-full object-cover"
                        />
                      ) : null}
                      <span>{operator?.user_nickName ?? "侠客"}</span>
                    </Link>
                  )}
                </div>
                <p
                  className="text-sm leading-relaxed text-[var(--orz-ink)]"
                  dangerouslySetInnerHTML={{
                    __html: formatLog(item.content),
                  }}
                />
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
