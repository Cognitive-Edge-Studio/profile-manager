import type { ComponentProps } from 'react'
import { cn } from '../../utils'
export function Input({ className, ...props }: ComponentProps<'input'>) { return <input className={cn('form-control', className)} {...props} /> }
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) { return <textarea className={cn('form-control form-textarea', className)} {...props} /> }
