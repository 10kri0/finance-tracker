import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { authAPI } from '../api/api'

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Edit profile state
  const [name, setName] = useState(user?.name || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' })
      return
    }
    setProfileLoading(true)
    try {
      const data = await authAPI.updateProfile({ name: name.trim() })
      updateUser(data.user)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      const msg = err?.data?.error || 'Failed to update profile.'
      setProfileMsg({ type: 'error', text: msg })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All fields are required.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setPasswordLoading(true)
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = err?.data?.error || 'Failed to change password.'
      setPasswordMsg({ type: 'error', text: msg })
    } finally {
      setPasswordLoading(false)
    }
  }

  const initial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <img src="/spendwise-logo.png" alt="SpendWise" className="logo-img" />
            <span className="logo-text" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SpendWise</span>
          </div>
        </div>
        <div className="header-right">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} id="profile-theme-toggle-btn">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')} id="back-to-dashboard-btn">
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="dashboard-main">
        <div className="profile-container">

          {/* User Info Card */}
          <div className="profile-card profile-info-card">
            <div className="profile-avatar-large">
              <span>{initial}</span>
            </div>
            <div className="profile-details">
              <h1 className="profile-name">{user?.name || 'User'}</h1>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-joined">
                Member since {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          {/* Edit Profile Section */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">✏️</div>
              <h2>Edit Profile</h2>
            </div>
            {profileMsg && (
              <div className={`profile-msg ${profileMsg.type === 'success' ? 'profile-msg-success' : 'profile-msg-error'}`}>
                {profileMsg.text}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={150}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-disabled"
                />
              </div>
              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="auth-btn"
                  disabled={profileLoading}
                  id="update-profile-btn"
                >
                  {profileLoading ? <span className="btn-spinner"></span> : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">🔒</div>
              <h2>Change Password</h2>
            </div>
            {passwordMsg && (
              <div className={`profile-msg ${passwordMsg.type === 'success' ? 'profile-msg-success' : 'profile-msg-error'}`}>
                {passwordMsg.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="auth-btn"
                  disabled={passwordLoading}
                  id="change-password-btn"
                >
                  {passwordLoading ? <span className="btn-spinner"></span> : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Logout */}
          <div className="profile-card profile-logout-card">
            <button className="btn btn-logout" onClick={logout} id="profile-logout-btn">
              <span className="btn-icon">🚪</span> Sign Out
            </button>
          </div>

        </div>
      </main>

      <footer className="dashboard-footer">
        <p>© 2026 SpendWise. Built with Django + React.</p>
      </footer>
    </div>
  )
}
