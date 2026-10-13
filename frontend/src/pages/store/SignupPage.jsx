import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useAuth } from "../../auth/AuthContext";

export default function SignupPage() {
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
      <Typography.Title level={3}>Create account</Typography.Title>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={handleFinish}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item name="username" label="Username (optional)" rules={[{ pattern: /^[A-Za-z0-9_]{3,30}$/, message: "3-30 letters, numbers or _" }]}>
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" label="Password (min 8 characters)" rules={[{ required: true, min: 8 }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={busy}>
          Sign up
        </Button>
      </Form>
      <Typography.Paragraph style={{ textAlign: "center", marginTop: 16, marginBottom: 0 }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </Typography.Paragraph>
    </Card>
  );
}
