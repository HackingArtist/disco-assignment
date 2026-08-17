"use client"

/* eslint-disable jsx-a11y/label-has-associated-control */

import { Slot } from "@radix-ui/react-slot"
import * as React from "react"

import { cn } from "@/lib/utils"

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function FieldControl({ className, ...props }: React.ComponentProps<typeof Slot>) {
  return (
    <Slot
      data-slot="field-control"
      className={cn(className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    />
  )
}

export { Field, FieldLabel, FieldControl, FieldDescription, FieldError }
