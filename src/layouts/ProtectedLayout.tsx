// src/layouts/ProtectedLayout.tsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { AppShell } from '../components/AppShell';

export const ProtectedLayout: React.FC = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // AppShell es tu layout principal (sidebar / header / etc.)
    return (
        <AppShell>
            <Outlet />
        </AppShell>
    );
};