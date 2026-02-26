import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../types';
import { offlineStorage } from '../services/offlineStorage';

interface GoogleAuthHandlerProps {
  onGoogleAuth: (token: string, googleId: string, encryptionSalt: string) => void;
}

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

      if (googleAuth === 'success' && token && googleId && salt) {
        try {
          // Set token via backend to ensure proper cookie settings (httpOnly, secure, sameSite)
          await axios.post(`${API_URL}/api/auth/set-token`, { token }, {
            withCredentials: true
          });
        } catch (err) {
          console.error('Failed to set token via backend, falling back to manual cookie');
          // Fallback: set cookie manually (less secure but functional)
          document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        
        // Save googleId as password for encryption
        await offlineStorage.savePassword(googleId);
        
        // Notify parent component
        onGoogleAuth(token, googleId, salt);

        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    handleGoogleAuthRedirect();
  }, [navigate, onGoogleAuth]);

  return null; // This component doesn't render anything
};
