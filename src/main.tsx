import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { RouterProvider } from "react-router-dom";
import { routes } from "./routes/index.routes";
import { ChatSocketProvider } from "./hooks/useSocket";

createRoot(document.getElementById("root")!).render(
  <ChatSocketProvider>
    <StrictMode>
      <RouterProvider router={routes} />
    </StrictMode>
  </ChatSocketProvider>
);
