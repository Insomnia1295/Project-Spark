// NETRUN OS — Player Portal shell (Phase 1). Wallpaper + logo + 7-tab rail + header
// pills, hosting the active read-only screen. Live GM edits repaint via usePortalRealtime;
// skill/stat clicks resolve through the server roll (RollProvider).

import { useState } from "react";
import { StageViewport } from "@/app/StageViewport";
import { NavRail, Pill, Icon, type RailItem } from "@/app/ui";
import { asset } from "@/app/assets";
import { RollProvider } from "./roll";
import { usePortalRealtime, useCharacter, useFreeTime } from "./data";
import { HomeScreen } from "./screens/HomeScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { StoreScreen } from "./screens/StoreScreen";
import { ActivitiesScreen } from "./screens/ActivitiesScreen";
import { ContactsScreen } from "./screens/ContactsScreen";
import { StoryScreen } from "./screens/StoryScreen";

export type TabKey =
  | "home"
  | "profile"
  | "inventory"
  | "store"
  | "activities"
  | "contacts"
  | "story";

const TABS: RailItem[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "profile", label: "Profile", icon: "profile" },
  { key: "inventory", label: "Inventory", icon: "inventory" },
  { key: "store", label: "Store", icon: "store" },
  { key: "activities", label: "Activities", icon: "activities" },
  { key: "contacts", label: "Contacts", icon: "contacts" },
  { key: "story", label: "Story So Far", icon: "story" },
];

export function PortalHome() {
  return (
    <RollProvider>
      <PortalShell />
    </RollProvider>
  );
}

function PortalShell() {
  usePortalRealtime();
  const [tab, setTab] = useState<TabKey>("home");
  const wallpaper = asset("wallpaper.portal");

  return (
    <StageViewport>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: wallpaper.src ? `url(${wallpaper.src}) center/cover` : wallpaper.placeholder,
          opacity: 0.5,
        }}
      />

      <div className="logo">
        <div className="m">NR</div>
      </div>

      <NavRail
        items={TABS}
        active={tab}
        onSelect={(k) => setTab(k as TabKey)}
        forceOpen={tab === "home"}
      />

      <HeaderPills onMessages={() => setTab("contacts")} />

      <Screen tab={tab} goTo={setTab} />

      <div className="foot">NETRUN OS · IN-WORLD 3 JUL 2076</div>
    </StageViewport>
  );
}

function HeaderPills({ onMessages }: { onMessages: () => void }) {
  const { character } = useCharacter();
  const { ledger } = useFreeTime();
  return (
    <div className="pills">
      {ledger && <Pill variant="ft" label="FREE TIME" value={String(ledger.hours_remaining)} unit="HRS" />}
      {character && (
        <Pill variant="ed" label="EDDIES" value={character.eddies.toLocaleString()} unit="eb" />
      )}
      <button type="button" className="ic" onClick={onMessages} aria-label="Messages">
        <Icon name="message" size={24} />
      </button>
    </div>
  );
}

function Screen({ tab, goTo }: { tab: TabKey; goTo: (t: TabKey) => void }) {
  switch (tab) {
    case "home":
      return <HomeScreen />;
    case "profile":
      return <ProfileScreen />;
    case "inventory":
      return <InventoryScreen />;
    case "store":
      return <StoreScreen />;
    case "activities":
      return <ActivitiesScreen />;
    case "contacts":
      return <ContactsScreen />;
    case "story":
      return <StoryScreen />;
    default:
      void goTo;
      return null;
  }
}
