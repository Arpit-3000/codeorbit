import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-soft text-primary [a&]:hover:bg-primary/20',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-accent',
        destructive:
          'border-transparent bg-destructive/12 text-destructive [a&]:hover:bg-destructive/20',
        outline:
          'border-border-strong text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
