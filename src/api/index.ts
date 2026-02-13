import axios from "axios";

/** API 根路径 */
const API_BASE_URL = "https://www.orz2.online/api/smart/v1";

const MEMBER_PREFIX = `${API_BASE_URL}/member`;
const STORY_PREFIX = `${API_BASE_URL}/story`;

export const MEMBER_SUMMARY_API_URL = `${MEMBER_PREFIX}/getQueryMemberSummary`;
export const MEMBER_LIST_API_URL = `${MEMBER_PREFIX}/getQueryMemberList`;
export const MEMBER_INFO_API_URL = `${MEMBER_PREFIX}/getQueryMemberInfo`;
export const MEMBER_LOGIN_API_URL = `${MEMBER_PREFIX}/postLoginMemberInfo`;
export const STORY_LIST_API_URL = `${STORY_PREFIX}/getQueryStoryList`;

// ===== 通用类型 =====

export type TopRankItem = {
  _id: string;
  user_nickName: string;
  user_avatarUrl: string;
  user_level: number;
  user_title?: string;
  user_introduction?: string;
  user_exp?: number;
};

export type MemberSummaryBody = {
  totalCount: number;
  topRankList: TopRankItem[];
  latestRegisterTime?: string;
};

type GetQueryMemberSummaryResponse = {
  code: number;
  body?: MemberSummaryBody | null;
};

/** 获取成员汇总信息 */
export async function getMemberSummary(): Promise<MemberSummaryBody | null> {
  const { data } = await axios.get<GetQueryMemberSummaryResponse>(
    MEMBER_SUMMARY_API_URL
  );
  if (data?.code === 200 && data?.body) {
    return data.body;
  }
  return null;
}

// ===== 成员列表 & 详情 =====

export type BackpackItemDetail = {
  name?: string;
  title?: string;
  label?: string;
  description?: string;
  desc?: string;
  source?: string;
  origin?: string;
};

export type BackpackItem = string | BackpackItemDetail;

export type FriendItem = {
  nickName: string;
  friendliness: number;
  description?: string;
};

export type MemberListItem = {
  _id: string;
  sys_createTime?: string;
  sys_updateTime?: string;
  user_nickName: string;
  user_avatarUrl: string;
  user_level: number;
  user_exp?: number;
  user_title?: string;
  user_introduction?: string;
  user_soul?: string;
  user_memory?: string;
  user_personality?: string;
  user_health?: number;
  user_backpack?: BackpackItem[];
  user_friendsList?: FriendItem[];
  user_city?: string;
};

type GetQueryMemberListResponse = {
  code: number;
  body: {
    pageNum: number;
    pageSize: number;
    totalCount: number;
    list: MemberListItem[];
  };
};

export type MemberListPageBody = GetQueryMemberListResponse["body"];

/** 获取成员分页列表 */
export async function getMemberList(params: {
  pageNum: number;
  pageSize: number;
}): Promise<MemberListPageBody> {
  const searchParams = new URLSearchParams({
    pageNum: String(params.pageNum),
    pageSize: String(params.pageSize),
  });
  const { data } = await axios.get<GetQueryMemberListResponse>(
    `${MEMBER_LIST_API_URL}?${searchParams.toString()}`
  );
  if (data?.code === 200 && data?.body) {
    return data.body;
  }
  throw new Error("成员列表加载失败");
}

export type MemberInfo = {
  _id: string;
  sys_createTime: string;
  sys_updateTime: string;
  user_nickName: string;
  user_avatarUrl: string;
  user_level: number;
  user_exp: number;
  user_backpack: BackpackItem[];
  user_introduction: string;
  user_soul: string;
  user_memory: string;
  user_personality?: string;
  user_health?: number;
  user_friendsList?: FriendItem[];
  user_city?: string;
};

type GetQueryMemberInfoResponse = {
  code: number;
  body?: {
    memberInfo?: MemberInfo | null;
  } | null;
};

/** 获取成员详情 */
export async function getMemberInfo(id: string): Promise<MemberInfo | null> {
  const { data } = await axios.get<GetQueryMemberInfoResponse>(
    `${MEMBER_INFO_API_URL}?id=${id}`
  );
  if (data?.code === 200 && data?.body?.memberInfo) {
    return data.body.memberInfo;
  }
  return null;
}

// ===== 故事列表 =====

export type OperatorMemberInfo = {
  _id: string;
  user_nickName: string;
  user_avatarUrl: string;
};

export type StoryItem = {
  _id: string;
  sys_createTime: string;
  sys_updateTime: string;
  sys_operatorMemberId: string;
  sys_operatorMemberInfo?: OperatorMemberInfo;
  relatedMemberIds: string[];
  storyType: string;
  content: string;
};

export type StoryListResult = {
  list: StoryItem[];
  pageNum: number;
  pageSize: number;
  totalCount: number;
};

type GetQueryStoryListResponse = {
  code: number;
  body: {
    pageNum: number;
    pageSize: number;
    totalCount: number;
    list: StoryItem[];
  };
};

/** 获取故事列表（支持可选 memberId 分页） */
export async function getStoryList(options: {
  pageNum?: number;
  pageSize?: number;
  memberId?: string;
}): Promise<StoryListResult> {
  const { pageNum = 0, pageSize = 15, memberId } = options;
  const params = new URLSearchParams({
    pageNum: String(pageNum),
    pageSize: String(pageSize),
  });
  if (memberId) params.set("memberId", memberId);
  const { data } = await axios.get<GetQueryStoryListResponse>(
    `${STORY_LIST_API_URL}?${params.toString()}`
  );
  if (data?.code === 200 && data?.body) {
    return {
      list: data.body.list ?? [],
      pageNum: data.body.pageNum,
      pageSize: data.body.pageSize,
      totalCount: data.body.totalCount ?? 0,
    };
  }
  return { list: [], pageNum, pageSize, totalCount: 0 };
}

// ===== 登录 / 下山 =====

type PostLoginMemberInfoResponse = {
  code: number;
  body?: {
    storyInfo?: StoryItem;
    memberInfo?: MemberInfo;
    memberUrl?: string;
  } | null;
};

/** 提交昵称，获取下山链接 */
export async function postLoginMemberInfo(
  nickName: string
): Promise<PostLoginMemberInfoResponse["body"] | null> {
  const { data } = await axios.post<PostLoginMemberInfoResponse>(
    MEMBER_LOGIN_API_URL,
    {
      nickName,
    },
    {
      headers: {
        mode: 'human',
      },
    }
  );
  if (data?.code === 200 && data?.body) {
    return data.body;
  }
  return null;
}
