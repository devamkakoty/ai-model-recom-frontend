"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DeploymentModeToggleProps {
  onChange: (isPostDeployment: boolean) => void
  defaultMode?: boolean // true for post-deployment, false for pre-deployment
}

export function DeploymentModeToggle({ onChange, defaultMode = false }: DeploymentModeToggleProps) {
  const [isPostDeployment, setIsPostDeployment] = useState(defaultMode)

  const handleToggle = (checked: boolean) => {
    setIsPostDeployment(checked)
    onChange(checked)
  }

  return (
    <Card className="shadow-md border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 relative mb-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="deployment-mode" className="text-base font-medium">
              Optimization Mode:
            </Label>
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">
              {isPostDeployment ? "Post-Deployment" : "Pre-Deployment"}
            </span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4" side="bottom">
                  <p className="font-medium mb-2">Choose the optimization mode:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <span className="font-semibold">Pre-Deployment:</span> Get hardware recommendations before
                      deploying your AI workload based on model characteristics.
                    </li>
                    <li>
                      <span className="font-semibold">Post-Deployment:</span> Optimize based on actual runtime metrics
                      from your deployed AI workload.
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="deployment-mode" className={isPostDeployment ? "text-slate-500" : "font-medium"}>
              Pre-Deployment
            </Label>
            <Switch
              id="deployment-mode"
              checked={isPostDeployment}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-indigo-600"
            />
            <Label htmlFor="deployment-mode" className={isPostDeployment ? "font-medium" : "text-slate-500"}>
              Post-Deployment
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
