import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("relative flex flex-col gap-4", className)} {...props} />
})
Timeline.displayName = "Timeline"

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("flex gap-3", className)} {...props} />
})
TimelineItem.displayName = "TimelineItem"

interface TimelineSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineSeparator = React.forwardRef<HTMLDivElement, TimelineSeparatorProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("flex flex-col items-center", className)} {...props} />
})
TimelineSeparator.displayName = "TimelineSeparator"

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "gray" | "green" | "red" | "blue" | "yellow" | "purple"
}

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  ({ className, color = "gray", ...props }, ref) => {
    const colorClasses = {
      gray: "bg-gray-100 text-gray-600 border-gray-300",
      green: "bg-green-100 text-green-600 border-green-300",
      red: "bg-red-100 text-red-600 border-red-300",
      blue: "bg-blue-100 text-blue-600 border-blue-300",
      yellow: "bg-yellow-100 text-yellow-600 border-yellow-300",
      purple: "bg-purple-100 text-purple-600 border-purple-300",
    }

    return (
      <div
        ref={ref}
        className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2", colorClasses[color], className)}
        {...props}
      />
    )
  },
)
TimelineDot.displayName = "TimelineDot"

interface TimelineConnectorProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("h-full w-0.5 bg-gray-200", className)} {...props} />
})
TimelineConnector.displayName = "TimelineConnector"

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("flex-1 pt-1", className)} {...props} />
})
TimelineContent.displayName = "TimelineContent"

interface TimelineHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineHeader = React.forwardRef<HTMLDivElement, TimelineHeaderProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("mb-1", className)} {...props} />
})
TimelineHeader.displayName = "TimelineHeader"

interface TimelineTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const TimelineTitle = React.forwardRef<HTMLHeadingElement, TimelineTitleProps>(({ className, ...props }, ref) => {
  return <h3 ref={ref} className={cn("text-base font-medium", className)} {...props} />
})
TimelineTitle.displayName = "TimelineTitle"

export {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
}
