// Tauri API를 브라우저에서도 안전하게 쓰기 위한 shim
export const isTauri = () =>
  Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);

// 창 제어 (브라우저에서는 무시)
export async function closeWindow() {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().close();
}
export async function minimizeWindow() {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().minimize();
}
export async function toggleMaximizeWindow() {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().toggleMaximize();
}

// URL 열기 (브라우저에서는 window.open)
export async function openExternalUrl(url) {
  if (!isTauri()) {
    window.open(url, "_blank");
    return;
  }
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(url);
}

// 딥링크 수신 (브라우저에서는 URL 파라미터로 처리)
export async function onDeepLink(callback) {
  if (!isTauri()) return () => {};
  const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
  const unlisten = await onOpenUrl(callback);
  return unlisten;
}
