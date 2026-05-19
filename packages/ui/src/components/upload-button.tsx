"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import * as React from "react"

import { buttonVariants } from "@transferflow/ui/components/button"
import {
  CheckIcon,
  type CheckIconHandle,
} from "@transferflow/ui/components/check"
import { cn } from "@transferflow/ui/lib/utils"

export type UploadButtonPhase = "idle" | "uploading" | "success"

export interface UploadButtonProps {
  phase: UploadButtonPhase
  progress?: number
  label?: string
  className?: string
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const springProgress = { type: "spring" as const, stiffness: 90, damping: 18 }
const easeOut = [0.22, 1, 0.36, 1] as const

export function UploadButton({
  phase,
  progress = 0,
  label = "Uploading…",
  className,
  disabled,
  onClick,
}: UploadButtonProps) {
  const reducedMotion = useReducedMotion()
  const checkRef = React.useRef<CheckIconHandle>(null)
  const isBusy = phase === "uploading" || phase === "success"

  React.useEffect(() => {
    if (phase === "success") {
      checkRef.current?.startAnimation()
    }
  }, [phase])

  const clampedProgress = Math.min(100, Math.max(0, progress))
  const progressWidth = `${clampedProgress}%`
  const instant = reducedMotion ? { duration: 0 } : undefined

  return (
    <motion.button
      type="button"
      data-slot="upload-button"
      data-phase={phase}
      className={cn(
        buttonVariants({ variant: "default", size: "default" }),
        "relative w-full overflow-hidden",
        phase === "uploading" &&
          "border-input bg-muted text-foreground shadow-none hover:bg-muted [&::before]:opacity-0",
        phase === "success" &&
          "border-success bg-success text-success-foreground shadow-success/24 hover:bg-success [&::before]:opacity-0",
        className
      )}
      disabled={disabled || isBusy}
      aria-busy={phase === "uploading" ? true : undefined}
      aria-live="polite"
      animate={
        phase === "success" && !reducedMotion
          ? { scale: [1, 1.015, 1] }
          : { scale: 1 }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { scale: { duration: 0.45, ease: easeOut } }
      }
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-y-0 left-0 overflow-hidden bg-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]"
        initial={false}
        animate={{
          width: phase === "uploading" ? progressWidth : "0%",
          opacity: phase === "uploading" ? 1 : 0,
        }}
        transition={
          instant ?? {
            width: springProgress,
            opacity: { duration: phase === "success" ? 0.12 : 0.2, ease: easeOut },
          }
        }
        aria-hidden
      >
        {phase === "uploading" && !reducedMotion ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-2/5 animate-upload-button-shine bg-linear-to-r from-transparent via-white/25 to-transparent will-change-transform"
            aria-hidden
          />
        ) : null}
      </motion.div>

      <span className="relative z-10 flex w-full items-center justify-center gap-2 px-3 py-0.5">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "idle" ? (
            <motion.span
              key="idle"
              className="font-medium"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6, filter: "blur(2px)" }
              }
              transition={instant ?? { duration: 0.2, ease: easeOut }}
            >
              Upload
            </motion.span>
          ) : null}

          {phase === "uploading" ? (
            <motion.span
              key="uploading"
              className="flex w-full items-center justify-between gap-3 text-sm font-medium tabular-nums"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6, filter: "blur(2px)" }
              }
              transition={instant ?? { duration: 0.2, ease: easeOut }}
            >
              <span className="truncate">{label}</span>
              <span className="shrink-0 opacity-90">{clampedProgress}%</span>
            </motion.span>
          ) : null}

          {phase === "success" ? (
            <motion.span
              key="success"
              className="flex items-center justify-center"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                instant ?? {
                  duration: 0.35,
                  ease: easeOut,
                  delay: 0.08,
                }
              }
            >
              <CheckIcon
                ref={checkRef}
                size={22}
                className="text-success-foreground [&_svg]:size-5.5"
              />
              <span className="sr-only">Upload complete</span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
