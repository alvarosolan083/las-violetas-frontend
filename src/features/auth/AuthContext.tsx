// src/features/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthMe, useCondoMembership } from './auth.hooks';
import { authApi } from './auth.api';
import { storage } from '../../lib/storage';
import type { AuthUser, CondoMembershipMe } from './auth.api';

type AuthContextValue = {
    user: AuthUser | null;
    membership: CondoMembershipMe | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    isLoggingOut: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    const hasTokens = !!storage.getAccessToken() && !!storage.getRefreshToken();

    const {
        data: user,
        isLoading: isLoadingUser,
        isError: isUserError,
    } = useAuthMe(hasTokens);

    const {
        data: membership,
        isLoading: isLoadingMembership,
        isError: isMembershipError,
    } = useCondoMembership(hasTokens);

    const isLoading = hasTokens && (isLoadingUser || isLoadingMembership);

    const isAuthenticated = !!user && !!membership;

    // Si hay error de auth (401) o no hay tokens, mandar a /login
    useEffect(() => {
        // sin tokens → login
        if (!hasTokens) {
            navigate('/login', { replace: true });
            return;
        }

        // si hubo error pidiendo el usuario, probablemente el token no sirve
        if (isUserError || isMembershipError) {
            // opcional: podrías revisar el status del error aquí si lo tipas
            storage.clearTokens();
            navigate('/login', { replace: true });
        }
    }, [hasTokens, isUserError, isMembershipError, navigate]);

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const logout = async () => {
        setIsLoggingOut(true);
        try {
            const refreshToken = storage.getRefreshToken();
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch (err) {
            console.error("Error during logout", err);
        } finally {
            storage.clearTokens();
            setIsLoggingOut(false);
            navigate('/login', { replace: true });
        }
    };

    const value: AuthContextValue = {
        user: user ?? null,
        membership: membership ?? null,
        isLoading,
        isAuthenticated,
        logout,
        isLoggingOut,
    };

    // Loading global sencillo
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-600">
                <p>Cargando tu sesión...</p>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}