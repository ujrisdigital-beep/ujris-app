import * as React from "react"

const Slider = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    min?: number
    max?: number
    value?: number
    onValueChange?: (value: number) => void
  }
>(({ className, min = 0, max = 100, value = 0, onValueChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(parseInt(e.target.value))
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={handleChange}
      className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:bg-slate-700 ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
})
Slider.displayName = "Slider"

export { Slider }
