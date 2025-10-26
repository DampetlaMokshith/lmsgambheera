import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SuggestiveSearchProps {
  onChange?: (val: string) => void;
  suggestions?: string[];
  className?: string;
  effect?: "typewriter";
}

const SuggestiveSearch: React.FC<SuggestiveSearchProps> = ({
  onChange,
  suggestions = ["Search courses", "Find assignments", "Look for resources"],
  className,
}) => {
  const [search, setSearch] = useState<string>("");

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange?.(val);
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-x-2 py-2 px-4 border border-white rounded-full bg-black",
        className
      )}
    >
      <Search className="size-4 text-white" />
      <input
        type="text"
        value={search}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={suggestions[0]}
        className="bg-transparent outline-none text-sm text-white placeholder:text-white/50 w-full"
        aria-label="search"
      />
    </div>
  );
};

export default SuggestiveSearch;