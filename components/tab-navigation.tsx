"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TabNavigationProps {
  activeTab: string
  onChange: (value: string) => void
}

export function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  return (
    <div className="mb-8">
      <Tabs value={activeTab} onValueChange={onChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 rounded-xl shadow-md">
          <TabsTrigger
            value="simulate"
            className="relative h-12 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Simulate Performance
          </TabsTrigger>
          <TabsTrigger
            value="optimize"
            className="relative h-12 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Optimize Hardware
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
