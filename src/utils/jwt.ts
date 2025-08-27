// utils/jwt.ts
export const decodeToken = (token: string) => {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true; // Consider invalid tokens as expired
        }
        
        // exp is in seconds, convert to milliseconds
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        
        // Add 5 minute buffer to refresh before actual expiration
        const bufferTime = 5 * 60 * 1000;
        
        return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // Consider error cases as expired
    }
};

export const isRefreshTokenExpired = (refreshToken: string): boolean => {
    try {
        const decoded = decodeToken(refreshToken);
        if (!decoded || !decoded.exp) {
            return true; // Consider invalid tokens as expired
        }
        
        // exp is in seconds, convert to milliseconds
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        
        // Refresh tokens should have a longer buffer since they're used less frequently
        // Add 1 hour buffer to refresh before actual expiration
        const bufferTime = 60 * 60 * 1000;
        
        return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
        console.error('Error checking refresh token expiration:', error);
        return true; // Consider error cases as expired
    }
};

export const getTokenExpirationTime = (token: string): Date | null => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            return null;
        }
        
        // exp is in seconds, convert to milliseconds
        const expirationTime = decoded.exp * 1000;
        return new Date(expirationTime);
    } catch (error) {
        console.error('Error getting token expiration time:', error);
        return null;
    }
};