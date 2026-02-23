import React, { useState, useEffect, memo } from 'react';
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

const ProfileModal: React.FC<ProfileModalProps> = memo(({ 
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

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && !showDeleteConfirm && onClose()}
    >
      <div 
        className="relative rounded-2xl p-8 w-[90%] max-w-[480px] max-h-[90vh] overflow-auto"
        style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-secondary)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' 
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => !showDeleteConfirm && onClose()}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-2 rounded-lg 
            text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all duration-200"
        >
          <X size={20} />
        </button>

        <h2 className="m-0 mb-6 text-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Edit Profile
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-lg text-sm"
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#ef4444' 
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">Display Name</label>
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]
                min-h-[100px] resize-y"
              maxLength={500}
            />
            <div className="text-xs text-[var(--text-muted)] text-right mt-1">{bio.length}/500</div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">Avatar URL</label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => !showDeleteConfirm && onClose()}
              className="px-6 py-3 rounded-lg font-medium text-base
                bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-secondary)]
                hover:bg-[var(--hover-bg)] transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg font-medium text-base
                bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md
                hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              style={{ boxShadow: 'var(--glow)' }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div 
          className="mt-8 p-4 rounded-lg"
          style={{ 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.2)' 
          }}
        >
          {showDeleteConfirm ? (
            <div>
              <div className="text-red-500 font-semibold mb-2 text-sm">⚠️ Delete your account?</div>
              <div className="text-[var(--text-secondary)] text-xs mb-4">
                This will permanently delete your account and all your tasks. This action cannot be undone.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-md font-medium text-sm
                    bg-gradient-to-r from-red-500 to-rose-500 text-white
                    hover:shadow-lg transition-all duration-200"
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-md font-medium text-sm
                    bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-secondary)]
                    hover:bg-[var(--hover-bg)] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">Delete Account</div>
                <div className="text-[var(--text-muted)] text-xs">Remove account and all data</div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1
                  bg-transparent border transition-all duration-200"
                style={{ 
                  borderColor: 'rgba(239, 68, 68, 0.5)', 
                  color: '#ef4444' 
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
});

ProfileModal.displayName = 'ProfileModal';

export default ProfileModal;
