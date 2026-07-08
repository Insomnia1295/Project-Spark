// NETRUN OS — auth/session store (Zustand).
// Holds the Supabase session + the user's profile (role). The router gates
// /portal vs /admin on `profile.role`.
//
// IMPORTANT (supabase-js gotcha): you must NOT call other Supabase methods
// (e.g. `.from().select()`) directly inside the `onAuthStateChange` callback —
// the client holds an internal auth lock while the callback runs, so the query
// deadlocks and never resolves. We therefore defer profile loads out of the
// callback with a 0ms timeout so the lock is released first.

import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { profileSchema, type Profile } from "@/schemas";

interface SessionState {
  session: Session | null;
  profile: Profile | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  initialized: boolean;
  /** True once the initial session has been resolved (app boot complete). */
  booted: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  session: null,
  profile: null,
  status: "loading",
  error: null,
  initialized: false,
  booted: false,

  async loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      set({ profile: null, status: "error", error: `Could not load profile: ${error.message}` });
      return;
    }
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) {
      set({ profile: null, status: "error", error: "Profile row failed validation." });
      return;
    }
    set({ profile: parsed.data, status: "ready", error: null });
  },

  async init() {
    if (get().initialized) return;
    set({ initialized: true, status: "loading" });

    // Subscribe FIRST so we never miss an event. The callback only updates the
    // session synchronously and DEFERS any Supabase query out of the lock.
    supabase.auth.onAuthStateChange((_event, next) => {
      set({ session: next });
      if (next?.user) {
        const uid = next.user.id;
        setTimeout(() => {
          // Avoid a redundant reload if we already have this user's profile.
          if (get().profile?.id === uid) return;
          void get().loadProfile(uid);
        }, 0);
      } else {
        set({ profile: null });
      }
    });

    // Resolve the initial session (this call is OUTSIDE the auth callback, so it's
    // safe to query straight away).
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({ session });
    if (session?.user) {
      await get().loadProfile(session.user.id);
    } else {
      set({ status: "ready" });
    }
    set({ booted: true });
  },

  async signIn(email: string, password: string) {
    set({ status: "loading", error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ status: "ready", error: error.message });
      return { error: error.message };
    }
    // The onAuthStateChange handler will load the profile (deferred). As a
    // belt-and-braces fallback, load it here too (outside the callback = safe).
    const { data } = await supabase.auth.getUser();
    if (data.user) await get().loadProfile(data.user.id);
    return { error: null };
  },

  async signOut() {
    await supabase.auth.signOut();
    set({ session: null, profile: null, status: "ready", error: null });
  },
}));
