import type React from "react"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface FieldTooltipProps {
  content: React.ReactNode
}

export function FieldTooltip({ content }: FieldTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <InfoIcon
            className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 ml-1.5 inline-flex cursor-pointer"
            aria-label="More information"
          />
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
