"use client";

import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useCallback, useState } from "react";

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "installing"
  | "completed"
  | "error";

export function useUpdater() {
  const [state, setState] = useState<UpdateState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | undefined>();

  const checkForUpdates = useCallback(async () => {
    try {
      setState("checking");
      setError(undefined);
      setProgress(0);
      const update = await check();
      if (update?.available) {
        setUpdateInfo({
          version: update.version,
          date: update.date || new Date().toISOString(),
          body: update.body || "New version available",
        });
        setState("available");
      } else {
        setState("not-available");
      }

      return update;
    } catch (err) {
      console.error("Failed to check for updates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to check for updates"
      );
      setState("error");
      throw err;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    try {
      const update = await check();

      if (!update?.available) {
        throw new Error("No update available");
      }

      setState("downloading");
      setProgress(0);

      let contentLength = 0;
      let downloadedBytes = 0;
      await update.downloadAndInstall(event => {
        switch (event.event) {
          case "Started":
            setState("downloading");
            setProgress(0);
            if (event.data.contentLength) {
              contentLength = event.data.contentLength;
            }
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            if (contentLength > 0) {
              const progressPercent = (downloadedBytes / contentLength) * 100;
              setProgress(Math.min(progressPercent, 99)); // Cap at 99% until installation
            }
            break;
          case "Finished":
            setState("installing");
            setProgress(100);
            break;
        }
      });
      setState("completed");

      // Restart the application after a short delay
      setTimeout(async () => {
        try {
          await relaunch();
        } catch (err) {
          console.error("Failed to restart application:", err);
          setError(
            "Update installed but failed to restart. Please restart the application manually."
          );
          setState("error");
        }
      }, 1500);
    } catch (err) {
      console.error("Failed to download and install update:", err);
      setError(err instanceof Error ? err.message : "Failed to install update");
      setState("error");
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setError(undefined);
    setUpdateInfo(undefined);
  }, []);

  return {
    state,
    progress,
    error,
    updateInfo,
    checkForUpdates,
    downloadAndInstall,
    reset,
  };
}
