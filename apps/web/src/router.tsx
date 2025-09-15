import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/ui/AppLayout";
import { LoginPage } from "@/pages/LoginPage/LoginPage";
import { RoundsListPage } from "@/pages/RoundsListPage/RoundsListPage";
import { RoundPage } from "@/pages/RoundPage/RoundPage";
import { NotFoundPage } from "@/pages/NotFoundPage/NotFoundPage";
import { RootErrorBoundary } from "@/ui/RootErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      { index: true, element: <RoundsListPage /> },
      { path: "rounds", element: <RoundsListPage /> },
      { path: "rounds/:id", element: <RoundPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
