import { Badge } from "./badge";

function SuccessBadge() {
  return (
    <Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 border-emerald-600/60 shadow-none rounded-full">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" /> Done
    </Badge>
  );
}

export default SuccessBadge;
