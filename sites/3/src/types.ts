import type { Page } from "./views";

export type Mode = "desk" | "phone";

export interface OSApi {
  page: Page;
  mode: Mode;
  open(id: string, from?: Element | null): void;
  close(id: string): void;
  toast(text: string): void;
  openCount(): number;
  openTitles(): string[];
  trash: { items: string[]; restoreAll(): void; onChange(cb: () => void): void };
}

export interface AppCtx {
  os: OSApi;
  arg?: string;
  /** register cleanup for when the window closes */
  onClose(fn: () => void): void;
}

export interface AppDef {
  id: string;
  /** window title */
  title: string;
  /** label under the desktop icon */
  label: string;
  /** shorter label for the phone home screen */
  short?: string;
  icon: string;
  w: number;
  h: number;
  build(ctx: AppCtx): HTMLElement;
  /** where the icon appears */
  desktop?: boolean;
  phone?: boolean;
  dock?: boolean;
  /** hash names that open this app (#work, #contact...) */
  hashes?: string[];
  /** open next to it on desktop */
  companion?: string;
  noResize?: boolean;
  /** an external link instead of a window (phone dock: Call, WhatsApp) */
  href?: string;
}
