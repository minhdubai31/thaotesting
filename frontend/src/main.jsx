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
    colorPrimary: "#db2777",
    colorLink: "#db2777",
    colorLinkHover: "#9d174d",
    colorBgLayout: "#fdf6f9",
    borderRadius: 14,
    borderRadiusLG: 18,
    borderRadiusSM: 10,
    boxShadow: "none",
    boxShadowSecondary: "none",
    boxShadowTertiary: "none",
    controlOutline: "none",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: { headerBg: "#ffffff", bodyBg: "#fdf6f9", siderBg: "#2a1420" },
    Menu: { darkItemBg: "#2a1420", darkItemSelectedBg: "#db2777", darkItemHoverBg: "#3d1d2e" },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      borderRadius: 999,
      fontWeight: 500,
    },
    Card: { headerBg: "#ffffff", boxShadowTertiary: "none" },
    Table: {
      headerBg: "#fce7f3",
      headerColor: "#831843",
      headerSplitColor: "transparent",
      borderColor: "#f3c6dd",
      rowHoverBg: "#fdf2f8",
      headerSortActiveBg: "#fbcfe8",
      headerSortHoverBg: "#fbcfe8",
    },
    Select: { optionSelectedBg: "#fce7f3" },
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
