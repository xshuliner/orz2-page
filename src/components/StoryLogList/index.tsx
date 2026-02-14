import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { OrzTooltip } from "@/src/components/OrzTooltip";
import { getStoryTypeLabel } from "@/src/components/storyTypeMeta";
import {
  getStoryList,
  getAvatarBorderColor,
  type StoryItem,
  type StoryListResult,
} from "@/src/api";

const DEFAULT_PAGE_SIZE = 15;
export const POLL_INTERVAL_MS = 60 * 1000;

// 十二时辰与现代时间对应
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

const formatStoryTime = (isoStr: string) => {
  const d = dayjs(isoStr);
  const dateTime = d.format("YYYY-MM-DD HH:mm");
  const shichen = getShichen(d.hour());
  return `${dateTime} · ${shichen}`;
};

const formatLog = (content: string) =>
  content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

/** 分页获取故事列表（内部统一走 src/api） */
async function fetchStoryListWithPagination(options: {
  pageNum?: number;
  pageSize?: number;
  memberId?: string;
}): Promise<StoryListResult> {
  const { pageNum = 0, pageSize = DEFAULT_PAGE_SIZE, memberId } = options;
  return getStoryList({ pageNum, pageSize, memberId });
}

/** 获取全局故事列表（无 memberId 筛选），兼容旧用法 */
export async function fetchStoryList(
  pageNum = 0,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<StoryListResult> {
  return fetchStoryListWithPagination({ pageNum, pageSize });
}

/** 轮询结果合并：只把 API 中不存在于 prev 的数据插到最前面 */
export function mergePollResult(
  pollItems: StoryItem[],
  prev: StoryItem[]
): StoryItem[] {
  const existingIds = new Set(prev.map((i) => i._id));
  const newItems = pollItems.filter((item) => !existingIds.has(item._id));
  return [...newItems, ...prev];
}

/** 加载更多合并：只把 API 中不存在于 prev 的数据插到后面 */
export function mergeLoadMoreResult(
  newItems: StoryItem[],
  prev: StoryItem[]
): StoryItem[] {
  const existingIds = new Set(prev.map((i) => i._id));
  const uniqueNew = newItems.filter((item) => !existingIds.has(item._id));
  return [...prev, ...uniqueNew];
}

export type StoryLogListProps =
  | {
      /** 传入列表时直接展示，适用于首页等 */
      logList: StoryItem[];
      memberId?: never;
      /** 当前登录侠客的 identity hash，与 operator.identity_hash 一致时显示本尊契印 */
      memberHash?: string;
      /** 是否还有更多 */
      hasMore?: boolean;
      /** 加载更多中 */
      loadingMore?: boolean;
      /** 滑动到底部时触发加载更多 */
      onLoadMore?: () => void;
    }
  | {
      logList?: never;
      /** 传入 memberId 时组件内部拉取该侠客的故事列表，适用于详情页 */
      memberId: string;
    };

/** 底部加载哨兵，使用 Intersection Observer 触发加载更多 */
function LoadMoreSentinel({
  onVisible,
  disabled,
}: {
  onVisible: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  /** 进入视口时置 true 防重复触发，等接口返回后（disabled 变为 false）再重置 */
  const firedRef = useRef(false);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    if (disabled) return;
    firedRef.current = false;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || firedRef.current) return;
        firedRef.current = true;
        onVisibleRef.current();
      },
      { rootMargin: "100px", threshold: 0.1 }
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

export default function StoryLogList(props: StoryLogListProps) {
  const [fetchedList, setFetchedList] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const sentinelDisabledRef = useRef(false);
  const initialLoadedRef = useRef(false);
  const loadingMoreInFlightRef = useRef(false);

  const logList =
    "logList" in props && props.logList
      ? props.logList
      : "memberId" in props && props.memberId
      ? fetchedList
      : [];

  const isFetchMode = "memberId" in props && !!props.memberId;
  const isLogListMode = "logList" in props && props.logList;
  const memberId = isFetchMode && "memberId" in props ? props.memberId : null;

  // logList 模式下的分页 props（需类型收窄）
  type LogListProps = {
    memberHash?: string;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
  };
  const hasMore = isLogListMode
    ? (props as LogListProps).hasMore ?? false
    : fetchedList.length < totalCount;
  const loadingMoreState = isLogListMode
    ? (props as LogListProps).loadingMore ?? false
    : loadingMore;
  const onLoadMoreProp = isLogListMode
    ? (props as LogListProps).onLoadMore
    : undefined;
  const memberHash = isLogListMode
    ? (props as LogListProps).memberHash ?? ""
    : "";

  // memberId 模式：加载更多（触底时 pageNum+1，去重后插到后面）
  const loadMoreMemberStories = useCallback(async () => {
    if (
      !memberId ||
      loadingMoreInFlightRef.current ||
      sentinelDisabledRef.current
    )
      return;
    loadingMoreInFlightRef.current = true;
    const nextPage = pageNum + 1;
    setLoadingMore(true);
    try {
      const result = await fetchStoryListWithPagination({
        memberId,
        pageNum: nextPage,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      setFetchedList((prev) => mergeLoadMoreResult(result.list, prev));
      setPageNum(nextPage);
      setTotalCount(result.totalCount);
      if (
        result.list.length < DEFAULT_PAGE_SIZE ||
        result.list.length === 0 ||
        result.totalCount === 0
      ) {
        sentinelDisabledRef.current = true;
      }
    } catch {
      // 静默失败
    } finally {
      loadingMoreInFlightRef.current = false;
      setLoadingMore(false);
    }
  }, [memberId, pageNum]);

  // memberId 模式：初始加载 + 每 1min 轮询（pageNum=0，去重后插到最前面）
  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    initialLoadedRef.current = false;
    sentinelDisabledRef.current = false;
    loadingMoreInFlightRef.current = false;
    setLoading(true);
    const load = async () => {
      try {
        const result = await fetchStoryListWithPagination({
          memberId,
          pageNum: 0,
          pageSize: DEFAULT_PAGE_SIZE,
        });
        if (!cancelled) {
          if (!initialLoadedRef.current) {
            initialLoadedRef.current = true;
            setFetchedList(result.list);
            setPageNum(0);
            sentinelDisabledRef.current =
              result.list.length >= result.totalCount ||
              result.list.length === 0;
          } else {
            setFetchedList((prev) => mergePollResult(result.list, prev));
          }
          setTotalCount(result.totalCount);
        }
      } catch {
        if (!cancelled && !initialLoadedRef.current) setFetchedList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [memberId]);

  const shouldShowSentinel =
    (isLogListMode && onLoadMoreProp && hasMore && !loadingMoreState) ||
    (isFetchMode &&
      !loading &&
      logList.length > 0 &&
      hasMore &&
      !loadingMoreState);

  const handleSentinelVisible = useCallback(() => {
    if (isLogListMode && onLoadMoreProp) {
      onLoadMoreProp();
    } else if (isFetchMode && !sentinelDisabledRef.current) {
      loadMoreMemberStories();
    }
  }, [isLogListMode, onLoadMoreProp, isFetchMode, loadMoreMemberStories]);

  return (
    <ul
      className="space-y-5 border-t pt-6"
      style={{ borderColor: "var(--orz-border)" }}
    >
      {loading ? (
        <li
          className="border-b pb-5"
          style={{
            borderColor: "var(--orz-border)",
            color: "var(--orz-ink-faint)",
          }}
        >
          <span className="text-sm">江湖事多，稍候片刻…</span>
        </li>
      ) : logList.length === 0 ? (
        <li
          className="border-b pb-5"
          style={{
            borderColor: "var(--orz-border)",
            color: "var(--orz-ink-faint)",
          }}
        >
          <span className="text-sm">江湖事多，稍候片刻…</span>
        </li>
      ) : (
        <>
          {logList.map((item, index) => {
            const timeLabel = formatStoryTime(item.sys_createTime);
            const operator = item.sys_operatorMemberInfo;
            const memberId = operator?._id ?? item.sys_operatorMemberId;
            const storyTypeLabel = getStoryTypeLabel(item.storyType);

            return (
              <motion.li
                key={item._id}
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
                {memberId && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      to={`/member-detail?id=${memberId}`}
                      className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-bold transition-colors hover:underline"
                      style={{
                        color: "#5c5344",
                      }}
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
                    {memberHash &&
                      operator?.identity_hash &&
                      memberHash === operator.identity_hash && (
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
                              delay: 0.15,
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
          {shouldShowSentinel && (
            <LoadMoreSentinel
              onVisible={handleSentinelVisible}
              disabled={loadingMoreState}
            />
          )}
          {loadingMoreState && (
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
