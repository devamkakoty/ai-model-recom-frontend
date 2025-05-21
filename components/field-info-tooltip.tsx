"use client"

import type React from "react"
import { useState } from "react"
import { InfoIcon } from "lucide-react"

interface FieldInfoTooltipProps {
  content: React.ReactNode
}

export function FieldInfoTooltip({ content }: FieldInfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block ml-1.5">
      <InfoIcon
        className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div
          className="absolute z-50 p-3 text-sm bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700"
          style={{
            bottom: "calc(100% + 8px)",
            left: "-4px",
            width: "260px",
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {content}
          <div className="absolute w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 transform rotate-45 left-4 -bottom-1"></div>
        </div>
      )}
    </div>
  )
}
