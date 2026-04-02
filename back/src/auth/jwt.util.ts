import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // User ID is stored in 'sub' field
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  iat: number;
  exp: number;
}

export const extractUserFromToken = (req: any): JwtPayload | null => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.decode(token) as JwtPayload;

    return decoded;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};
