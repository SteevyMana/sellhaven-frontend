import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BsEye, BsEyeSlash, BsBoxArrowInRight } from "react-icons/bs";
import "../styles/Login.css";

// ── Forgot Password Modal ────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setSending(true);
    // Simulado — cuando tengas el endpoint real, reemplaza con api.post("/forgot-password", { email })
    setTimeout(() => { setSent(true); setSending(false); }, 1200);
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>

        {!sent ? (
          <>
            <h4>Reset your password</h4>
            <p>
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <label className="login-label">Email address</label>
            <input
              type="email"
              className="login-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", marginBottom: 0 }}
            />

            <div className="login-modal-actions">
              <button className="login-modal-cancel" onClick={onClose}>Cancel</button>
              <button
                className="login-modal-submit"
                onClick={handleSubmit}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Instructions"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "#dcfce7", color: "#16a34a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", margin: "0 auto 16px"
              }}>✓</div>
              <h4 style={{ marginBottom: "8px" }}>Check your email</h4>
              <p>
                If <strong>{email}</strong> is registered, you'll receive reset instructions shortly.
              </p>
              <button
                className="login-modal-submit"
                onClick={onClose}
                style={{ width: "100%", marginTop: "20px" }}
              >
                Got it
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ── Login principal ──────────────────────────────────────────────
function Login() {
  const navigate        = useNavigate();
  const { login, user } = useAuth();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);

  // Si ya hay sesión, redirigir al dashboard
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  // Cargar email guardado si "Remember me" estaba activo
  useEffect(() => {
    const saved = localStorage.getItem("remember_email");
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);

      // Guardar o limpiar el email según "Remember me"
      if (rememberMe) {
        localStorage.setItem("remember_email", email);
      } else {
        localStorage.removeItem("remember_email");
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      <div className="login-card">

        {/* ── Panel izquierdo ── */}
        <div className="login-left">
          <div className="login-left-bg" />

          <div className="login-left-content">
            <div className="login-accent-line" />
            <h2 className="login-headline">
              Simplify<br />Manage<br />Grow<br />
              <span>Your Business</span>
            </h2>
            <p className="login-subheadline">All in one place.</p>

            <ul className="login-features">
              <li>Real-time sales & inventory tracking</li>
              <li>Online store + physical POS</li>
              <li>Role-based access control</li>
              <li>Full reports & analytics</li>
            </ul>
          </div>

          <div className="login-dev">
            <p className="login-dev-label">Developed by</p>
            <p className="login-dev-name">Steeve Manace</p>
            <p className="login-dev-role">Web Developer · Business Systems</p>
            <p className="login-dev-copy">© 2026 SellHaven</p>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className="login-right">

          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">S</div>
            <div>
              <div className="login-logo-name">
                Sell<span>Haven</span>
              </div>
              <div className="login-logo-tagline">Business Management Platform</div>
            </div>
          </div>

          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to continue to your dashboard.</p>

          <form onSubmit={handleSubmit} autoComplete="off">

            {/* Error */}
            {error && (
              <div className="login-error">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <input
                  type="email"
                  className="login-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password <span style={{ color: "#dc2626" }}>*</span></label>
              <div className="login-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input has-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <BsEyeSlash size={16} /> : <BsEye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot Password */}
            <div className="login-row">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="login-remember-label">Remember me</span>
              </label>
              <button
                type="button"
                className="login-forgot"
                onClick={() => setShowForgot(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "white", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite", display: "inline-block"
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  <BsBoxArrowInRight size={17} />
                  Sign In
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="login-footer">
            <strong>SellHaven</strong> · Business Management Platform
          </div>

        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

    </div>
  );
}

// Spinner keyframe
const style = document.createElement("style");
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

export default Login;