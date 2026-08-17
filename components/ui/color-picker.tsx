"use client"

import type { PopoverContentProps } from "@radix-ui/react-popover"
import {
  type HexColor,
  hexToHsva,
  type HslaColor,
  hslaToHsva,
  type HsvaColor,
  hsvaToHex,
  hsvaToHsla,
  hsvaToHslString,
  hsvaToRgba,
  type RgbaColor,
  rgbaToHsva,
} from "@uiw/color-convert"
import Hue from "@uiw/react-color-hue"
import Saturation from "@uiw/react-color-saturation"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function getColorAsHsva(color: `#${string}` | HsvaColor | HslaColor | RgbaColor): HsvaColor {
  if (typeof color === "string") return hexToHsva(color)
  if ("v" in color) return color
  if ("r" in color) return rgbaToHsva(color)
  return hslaToHsva(color)
}

type ColorPickerValue = {
  hex: string
  hsl: HslaColor
  rgb: RgbaColor
}

type ColorPickerProps = {
  value?: `#${string}` | HsvaColor | HslaColor | RgbaColor
  type?: "hsl" | "rgb" | "hex"
  swatches?: HexColor[]
  hideContrastRatio?: boolean
  hideDefaultSwatches?: boolean
  className?: string
  children: React.ReactNode
  onValueChange?: (value: ColorPickerValue) => void
} & Omit<PopoverContentProps, "className" | "children">

function ColorPicker({
  value,
  children,
  type = "hsl",
  swatches = [],
  hideContrastRatio,
  hideDefaultSwatches,
  onValueChange,
  className,
  ...contentProps
}: ColorPickerProps) {
  const [colorType, setColorType] = React.useState(type)
  const [internalColorHsv, setInternalColorHsv] = React.useState<HsvaColor>(
    value ? getColorAsHsva(value) : { h: 0, s: 0, v: 0, a: 1 }
  )
  const colorHsv = value ? getColorAsHsva(value) : internalColorHsv

  const handleValueChange = (color: HsvaColor) => {
    setInternalColorHsv(color)
    onValueChange?.({
      hex: hsvaToHex(color),
      hsl: hsvaToHsla(color),
      rgb: hsvaToRgba(color),
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[350px] border-0 p-0 shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_8px_24px_-8px_rgba(0,0,0,0.18),0_2px_8px_-3px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_32px_-10px_rgba(0,0,0,0.55)]",
          className
        )}
        {...contentProps}
        style={{
          ...contentProps.style,
          "--selected-color": hsvaToHslString(colorHsv),
        } as React.CSSProperties}
      >
        <div className="space-y-2 p-4">
          <Saturation
            hsva={colorHsv}
            onChange={handleValueChange}
            style={{ width: "100%", height: "auto", aspectRatio: "4/2", borderRadius: "0.3rem" }}
            className="border border-border"
          />
          <Hue
            hue={colorHsv.h}
            onChange={(newHue) => handleValueChange({ ...colorHsv, ...newHue })}
            className="[&>div:first-child]:overflow-hidden [&>div:first-child]:!rounded"
            style={{
              width: "100%",
              height: "0.9rem",
              borderRadius: "0.3rem",
              "--alpha-pointer-background-color": "var(--foreground)",
            } as React.CSSProperties}
          />

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 justify-between uppercase">
                  {colorType}
                  <ChevronDownIcon className="-me-1 ms-2 opacity-60" size={16} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(["hex", "hsl", "rgb"] as const).map((colorMode) => (
                  <DropdownMenuCheckboxItem
                    key={colorMode}
                    checked={colorType === colorMode}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={() => setColorType(colorMode)}
                  >
                    {colorMode.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="min-w-0 grow">
              {colorType === "hsl" && (
                <ObjectColorInput value={hsvaToHsla(colorHsv)} label="hsl" onValueChange={(next) => handleValueChange(hslaToHsva(next))} />
              )}
              {colorType === "rgb" && (
                <ObjectColorInput value={hsvaToRgba(colorHsv)} label="rgb" onValueChange={(next) => handleValueChange(rgbaToHsva(next))} />
              )}
              {colorType === "hex" && (
                <Input
                  aria-label="Hex color"
                  value={hsvaToHex(colorHsv)}
                  onChange={(event) => {
                    if (/^#[\da-f]{6}$/i.test(event.target.value)) handleValueChange(hexToHsva(event.target.value))
                  }}
                />
              )}
            </div>
          </div>

          {!hideDefaultSwatches && <Separator />}
          {!hideDefaultSwatches && (
            <div className="flex flex-wrap justify-start gap-2">
              {(["#F8371A", "#F97C1B", "#FAC81C", "#3FD0B6", "#2CADF6", "#6462FC", ...swatches] as HexColor[])
                .sort((a, b) => hexToHsva(a).h - hexToHsva(b).h)
                .map((color) => (
                  <button
                    type="button"
                    key={`${color}-swatch`}
                    style={{ "--swatch-color": color } as React.CSSProperties}
                    onClick={() => handleValueChange(hexToHsva(color))}
                    aria-label={`Set color to ${color}`}
                    className="size-5 rounded bg-[var(--swatch-color)] ring-2 ring-transparent ring-offset-1 ring-offset-background transition-all hover:ring-[var(--swatch-color)] focus-visible:outline-none focus-visible:ring-[var(--swatch-color)]"
                  />
                ))}
            </div>
          )}
          {!hideContrastRatio && (
            <>
              <Separator />
              <ContrastRatio color={colorHsv} />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ContrastRatio({ color }: { color: HsvaColor }) {
  const rgb = hsvaToRgba(color)
  const toLinear = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b)
  const onBlack = Number(((luminance + 0.05) / 0.05).toFixed(2))
  const onWhite = Number((1.05 / (luminance + 0.05)).toFixed(2))

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded bg-[var(--selected-color)]">
          <span className="font-medium text-black dark:text-white">A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Contrast ratio</span>
          <span className="text-sm"><span className="dark:hidden">{onBlack}</span><span className="hidden dark:inline">{onWhite}</span></span>
        </div>
      </div>
      <div className="flex gap-1">
        <ValidationBadge className="dark:hidden" ratio={onBlack} limit={4.5}>AA</ValidationBadge>
        <ValidationBadge className="dark:hidden" ratio={onBlack} limit={7}>AAA</ValidationBadge>
        <ValidationBadge className="hidden dark:inline-flex" ratio={onWhite} limit={4.5}>AA</ValidationBadge>
        <ValidationBadge className="hidden dark:inline-flex" ratio={onWhite} limit={7}>AAA</ValidationBadge>
      </div>
    </div>
  )
}

function ValidationBadge({ ratio, limit, className, children }: { ratio: number; limit: number; className?: string; children: React.ReactNode }) {
  const passes = ratio >= limit
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full text-muted-foreground", passes && "border-transparent bg-emerald-500/20 text-emerald-700 dark:text-emerald-400", className)}
    >
      {passes ? <CheckIcon size={12} /> : <XIcon size={12} />}
      {children}
    </Badge>
  )
}

type ObjectColorInputProps =
  | { label: "hsl"; value: HslaColor; onValueChange: (value: HslaColor) => void }
  | { label: "rgb"; value: RgbaColor; onValueChange: (value: RgbaColor) => void }

function ObjectColorInput(props: ObjectColorInputProps) {
  if (props.label === "hsl") {
    return (
      <ColorChannelInputs
        label="HSL"
        channels={["h", "s", "l"]}
        value={props.value}
        onValueChange={props.onValueChange}
      />
    )
  }

  return (
    <ColorChannelInputs
      label="RGB"
      channels={["r", "g", "b"]}
      value={props.value}
      onValueChange={props.onValueChange}
    />
  )
}

function ColorChannelInputs<Color extends HslaColor | RgbaColor, Channel extends keyof Color>({
  label,
  channels,
  value,
  onValueChange,
}: {
  label: string
  channels: readonly Channel[]
  value: Color
  onValueChange: (value: Color) => void
}) {
  return (
    <div className="flex">
      {channels.map((channel, index) => (
        <div className={cn("relative min-w-0 flex-1 focus-within:z-10", index > 0 && "-ms-px")} key={String(channel)}>
          <Input
            aria-label={`${label} ${String(channel).toUpperCase()}`}
            inputMode="numeric"
            className={cn("shadow-none", index === 0 && "rounded-e-none", index === 1 && "rounded-none", index === 2 && "rounded-s-none")}
            value={Math.round(Number(value[channel]))}
            onChange={(event) => {
              const nextValue = Number(event.target.value)
              if (!Number.isFinite(nextValue)) return
              onValueChange({ ...value, [channel]: nextValue })
            }}
          />
        </div>
      ))}
    </div>
  )
}

export { ColorPicker }
export type { ColorPickerProps, ColorPickerValue }
