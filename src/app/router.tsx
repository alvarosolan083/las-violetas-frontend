import { createBrowserRouter, Outlet } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import TicketsNewPage from "../pages/TicketsNewPage";
import TicketDetailPage from "../pages/TicketDetailPage";
import TicketsPage from "../pages/TicketsPage";
import RouteErrorPage from "../pages/RouteErrorPage";

export const router = createBrowserRouter([
    { path: "/login", element: <LoginPage />, errorElement: <RouteErrorPage /> },

    {
        path: "/",
        element: <Outlet />,
        errorElement: <RouteErrorPage />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: "tickets", element: <TicketsPage /> },
            { path: "tickets/new", element: <TicketsNewPage /> },
            { path: "tickets/:ticketId", element: <TicketDetailPage /> },
        ],
    },

    // catch-all 404
    { path: "*", element: <RouteErrorPage /> },
]);