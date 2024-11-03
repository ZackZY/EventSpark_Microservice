export const getDomain = (isOffline = false): string => {
  return isOffline
    ? 'localhost'
    : process.env.COOKIE_DOMAIN || '.yourdomain.com';
};

export interface CookieOptions {
  token: string;
  isOffline?: boolean;
}

export const getCookieString = ({ token, isOffline = false }: CookieOptions): string => {
  const domain = getDomain(isOffline);
  
  return [
    `token=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=3600'
  ].filter(Boolean).join('; ');
};

export const getClearCookieString = ({ isOffline = false }: Omit<CookieOptions, 'token'>): string => {
  const domain = getDomain(isOffline);

  return [
    'token=',
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0'
  ].filter(Boolean).join('; ');
};

export const getCorsHeaders = (origin?: string, isOffline = false) => ({
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': isOffline 
    ? 'http://localhost:3000'
    : (process.env.FRONTEND_URL || origin || ''),
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type'
}); 