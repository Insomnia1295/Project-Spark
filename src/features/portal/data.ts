// NETRUN OS — Player Portal read hooks (Phase 1).
// TanStack Query + the typed anon client + Zod validation at the boundary. RLS scopes
// owner tables to the signed-in player; global tables read for any authenticated user.
// One realtime subscription (usePortalRealtime) invalidates these on any GM edit → live repaint.

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import {
  activitySchema,
  catalogItemSchema,
  characterBackgroundSchema,
  characterSheetSchema,
  contactSchema,
  cyberwareSchema,
  freeTimeLedgerSchema,
  inventoryItemSchema,
  missionSchema,
  newsPostSchema,
  skillDefSchema,
  skillSchema,
  storeSettingsSchema,
  timelineEventSchema,
  type Activity,
  type CatalogItem,
  type CharacterBackground,
  type CharacterSheet,
  type Contact,
  type Cyberware,
  type FreeTimeLedger,
  type InventoryItem,
  type Mission,
  type NewsPost,
  type SkillDef,
  type Skill,
  type StoreSettings,
  type TimelineEvent,
} from "@/schemas";

type TableName = keyof Database["public"]["Tables"];

/** Tables the portal reads (and subscribes to for live GM-edit reflection). */
const PORTAL_TABLES = [
  "character_sheet",
  "skill",
  "skill_def",
  "cyberware",
  "inventory_item",
  "contact",
  "mission",
  "free_time_ledger",
  "character_background",
  "activity",
  "news_post",
  "timeline_event",
  "catalog_item",
  "store_settings",
] as const satisfies readonly TableName[];

const key = (table: TableName) => ["portal", table] as const;

/** Fetch every visible row of a table and validate the set at the boundary. */
async function fetchAll<T>(
  table: TableName,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message);
  const parsed = schema.array().safeParse(data ?? []);
  if (!parsed.success) {
    throw new Error(`Row from "${table}" failed validation.`);
  }
  return parsed.data;
}

function useList<T>(table: TableName, schema: z.ZodType<T>) {
  return useQuery({ queryKey: key(table), queryFn: () => fetchAll(table, schema) });
}

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

// ---- List hooks ----
export const useSkills = () => useList<Skill>("skill", skillSchema);
export const useSkillDefs = () => useList<SkillDef>("skill_def", skillDefSchema);
export const useCyberware = () => useList<Cyberware>("cyberware", cyberwareSchema);
export const useInventory = () => useList<InventoryItem>("inventory_item", inventoryItemSchema);
export const useContacts = () => useList<Contact>("contact", contactSchema);
export const useActivities = () => useList<Activity>("activity", activitySchema);
export const useCatalog = () => useList<CatalogItem>("catalog_item", catalogItemSchema);
export const useBackground = () =>
  useList<CharacterBackground>("character_background", characterBackgroundSchema);
export const useTimeline = () => useList<TimelineEvent>("timeline_event", timelineEventSchema);
export const useNews = () => useList<NewsPost>("news_post", newsPostSchema);

// ---- Singleton / derived hooks ----
export function useCharacter() {
  const q = useList<CharacterSheet>("character_sheet", characterSheetSchema);
  return { ...q, character: q.data?.[0] ?? null };
}

export function useCurrentMission() {
  const q = useList<Mission>("mission", missionSchema);
  const mission =
    q.data
      ?.filter((m) => m.status === "current")
      .sort(bySort)[0] ?? null;
  return { ...q, mission };
}

export function useFreeTime() {
  const q = useList<FreeTimeLedger>("free_time_ledger", freeTimeLedgerSchema);
  return { ...q, ledger: q.data?.[0] ?? null };
}

export function useStoreSettings() {
  const q = useList<StoreSettings>("store_settings", storeSettingsSchema);
  return { ...q, store: q.data?.[0] ?? null };
}

/** Subscribe once to Postgres changes on every portal table; invalidate on any edit. */
export function usePortalRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel("portal-live");
    for (const table of PORTAL_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          void qc.invalidateQueries({ queryKey: key(table) });
        },
      );
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}

export { bySort };
