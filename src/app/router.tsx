import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import TicketsPage from '../pages/TicketsPage';
import TicketsNewPage from '../pages/TicketsNewPage';
import TicketDetailPage from '../pages/TicketDetailPage';
import AnnouncementsPage from "../pages/AnnouncementsPage";
import ReservationsPage from "../pages/ReservationsPage";
import ReservationDetailPage from "../pages/ReservationDetailPage";
import ReservationsAdminPage from "../pages/ReservationsAdminPage";
import DocumentsPage from "../pages/DocumentsPage";
import DocumentsAdminPage from "../pages/DocumentsAdminPage";
import RouteErrorPage from '../pages/RouteErrorPage';
import { ProtectedLayout } from '../layouts/ProtectedLayout';
import { AuthProvider } from '../features/auth/AuthContext';
import { RequireReservationsManager } from '../components/RequireReservationsManager';
import { RequireDocumentsManager } from '../components/RequireDocumentsManager';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
        errorElement: <RouteErrorPage />,
    },
    {
        path: '/',
        element: (
            <AuthProvider>
                <ProtectedLayout />
            </AuthProvider>
        ),
        errorElement: <RouteErrorPage />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'tickets', element: <TicketsPage /> },
            { path: 'tickets/new', element: <TicketsNewPage /> },
            { path: 'tickets/:ticketId', element: <TicketDetailPage /> },
            { path: 'announcements', element: <AnnouncementsPage /> },
            { path: 'reservations', element: <ReservationsPage /> },
            { path: 'reservations/:spaceId', element: <ReservationDetailPage /> },
            {
                path: 'reservations/admin',
                element: (
                    <RequireReservationsManager>
                        <ReservationsAdminPage />
                    </RequireReservationsManager>
                ),
            },
            { path: 'documents', element: <DocumentsPage /> },
            {
                path: 'documents/admin',
                element: (
                    <RequireDocumentsManager>
                        <DocumentsAdminPage />
                    </RequireDocumentsManager>
                ),
            },
        ],
    },
]);