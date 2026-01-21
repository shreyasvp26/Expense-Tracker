// Mock authentication service
// This will be replaced with real API calls when backend auth is implemented

const MOCK_USERS_KEY = 'expense_tracker_users';

/**
 * Mock signup - stores user in localStorage
 */
export const signup = async (userData) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Get existing users
                const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');

                // Check if email already exists
                if (users.find(u => u.email === userData.email)) {
                    reject(new Error('Email already registered'));
                    return;
                }

                // Create new user
                const newUser = {
                    id: Date.now(),
                    name: userData.name,
                    email: userData.email,
                    password: userData.password, // In real app, this would be hashed on backend
                    createdAt: new Date().toISOString(),
                };

                // Save user
                users.push(newUser);
                localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));

                // Generate mock token
                const token = btoa(JSON.stringify({ userId: newUser.id, email: newUser.email }));

                // Save auth state
                localStorage.setItem('auth_token', token);
                const userWithoutPassword = { ...newUser };
                delete userWithoutPassword.password;
                localStorage.setItem('user', JSON.stringify(userWithoutPassword));

                resolve({
                    user: userWithoutPassword,
                    token,
                });
            } catch (error) {
                reject(error);
            }
        }, 500); // Simulate network delay
    });
};

/**
 * Mock login - validates credentials from localStorage
 */
export const login = async (email, password) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Get existing users
                const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');

                // Find user
                const user = users.find(u => u.email === email && u.password === password);

                if (!user) {
                    reject(new Error('Invalid email or password'));
                    return;
                }

                // Generate mock token
                const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));

                // Save auth state
                localStorage.setItem('auth_token', token);
                const userWithoutPassword = { ...user };
                delete userWithoutPassword.password;
                localStorage.setItem('user', JSON.stringify(userWithoutPassword));

                resolve({
                    user: userWithoutPassword,
                    token,
                });
            } catch (error) {
                reject(error);
            }
        }, 500); // Simulate network delay
    });
};

/**
 * Logout - clears auth state
 */
export const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('auth_token');
};
