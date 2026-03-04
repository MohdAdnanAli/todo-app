import type { Request, Response } from 'express';
import { User } from '../models/User';

/**
 * Check if email is available for registration
 * This is a simple check without Supabase
 */
export const checkEmailAvailability = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check MongoDB
    const mongoUser = await User.findOne({ email: email.toLowerCase() });
    
    if (mongoUser) {
      return res.json({
        available: false,
        system: mongoUser.authProvider,
        message: `This email is already registered via ${mongoUser.authProvider}. Please use ${mongoUser.authProvider} to sign in.`,
      });
    }

    return res.json({
      available: true,
      system: null,
      message: 'Email is available',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to check email availability' });
  }
};

