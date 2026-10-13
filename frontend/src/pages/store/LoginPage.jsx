import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useAuth } from "../../auth/AuthContext";
import { STAFF_ROLES } from "../../lib/format";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    const isStaff = user?.roles?.some((role) => STAFF_ROLES.includes(role));
    return <Navigate to={location.state?.from || (isStaff ? "/admin" : "/")} replace />;
  }

  async function handleFinish({ identifier, password }) {
    setBusy(true);
    setError("");
    try {
      await login(identifier, password);
      // Redirect happens above once the user is loaded.
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card style={{ maxWidth: 420, margin: "40px auto" }}>
      <Typography.Title level={3}>Sign in</Typography.Title>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={handleFinish} initialValues={{ identifier: "" }}>
        <Form.Item name="identifier" label="Username or email" rules={[{ required: true }]}>
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={busy}>
          Sign in
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 16, marginBottom: 0 }}>
        New here? <Link to="/signup">Create an account</Link>
      </Typography.Paragraph>
      <Button type="link" onClick={() => navigate("/")} style={{ display: "block", margin: "8px auto 0" }}>
        Continue browsing
      </Button>
    </Card>
  );
}
