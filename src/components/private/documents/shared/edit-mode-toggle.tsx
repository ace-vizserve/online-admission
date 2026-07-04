import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EditModeToggleProps = {
  editMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
};

/**
 * The "Viewing Mode"/"Editing Mode" card + toggle — was re-declared identically in
 * `single-documents.tsx` and `old-family-info.tsx` (only the surrounding page header's subtitle
 * text differed between the two, which stays in each page rather than being forced into this
 * shared piece).
 */
export function EditModeToggle({ editMode, onEditModeChange }: EditModeToggleProps) {
  return (
    <div
      className={cn(
        "w-full md:max-w-xs flex items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200",
        editMode
          ? "bg-secondary/5 border-secondary/30 ring-1 ring-secondary/20"
          : "bg-primary/5 border-border hover:bg-primary/10",
      )}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className={cn("size-2 rounded-full", editMode ? "bg-secondary" : "bg-primary")} />
          <p className="text-sm font-semibold leading-none tracking-tight">
            {editMode ? "Editing Mode" : "Viewing Mode"}
          </p>
        </div>
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
          {editMode ? "You can now modify student details." : "Switch to edit to update information."}
        </p>
      </div>

      <Switch
        checked={editMode}
        onCheckedChange={(checked) => {
          if (checked) {
            toast.info("Edit mode enabled!", {
              description: "You can now modify the student details.",
            });
          } else {
            toast.info("View mode enabled!", {
              description: "Fields are locked and cannot be edited.",
            });
          }

          onEditModeChange(checked);
        }}
        className="data-[state=checked]:bg-secondary cursor-pointer"
      />
    </div>
  );
}
