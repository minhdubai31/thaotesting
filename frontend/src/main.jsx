import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { I18nProvider, useI18n } from "./i18n";
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

// Ant Design's built-in text (pagination, date pickers) and dayjs follow the chosen language.
function Providers({ children }) {
  const { lang } = useI18n();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  dayjs.locale(lang === "vi" ? "vi" : "en");

  return (
    <ConfigProvider theme={theme} locale={lang === "vi" ? viVN : enUS}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <Providers>
        <App />
      </Providers>
    </I18nProvider>
  </React.StrictMode>
);
