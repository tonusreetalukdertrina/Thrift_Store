'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/layout/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { User as UserIcon } from 'lucide-react'

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || ''

function getImageUrl(path: string): string {
  return path.startsWith('http') ? path : `${storageUrl}${path}`
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePw, setDeletePw] = useState('')

  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/profile', { name, phone })
      const updated = { ...user!, name, phone }
      localStorage.setItem('user', JSON.stringify(updated))
      useAuthStore.setState({ user: updated })
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.new !== pwForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setChangingPw(true)
    try {
      await api.post('/profile/change-password', {
        current_password: pwForm.current,
        new_password: pwForm.new,
        new_password_confirmation: pwForm.confirm,
      })
      toast.success('Password changed')
      setPwForm({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Failed')
    } finally {
      setChangingPw(false)
    }
  }

  const handleDelete = async () => {
    if (!deletePw) return
    setDeleting(true)
    try {
      await api.delete('/profile', { data: { password: deletePw } })
      logout()
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Profile</h1>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {user?.profile_photo_url ? (
              <img src={getImageUrl(user.profile_photo_url)} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.phone}</p>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="mr-2" /> : null}
            Save changes
          </Button>
        </form>

        <Separator />

        <form onSubmit={handleChangePassword} className="space-y-4">
          <h2 className="font-semibold">Change password</h2>
          <div className="space-y-2">
            <Label htmlFor="current">Current password</Label>
            <Input id="current" type="password" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" value={pwForm.new} onChange={(e) => setPwForm((f) => ({ ...f, new: e.target.value }))} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <Button type="submit" variant="outline" disabled={changingPw}>
            {changingPw ? <Spinner className="mr-2" /> : null}
            Change password
          </Button>
        </form>

        <Separator />

        <div className="space-y-4">
          <h2 className="font-semibold text-destructive">Delete account</h2>
          <div className="space-y-2">
            <Label htmlFor="deletePw">Enter your password to confirm</Label>
            <Input id="deletePw" type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} />
          </div>
          <Button variant="destructive" disabled={!deletePw || deleting} onClick={handleDelete}>
            {deleting ? <Spinner className="mr-2" /> : null}
            Delete account
          </Button>
        </div>
      </div>
    </AuthGuard>
  )
}
