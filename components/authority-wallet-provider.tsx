"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { connectArkivWallet, getConnectedArkivWallet, watchArkivWallet, type WalletSession } from "@/lib/arkiv/wallet";

export type AuthorityWalletStatus = "checking" | "disconnected" | "connecting" | "authorized" | "unauthorized" | "error";

type AuthorityWalletContextValue = {
  status: AuthorityWalletStatus;
  session: WalletSession | null;
  error: string;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthorityWalletContext = createContext<AuthorityWalletContextValue | null>(null);

async function hasAuthorityAccess(address: string) {
  const response = await fetch(`/api/authority/access?address=${encodeURIComponent(address)}`, { cache: "no-store" });
  if (!response.ok) return false;
  const result = await response.json() as { authorized?: boolean };
  return result.authorized === true;
}

export function AuthorityWalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthorityWalletStatus>("checking");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [error, setError] = useState("");

  const acceptSession = useCallback(async (nextSession: WalletSession | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setStatus("disconnected");
      return;
    }
    setStatus(await hasAuthorityAccess(nextSession.address) ? "authorized" : "unauthorized");
  }, []);

  const refresh = useCallback(async () => {
    setStatus("checking");
    setError("");
    try {
      await acceptSession(await getConnectedArkivWallet());
    } catch (cause) {
      setSession(null);
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Could not inspect the connected wallet.");
    }
  }, [acceptSession]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError("");
    try {
      await acceptSession(await connectArkivWallet());
    } catch (cause) {
      setSession(null);
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Authority wallet connection failed.");
    }
  }, [acceptSession]);

  useEffect(() => {
    let cancelled = false;
    let stopWatching: () => void = () => {};
    queueMicrotask(() => { if (!cancelled) void refresh(); });
    void watchArkivWallet(() => { void refresh(); }).then((cleanup) => {
      if (cancelled) cleanup();
      else stopWatching = cleanup;
    });
    return () => { cancelled = true; stopWatching(); };
  }, [refresh]);

  const value = useMemo(() => ({ status, session, error, connect, refresh }), [connect, error, refresh, session, status]);
  return <AuthorityWalletContext.Provider value={value}>{children}</AuthorityWalletContext.Provider>;
}

export function useAuthorityWallet() {
  const value = useContext(AuthorityWalletContext);
  if (!value) throw new Error("useAuthorityWallet must be used inside AuthorityWalletProvider.");
  return value;
}
