import { Info } from "lucide-react";

export function TooltipInfo({ text }: { text: string }) {
  return (
    <div className="relative group cursor-pointer inline-block ml-1">
      <Info className="w-4 h-4 text-gray-500" />
      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  );
}