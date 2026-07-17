type TauriWindow = Window & {
  __TAURI__?: unknown;
  __TAURI_INTERNALS__?: unknown;
};

type TauriGlobal = typeof globalThis & {
  isTauri?: boolean;
};

export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;

  const tauriWindow = window as TauriWindow;
  const tauriGlobal = globalThis as TauriGlobal;

  return Boolean(tauriGlobal.isTauri || tauriWindow.__TAURI_INTERNALS__ || tauriWindow.__TAURI__);
}

type NoArgsCommand = {
  [K in TauriCommandName]: TauriCommandMap[K]['args'] extends undefined ? K : never;
}[TauriCommandName];

type CommandWithArgs = Exclude<TauriCommandName, NoArgsCommand>;

/** Invoke a Tauri command through the single typed frontend boundary. */
export function invokeTauri<K extends NoArgsCommand>(
  command: K,
): Promise<TauriCommandMap[K]['result']>;
export function invokeTauri<K extends CommandWithArgs>(
  command: K,
  args: TauriCommandMap[K]['args'],
): Promise<TauriCommandMap[K]['result']>;
export function invokeTauri<K extends TauriCommandName>(
  command: K,
  args?: TauriCommandMap[K]['args'],
): Promise<TauriCommandMap[K]['result']> {
  return invoke<TauriCommandMap[K]['result']>(command, args);
}
import { invoke } from '@tauri-apps/api/core';
import type { TauriCommandMap, TauriCommandName } from '$lib/types/tauri';
