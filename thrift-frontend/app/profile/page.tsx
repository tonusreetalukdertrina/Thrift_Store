'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'
import Cookies from 'js-cookie'

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}

function ProfileContent() {
  const router          = useRouter()
  const { user, setAuth, logout } = useAuthStore()

  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>('profile')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg]     = useState('')
  const [deletePassword, setDeletePassword] = useState('')

  const [form, setForm] = useState({
    name:  '',
    phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password:       '',
    new_password:           '',
    new_password_confirmation: '',
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    api.get('/profile')
      .then((res) => {
        const u = res.data.data
        setProfile(u)
        setForm({ name: u.name || '', phone: u.phone || '' })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const clearMessages = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async () => {
    clearMessages()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('phone', form.phone)
      if (photoFile) formData.append('profile_photo', photoFile)

      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const updated = res.data.data
      setProfile(updated)

      // Update the cookie so Navbar reflects new name instantly
      const userJson = Cookies.get('auth_user')
      if (userJson) {
        const currentUser = JSON.parse(userJson)
        const newUser = { ...currentUser, ...updated }
        setAuth(newUser, Cookies.get('token') || '')
      }

      setSuccessMsg('Profile updated successfully')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.meta?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
  clearMessages()

  if (!passwordForm.current_password) {
    setErrorMsg('Enter your current password')
    return
  }
  if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
    setErrorMsg('New passwords do not match')
    return
  }
  if (passwordForm.new_password.length < 6) {
    setErrorMsg('New password must be at least 6 characters')
    return
  }

  setSaving(true)
  try {
    await api.post('/profile/change-password', passwordForm)
    setSuccessMsg('Password changed. Please log in again.')
    setTimeout(() => {
      logout()
      router.replace('/auth/login')
    }, 2000)
  } catch (err: any) {
    setErrorMsg(err.response?.data?.meta?.message || 'Failed to change password')
  } finally {
    setSaving(false)
  }
}

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This cannot be undone.'
    )
    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'All your listings and data will be permanently removed. Continue?'
    )
    if (!doubleConfirm) return

    try {
      await api.delete('/profile', { data: { password: deletePassword } })
      logout()
      router.replace('/auth/register')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.meta?.message || 'Failed to delete account')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const avatarSrc = photoPreview
    || (profile?.profile_photo_url ? `http://localhost:8000${profile.profile_photo_url}` : null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account settings</h1>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 bg-white border border-gray-200 rounded-2xl p-6">
        <div className="relative">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition text-sm">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
            ✎
          </label>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{profile?.name}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            profile?.role === 'admin'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {profile?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: 'profile',  label: 'Profile' },
          { key: 'password', label: 'Password' },
          { key: 'danger',   label: 'Danger zone' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); clearMessages() }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed for security reasons
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+8801XXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile photo
              </label>
              {photoPreview && (
                <div className="mb-3">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                  />
                </div>
              )}
              <label className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                📷 Choose photo
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {/* Password tab */}
        {activeTab === 'password' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 8 chars, upper, lower, number, symbol"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={passwordForm.new_password_confirmation}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat new password"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handlePasswordSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </div>
        )}

        {/* Danger zone tab */}
        {activeTab === 'danger' && (
  <div className="space-y-4">
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
      <h3 className="text-sm font-semibold text-red-700 mb-1">Delete account</h3>
      <p className="text-sm text-red-600 mb-4">
        Permanently delete your account. This cannot be undone.
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm your password to delete
          </label>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your current password"
            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <button
          onClick={handleDeleteAccount}
          disabled={!deletePassword}
          className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          Delete my account
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  )
}