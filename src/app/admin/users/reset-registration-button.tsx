'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { adminResetUserRegistration } from '@/app/actions'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'

export function ResetRegistrationButton({ userId, email, name }: { userId: string; email: string; name: string | null }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await adminResetUserRegistration(userId)
        toast.success('Registration cleared', {
          description: `${email} can now sign in and re-fill their profile. Their login is unchanged.`,
        })
        setOpen(false)
      } catch (err) {
        toast.error('Failed to reset registration', {
          description: err instanceof Error ? err.message : undefined,
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset registration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset {name || email}&apos;s registration?</DialogTitle>
          <DialogDescription>
            This deletes their saved profile (name, RA number, domains, everything they entered) and sends them back
            to the profile setup form. Their login — {email} and their existing password — is not touched, so they
            do not need to sign up again, only re-fill their profile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? 'Resetting…' : 'Reset registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
