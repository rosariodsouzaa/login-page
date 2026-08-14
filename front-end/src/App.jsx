
import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");

  // ==================== VALIDATION ====================

  const validateName = (name) => {
    return /^[A-Za-z ]+$/.test(name);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
  };

  // Individual password checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  // ==================== REGISTER ====================

  const handleRegister = async () => {
    setRegisterMessage("");

    if (!name || !email || !password) {
      setRegisterMessage("Please fill all fields");
      return;
    }

    if (!validateName(name)) {
      setRegisterMessage(
        "Name should contain only letters and spaces"
      );
      return;
    }

    if (!validateEmail(email)) {
      setRegisterMessage("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setRegisterMessage(
        "Please satisfy all password requirements"
      );
      return;
    }

    try {
      const response = await axios.post(
        "https://login-page-phi-sepia.vercel.app/api/register",
        {
          name,
          email,
          password,
        }
      );

      setRegisterMessage(response.data.message);

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log("REGISTER ERROR:", error);
      console.log("SERVER RESPONSE:", error.response?.data);

      setRegisterMessage(
        error.response?.data?.message || "Registration failed"
      );
    }
  };

  // ==================== LOGIN ====================

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const response = await axios.post(
        "https://login-page-phi-sepia.vercel.app/api/login",
        {
          email,
          password,
        }
      );

      setError(response.data.message);
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      setError(
        error.response?.data?.message || "Login failed"
      );
    }
  };

  // ==================== UI ====================

  return (
    <div className="login-container">
      <div className="login-box">

        <h1>Welcome Back</h1>
        <p>Login to your account</p>

        {/* NAME */}

        <label>Name</label>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setRegisterMessage("");
          }}
        />

        {name && !validateName(name) && (
          <p className="validation-error">
             Name should contain only letters and spaces
          </p>
        )}

        {name && validateName(name) && (
          <p className="validation-success">
             Name is valid
          </p>
        )}

        {/* EMAIL */}

        <label>Email</label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setRegisterMessage("");
          }}
        />

        {email && !validateEmail(email) && (
          <p className="validation-error">
             Please enter a valid email address
          </p>
        )}

        {email && validateEmail(email) && (
          <p className="validation-success">
             Email is valid
          </p>
        )}

        {/* PASSWORD */}

        <label>Password</label>

        <div className="password-container">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setRegisterMessage("");
            }}
          />

          <button
            type="button"
            className="show-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>

        </div>

        {/* PASSWORD REQUIREMENTS */}

        {password && (
          <div className="password-requirements">

            <p className={
              passwordChecks.length
                ? "validation-success"
                : "validation-error"
            }>
              {passwordChecks.length ? "✅" : "❌"} At least 8 characters
            </p>

            <p className={
              passwordChecks.uppercase
                ? "validation-success"
                : "validation-error"
            }>
              {passwordChecks.uppercase ? "✅" : "❌"} One uppercase letter
            </p>

            <p className={
              passwordChecks.lowercase
                ? "validation-success"
                : "validation-error"
            }>
              {passwordChecks.lowercase ? "✅" : "❌"} One lowercase letter
            </p>

            <p className={
              passwordChecks.number
                ? "validation-success"
                : "validation-error"
            }>
              {passwordChecks.number ? "✅" : "❌"} One number
            </p>

            <p className={
              passwordChecks.special
                ? "validation-success"
                : "validation-error"
            }>
              {passwordChecks.special ? "✅" : "❌"} One special character
            </p>

          </div>
        )}

        {/* LOGIN MESSAGE */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* LOGIN */}

        <button onClick={handleLogin}>
          Login
        </button>

        {/* REGISTER */}

        <button
          onClick={handleRegister}
          disabled={
            !name ||
            !email ||
            !password ||
            !validateName(name) ||
            !validateEmail(email) ||
            !validatePassword(password)
          }
        >
          Register
        </button>

        {/* REGISTER MESSAGE */}

        {registerMessage && (
          <p>
            {registerMessage}
          </p>
        )}

      </div>
    </div>
  );
}

export default App;

