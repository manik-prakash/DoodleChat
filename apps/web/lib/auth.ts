const TOKEN_KEY = 'doodlechat_token';
const USER_KEY = 'doodlechat_user';

export interface UserData {
    id: string;
    email: string;
    username?: string;
}

export function saveToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);

        // Decode JWT to extract user data
        try {
            const parts = token.split('.');
            if (parts.length === 3 && parts[1]) {
                const payload = JSON.parse(atob(parts[1]));
                if (payload.userID) {
                    saveUser({
                        id: payload.userID,
                        email: payload.email || '',
                        username: payload.username
                    });
                }
            }
        } catch (e) {
            console.error('Failed to decode token:', e);
        }
    }
}

export function getToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

export function removeToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

export function saveUser(user: UserData): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

export function getUser(): UserData | null {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem(USER_KEY);
        if (user) {
            return JSON.parse(user);
        }

        // Try to extract from token if user data is missing
        const token = getToken();
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3 && parts[1]) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.userID) {
                        const userData: UserData = {
                            id: payload.userID,
                            email: payload.email || '',
                            username: payload.username
                        };
                        saveUser(userData);
                        return userData;
                    }
                }
            } catch (e) {
                console.error('Failed to decode token:', e);
            }
        }
    }
    return null;
}

export function logout(): void {
    removeToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}
