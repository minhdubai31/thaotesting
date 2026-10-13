import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useAuth } from "../../auth/AuthContext";
import { useI18n } from "../../i18n";

export default function SignupPage() {
  const { t } = useI18n();
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleFinish(values) {
    setBusy(true);
    setError("");
    try {
      await signup({ email: values.email, username: values.username || undefined, password: values.password });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card style={{ maxWidth: 420, margin: "40px auto" }}>
      <Typography.Title level={3}>{t("signup.title")}</Typography.Title>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={handleFinish}>
        <Form.Item name="email" label={t("signup.email")} rules={[{ required: true, type: "email" }]}>
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="username"
          label={t("signup.username")}
          rules={[{ pattern: /^[A-Za-z0-9_]{3,30}$/, message: t("signup.usernameRule") }]}
        >
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label={t("signup.password")} rules={[{ required: true, min: 8 }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={busy}>
          {t("signup.submit")}
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 16, marginBottom: 0 }}>
        {t("signup.haveAccount")} <Link to="/login">{t("nav.signIn")}</Link>
      </Typography.Paragraph>
    </Card>
  );
}
