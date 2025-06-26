import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

function InputWithIcon({ svgIcon, readOnly, value, ...props }: React.ComponentProps<"input"> & { svgIcon: ReactNode }) {
  return (
    <div className="w-full relative flex items-center rounded-md outline focus-within:ring-1 focus-within:ring-ring pl-2">
      {svgIcon}
      <Input
        {...props}
        defaultValue={value}
        readOnly={readOnly}
        className="w-full border-0 focus-visible:ring-0 shadow-none text-sm font-medium"
      />
    </div>
  );
}

export default InputWithIcon;
