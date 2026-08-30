import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Synchronizes a controlled React boolean with a native modal dialog.
 *
 * @param ref - Ref containing the native dialog element.
 * @param open - Controlled modal open state.
 */
export function useNativeDialog(ref: RefObject<HTMLDialogElement | null>, open: boolean): void {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, ref]);
}
