import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { profileApi, getApiErrorMessage } from '../services/api';
import type { User, ProfileUpdateData, MessageType } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdate: (user: User) => void;
  onMessage: (message: string, type: MessageType) => void;
  onDeleteAccount: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onProfileUpdate,
  onMessage,
  onDeleteAccount 
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setError('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data: ProfileUpdateData = {};
      if (displayName.trim()) data.displayName = displayName.trim();
      if (bio.trim()) data.bio = bio.trim();
      if (avatar.trim()) data.avatar = avatar.trim();

      const response = await profileApi.updateProfile(data);
      onProfileUpdate(response.user);
      onMessage('Profile updated successfully', 'success');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await profileApi.deleteProfile();
      onMessage('Account deleted', 'success');
      onDeleteAccount();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  };

  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    padding: '2rem',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    border: '1px solid var(--border-secondary)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    marginBottom: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
    fontSize: '0.875rem',
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'var(--accent-gradient)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--glow)',
    opacity: isLoading ? 0.7 : 1,
    marginRight: '0.75rem',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
  };

  const buttonDangerStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
    opacity: isLoading ? 0.7 : 1,
  };

  const errorStyle: React.CSSProperties = {
    padding: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  };

  const dangerZoneStyle: React.CSSProperties = {
    marginTop: '2rem',
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && !showDeleteConfirm && onClose()}>
      <div style={modalStyle}>
        {/* Close Button */}
        <button
          onClick={() => !showDeleteConfirm && onClose()}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '0.5rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--hover-bg)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ 
          margin: '0 0 1.5rem 0', 
          color: 'var(--text-primary)',
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Edit Profile
        </h2>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
              maxLength={50}
            />
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              maxLength={500}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              {bio.length}/500
            </div>
          </div>

          <div>
            <label style={labelStyle}>Avatar URL</label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => !showDeleteConfirm && onClose()}
              style={buttonSecondaryStyle}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={buttonPrimaryStyle}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div style={dangerZoneStyle}>
          {showDeleteConfirm ? (
            <div>
              <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                ⚠️ Delete your account?
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                This will permanently delete your account and all your tasks. This action cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleDeleteAccount}
                  style={buttonDangerStyle}
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={buttonSecondaryStyle}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                  Delete Account
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Remove account and all data
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

