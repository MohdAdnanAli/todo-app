import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { offlineStorage } from '../services/offlineStorage';

interface GoogleAuthHandlerProps {
  onGoogleAuth?: (token: string, googleId: string, encryptionSalt: string) => void;
}

/**
 * GoogleAuthHandler - Handles Google OAuth redirect after authentication
 * 
 * This component listens for URL parameters from Google OAuth redirect
 * and saves the encryptionSalt and googleId for todo encryption.
 * 
 * Note: Authentication is primarily cookie-based, so token handling
 * is minimal. The main purpose is to capture encryption credentials.
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
        // Save encryption salt for todo decryption
        if (salt) {
          try {
            await offlineStorage.saveEncryptionSalt(salt);
          } catch (err) {
            console.error('Failed to save encryption salt:', err);
          }
        }
        
        // Save googleId as password for encryption
        if (googleId) {
          try {
            await offlineStorage.savePassword(googleId);
          } catch (err) {
            console.error('Failed to save googleId:', err);
          }
        }
        
        // Call optional callback if provided
        if (onGoogleAuth && token && googleId && salt) {
          onGoogleAuth(token, googleId, salt);
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
