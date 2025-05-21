import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

function InputWithIcon({ svgIcon, value }: { value: string; svgIcon: ReactNode }) {
  return (
    <div className="relative flex items-center rounded-md outline focus-within:ring-1 focus-within:ring-ring pl-2">
      {svgIcon}
      <Input defaultValue={value} readOnly className="border-0 focus-visible:ring-0 shadow-none text-sm font-medium" />
    </div>
  );
}

export default InputWithIcon;
