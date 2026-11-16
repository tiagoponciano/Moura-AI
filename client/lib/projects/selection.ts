const KEY = "moura.selectedProject";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The browser's storage, or `undefined` where it is blocked or missing. */
function browserStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** The project chosen last in any tab, when it is still in `ids`; `undefined` otherwise. */
export function readSelectedProject(
  ids: string[],
  store: Store | undefined = browserStore(),
): string | undefined {
  try {
    const id = store?.getItem(KEY);
    return id && ids.includes(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

/** Remembers the chosen project for the other tabs; `undefined` forgets it. */
export function writeSelectedProject(
  id: string | undefined,
  store: Store | undefined = browserStore(),
): void {
  try {
    if (id) store?.setItem(KEY, id);
    else store?.removeItem(KEY);
  } catch {
    // Storage can be full or blocked; the selection then lives only in this tab.
  }
}
