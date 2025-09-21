import { useState } from 'react'

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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const viewLogin = (status) => {
    setError('')
    setIsLogin(status)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    const fd = new FormData(e.currentTarget)
    const emailValue = String(fd.get('email') || '').trim().toLowerCase()
    const passwordValue = String(fd.get('password') || '').trim()
    const confirmValue = String(fd.get('confirmPassword') || '').trim()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

    if (!emailValue) return setError('Please enter your email')
    if (!emailRe.test(emailValue)) return setError('Please enter a valid email')
    if (!passwordValue) return setError('Please enter your password')
    if (passwordValue.length < 6) return setError('Password must be at least 6 characters')
    if (!isLogin && passwordValue !== confirmValue) return setError('Make sure passwords match')

    const endpoint = isLogin ? 'login' : 'signup'
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.REACT_APP_SERVERURL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      })

      // Try to parse JSON safely
      let data = null
      try {
        data = await response.json()
      } catch {
        /* ignore parse errors */
      }

      if (!response.ok || (data && data.detail)) {
        setError((data && data.detail) || 'Request failed')
        return
      }

      // Optional: store browser credentials on secure contexts
      try {
        if (isLogin && 'credentials' in navigator && window.isSecureContext) {
          const cred = await navigator.credentials.create({
            password: { id: emailValue, name: emailValue, password: passwordValue },
          })
          if (cred) await navigator.credentials.store(cred)
        }
      } catch {
        /* ignore */
      }

      // httpOnly cookie is set by the server; just reload to hydrate session via /me
      window.location.reload()
    } catch (err) {
      console.error(err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-container-box">
        <form onSubmit={handleSubmit} noValidate autoComplete="on">
          <h2 className="auth-title">{isLogin ? 'Please log in' : 'Create an account'}</h2>

          <input
            name="email"
            type="email"
            placeholder="email"
            autoComplete={isLogin ? 'username' : 'email'}
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="pwd-wrap">
            <input
              name="password"
              type={showPwd ? 'text' : 'password'}
              placeholder="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="pwd-toggle"
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              aria-pressed={showPwd}
              onClick={() => setShowPwd((v) => !v)}
            >
              <EyeIcon open={showPwd} />
            </button>
          </div>

          {!isLogin && (
            <div className="pwd-wrap">
              <input
                name="confirmPassword"
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="confirm password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="pwd-toggle"
                aria-label={showConfirmPwd ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPwd}
                onClick={() => setShowConfirmPwd((v) => !v)}
              >
                <EyeIcon open={showConfirmPwd} />
              </button>
            </div>
          )}

          {error && <p role="alert" style={{ marginTop: 2 }}>{error}</p>}

          <button className="create" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-options">
          <button type="button" onClick={() => viewLogin(false)}>Sign Up</button>
          <button type="button" onClick={() => viewLogin(true)}>Login</button>
        </div>
      </div>
    </div>
  )
}

export default Auth
