import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { routes } from "./routes/index.routes";
import { ChatSocketProvider } from "./hooks/useSocket";

createRoot(document.getElementById("root")!).render(
  <ChatSocketProvider>
    <StrictMode>
      <RouterProvider router={routes} />
      <Toaster />
    </StrictMode>
  </ChatSocketProvider>
);
