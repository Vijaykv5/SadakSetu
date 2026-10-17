"use client";

import { useEffect, useState } from "react";
import {
  readEncryptedSessionJson,
  SessionKeyUnavailableError,
  subscribeToEncryptedSession,
} from "@/lib/encrypted-session";

type EncryptedSessionState<T> =
  | { status: "loading"; value: null }
  | { status: "empty"; value: null }
  | { status: "locked"; value: null }
  | { status: "error"; value: null }
  | { status: "ready"; value: T };

export function useEncryptedSessionJson<T>(key: string): EncryptedSessionState<T> {
  const [state, setState] = useState<EncryptedSessionState<T>>({ status: "loading", value: null });

  useEffect(() => {
    let active = true;

    function load() {
      readEncryptedSessionJson<T>(key)
        .then((value) => {
          if (!active) return;
          setState(value === null ? { status: "empty", value: null } : { status: "ready", value });
        })
        .catch((error: unknown) => {
          if (!active) return;
          setState({
            status: error instanceof SessionKeyUnavailableError ? "locked" : "error",
            value: null,
          });
        });
    }

    load();
    const unsubscribe = subscribeToEncryptedSession(key, () => {
      setState({ status: "loading", value: null });
      load();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [key]);

  return state;
}
