import * as React from "react"
import { createPortal } from "react-dom"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// MARK: - Dialog open-state context (drives the manual blur overlay)

const DialogOpenContext = React.createContext(false)

function Dialog({ open, onOpenChange, ...props }: DialogPrimitive.Root.Props) {
  const [internalOpen, setInternalOpen] = React.useState(open ?? false)

  React.useEffect(() => {
    if (open !== undefined) setInternalOpen(open)
  }, [open])

  const handleOpenChange = React.useCallback(
    (next: boolean, eventDetails: DialogPrimitive.Root.ChangeEventDetails) => {
      setInternalOpen(next)
      onOpenChange?.(next, eventDetails)
    },
    [onOpenChange]
  )

  return (
    <DialogOpenContext.Provider value={internalOpen}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DialogOpenContext.Provider>
  )
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  visible,
  ...props
}: React.ComponentProps<"div"> & { visible?: boolean }) {
  return createPortal(
    <div
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-[70] transition-opacity duration-100",
        className
      )}
      style={{
        backgroundColor: "var(--color-surface-overlay)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
      {...props}
    />,
    document.body
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const isOpen = React.useContext(DialogOpenContext)

  return (
    <DialogPortal>
      <DialogOverlay visible={isOpen} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 z-[70] grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-2xl p-4 text-sm duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 3.5rem)",
          backgroundColor: "var(--color-surface-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-dialog)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)",
          transform: "translateX(-50%)",
          ...style,
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, style, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      style={{ color: "var(--color-text-primary)", ...style }}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
