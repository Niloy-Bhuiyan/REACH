"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFocusTrap, useReducedMotion, useScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

/**
 * Drawer — desktop only. Translates 24px and fades over 180 ms with a 120 ms backdrop,
 * from the right. Traps focus and returns it to the trigger on close.
 * Width: 460px at 1440, 440 at 1280, 420 at 1024.
 */
export function Drawer({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useFocusTrap(open, onClose);
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/25"
          />
          <motion.div
            key="drawer"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "fixed top-0 right-0 z-50 h-dvh overflow-y-auto border-l border-group bg-surface shadow-tier3",
              "w-[420px] xl:w-[460px] lg:w-[440px]",
              className,
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Sheet — mobile. 220 ms from the bottom edge. Traps focus and returns it on close.
 * `height` is the fraction of the viewport the design specifies: 46% for the run console,
 * 78% for the assistant, 92% for a filter sheet.
 */
export function Sheet({
  open,
  onClose,
  label,
  height = "78%",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  height?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useFocusTrap(open, onClose);
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/30"
          />
          <motion.div
            key="sheet"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ height }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[18px] border-t border-group bg-surface shadow-tier3",
              className,
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** The grab handle every sheet carries. Decorative. */
export function SheetGrip() {
  return (
    <div className="flex shrink-0 justify-center pt-2.5 pb-1">
      <div aria-hidden className="h-1 w-9 rounded-full bg-group" />
    </div>
  );
}
