import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const theme = {
  token: {
    colorPrimary: "#1677ff",
    colorLink: "#1677ff",
    colorLinkHover: "#0958d9",
    colorBgLayout: "#f5f5f5",
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    boxShadowTertiary: "none",
    controlOutline: "none",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: { headerBg: "#ffffff", bodyBg: "#f5f5f5" },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      fontWeight: 500,
    },
    Card: { headerBg: "#ffffff", boxShadowTertiary: "none" },
    Table: {
      cellPaddingBlock: 8,
      cellPaddingInline: 12,
      headerBg: "#fafafa",
      headerColor: "rgba(0, 0, 0, 0.88)",
      headerSortActiveBg: "#f0f0f0",
      headerSortHoverBg: "#f0f0f0",
      rowHoverBg: "#fafafa",
    },
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
