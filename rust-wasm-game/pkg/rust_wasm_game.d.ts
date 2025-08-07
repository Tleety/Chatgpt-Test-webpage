/* tslint:disable */
/* eslint-disable */
export class RustWasmGame {
  free(): void;
  constructor(canvas_id: string);
  update(current_time: number): void;
  render(): void;
  resize(width: number, height: number): void;
  on_click(x: number, y: number): void;
  add_random_velocity(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_rustwasmgame_free: (a: number, b: number) => void;
  readonly rustwasmgame_new: (a: number, b: number) => [number, number, number];
  readonly rustwasmgame_update: (a: number, b: number) => void;
  readonly rustwasmgame_render: (a: number) => void;
  readonly rustwasmgame_resize: (a: number, b: number, c: number) => void;
  readonly rustwasmgame_on_click: (a: number, b: number, c: number) => void;
  readonly rustwasmgame_add_random_velocity: (a: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
