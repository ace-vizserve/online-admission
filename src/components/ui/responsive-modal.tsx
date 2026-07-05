import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { useMediaQuery } from "react-responsive";

type ResponsiveModalProps = {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Rendered next to the title (e.g. a status Badge). */
  badge?: ReactNode;
  /** The body content — written once by the caller and shared between the Dialog and Drawer. */
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Renders a Radix `Dialog` above the breakpoint and a `Drawer` below it, sharing ONE body
 * (`children`) between both — only the outer chrome (trigger/header/footer primitives) differs.
 *
 * This exists specifically to stop mobile/desktop implementations from being hand-copied and
 * drifting apart (missing labels, missing status badges, etc. on one side but not the other) —
 * see the enrollment upload-dialog consolidation plan for the concrete bugs this fixes.
 */
function ResponsiveModal({
  trigger,
  title,
  description,
  badge,
  children,
  footer,
  contentClassName,
  open,
  onOpenChange,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery({ query: "(min-width: 786px)" });

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className={cn("!max-w-3xl", contentClassName)}>
          <DialogHeader className="text-start">
            <div className="flex items-center gap-4">
              <DialogTitle className="font-black text-2xl">{title}</DialogTitle>
              {badge}
            </div>
            {description && <DialogDescription className="font-semibold">{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {footer}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn("px-4 space-y-4", contentClassName)}>
        <DrawerHeader className="!text-start px-0 mb-0">
          <div className="flex items-center gap-4">
            <DrawerTitle className="text-xl font-black">{title}</DrawerTitle>
            {badge}
          </div>
          {description && <DrawerDescription className="text-xs font-semibold">{description}</DrawerDescription>}
        </DrawerHeader>
        {children}
        <DrawerFooter className="px-0 py-4">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ResponsiveModal;
