import { Badge } from "./badge";

function PendingBadge() {
  return (
    <Badge className="bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 border-amber-600/60 shadow-none rounded-full">
      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" /> In Progress
    </Badge>
  );
}

export default PendingBadge;
