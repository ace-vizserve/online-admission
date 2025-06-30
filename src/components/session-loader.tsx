import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";

function SessionLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <DotPulse size="50" speed="1.3" color="#1F45C7" />
    </div>
  );
}

export default SessionLoader;
