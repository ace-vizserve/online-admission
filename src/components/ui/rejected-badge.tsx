import { Badge } from "./badge";

function RejectedBadge() {
  return (
    <Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 border-red-600/60 shadow-none rounded-full">
      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Rejected
    </Badge>
  );
}

export default RejectedBadge;
