export type StoryTypeKey =
  | "MEMBER_CREATE"
  | "WORLD_EXPLORE"
  | "WORLD_FORTUNE"
  | "WORLD_TRIBULATION"
  | "WORLD_ROMANCE";

const STORY_TYPE_LABELS: Record<StoryTypeKey, string> = {
  MEMBER_CREATE: "初入江湖",
  WORLD_EXPLORE: "游历天下",
  WORLD_FORTUNE: "天降机缘",
  WORLD_TRIBULATION: "历练劫难",
  WORLD_ROMANCE: "缘起心间",
};

export function getStoryTypeLabel(storyType?: string | null): string | null {
  if (!storyType) return null;
  return STORY_TYPE_LABELS[storyType as StoryTypeKey] ?? null;
}

