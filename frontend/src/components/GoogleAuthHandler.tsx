import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { offlineStorage } from '../services/offlineStorage';
import { authApi } from '../services/api';

interface GoogleAuthHandlerProps {
  onGoogleAuth?: (token: string, googleId: string, encryptionSalt: string) => void;
}

/**
 * GoogleAuthHandler - Handles Google OAuth redirect after authentication
 * 
 * This component listens for URL parameters from Google OAuth redirect
 * and saves the encryptionSalt and googleId for todo encryption.
 * 
 * Primary flow: encryptionSalt is now stored in httpOnly cookie (enc_salt)
 * and retrieved from /api/me endpoint after successful authentication.
 * 
 * Fallback: URL params (encryptionSalt, googleId) for backwards compatibility
 */
export const GoogleAuthHandler: React.FC<GoogleAuthHandlerProps> = ({ onGoogleAuth }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleAuthRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const googleAuth = urlParams.get('google_auth');
      const token = urlParams.get('token');
      const googleId = urlParams.get('googleId');
      const salt = urlParams.get('encryptionSalt');
      const googleError = urlParams.get('google_error');

      if (googleError) {
        // Navigate to home with error
        navigate(`/?google_error=${encodeURIComponent(googleError)}`);
        return;
      }

      if (googleAuth === 'success') {
        // Try to get encryption salt from URL params first (backwards compatibility)
        // Then fetch from /api/me for the secure cookie-based approach
        let encryptionSalt = salt || '';
        
        try {
          // Fetch user data to get encryption salt from secure cookie
          const meData = await authApi.getMe();
          if (meData.encryptionSalt) {
            encryptionSalt = meData.encryptionSalt;
            
            // Save to offline storage for local encryption
            try {
              await offlineStorage.saveEncryptionSalt(encryptionSalt);
            } catch (err) {
              console.error('Failed to save encryption salt:', err);
            }
          }
          
          // Also save googleId if available
          if (meData.googleId) {
            try {
              await offlineStorage.savePassword(meData.googleId);
            } catch (err) {
              console.error('Failed to save googleId:', err);
            }
          }
        } catch (err) {
          // Fallback: use URL params if /api/me fails
          console.warn('Failed to fetch /api/me, using URL params for encryption salt');
          if (salt) {
            try {
              await offlineStorage.saveEncryptionSalt(salt);
            } catch (err) {
              console.error('Failed to save encryption salt:', err);
            }
          }
          
          if (googleId) {
            try {
              await offlineStorage.savePassword(googleId);
            } catch (err) {
              console.error('Failed to save googleId:', err);
            }
          }
        }
        
        // Call optional callback if provided
        if (onGoogleAuth && token && googleId && encryptionSalt) {
          onGoogleAuth(token, googleId, encryptionSalt);
        }

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    handleGoogleAuthRedirect();
  }, [navigate, onGoogleAuth]);

  return null; // This component doesn't render anything
};

export default GoogleAuthHandler;
