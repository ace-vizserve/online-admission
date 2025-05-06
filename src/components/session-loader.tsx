import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";

function SessionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <DotPulse size="50" speed="1.3" color="#111A2E" />
    </div>
  );
}

export default SessionLoader;
