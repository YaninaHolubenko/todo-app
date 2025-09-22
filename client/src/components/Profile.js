// client/src/components/Profile.js
import { useState } from 'react'
import './Profile.css'

const EyeIcon = ({ open = false }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6 10.6A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.52 0 1-.13 1.4-.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.88 5.09A10.5 10.5 0 0 1 12 5c6 0 10 7 10 7a17.5 17.5 0 0 1-4.06 4.44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.06 7.94A17.5 17.5 0 0 0 2 12s4 7 10 7c1.01 0 1.99-.18 2.92-.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const Profile = ({ onUpdated }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newEmail: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess('')

    const payload = {}
    const wantEmail = form.newEmail.trim() !== ''
    const wantPassword = form.newPassword.trim() !== ''

    if (!wantEmail && !wantPassword) return setError('Nothing to update')
    if ((wantEmail || wantPassword) && !form.currentPassword) return setError('Please enter your current password')

    if (wantEmail) {
      const nextEmail = form.newEmail.trim().toLowerCase()
      if (!emailRe.test(nextEmail)) return setError('Please enter a valid email')
      payload.newEmail = nextEmail
    }

    if (wantPassword) {
      if (form.newPassword.length < 6) return setError('New password must be at least 6 characters')
      if (form.newPassword !== form.confirmNewPassword) return setError('Make sure new passwords match')
      payload.newPassword = form.newPassword
    }

    payload.currentPassword = form.currentPassword
    setLoading(true)
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        setError(res.status === 401 ? (msg.detail || 'Session expired. Please sign in again.') : (msg.detail || 'Update failed'))
        return
      }
      const data = await res.json().catch(() => ({}))
      setSuccess('Profile updated')
      setForm((s) => ({ ...s, currentPassword: '', newPassword: '', confirmNewPassword: '' }))
      if (typeof onUpdated === 'function' && data?.email) onUpdated(data.email)
      else if (data?.email && wantEmail) window.location.reload()
    } catch (err) {
      console.error(err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setError('')
    setSuccess('')
    const first = window.confirm('This will permanently delete your account and all tasks. Continue?')
    if (!first) return
    const phrase = window.prompt('Type DELETE to confirm')
    if ((phrase || '').trim().toUpperCase() !== 'DELETE') return

    setDeleting(true)
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVERURL}/users/me`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.status === 204) {
        window.location.reload()
        return
      }
      const msg = await res.json().catch(() => ({}))
      setError(msg.detail || 'Delete failed')
    } catch (err) {
      console.error(err)
      setError('Network error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="profile">
      <h2 className="profile__title">Profile</h2>
      <p className="profile__subtitle">
        Update your email and password. Leave a field blank to keep it unchanged.
      </p>

      <form onSubmit={handleSubmit} aria-busy={loading} noValidate>
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <div className="pwd-wrap">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Current password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={handleChange}
              disabled={loading}
            />
            <button
              type="button"
              className="pwd-toggle"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
              aria-pressed={showCurrent}
              onClick={() => setShowCurrent((v) => !v)}
            >
              <EyeIcon open={showCurrent} />
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="newEmail">New email</label>
          <input
            id="newEmail"
            name="newEmail"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={form.newEmail}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <div className="pwd-wrap">
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="New password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              className="pwd-toggle"
              aria-label={showNew ? 'Hide password' : 'Show password'}
              aria-pressed={showNew}
              onClick={() => setShowNew((v) => !v)}
            >
              <EyeIcon open={showNew} />
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="confirmNewPassword">Confirm new password</label>
          <div className="pwd-wrap">
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={form.confirmNewPassword}
              onChange={handleChange}
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              className="pwd-toggle"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirm}
              onClick={() => setShowConfirm((v) => !v)}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="form-success" role="status">{success}</p>}

        <div className="button-container profile__actions">
          <button className="create" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            className="delete"
            onClick={handleDelete}
            disabled={deleting || loading}
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default Profile
