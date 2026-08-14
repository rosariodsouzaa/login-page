
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

  // Name: only letters and spaces
  const validateName = (name) => {
    return /^[A-Za-z ]+$/.test(name);
  };

  // Email: must have @ and a valid domain extension
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
  };

  // Password:
  // At least 8 characters
  // At least 1 uppercase
  // At least 1 lowercase
  // At least 1 number
  // At least 1 special character
  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
      password
    );
  };

  // ==================== REGISTER ====================

  const handleRegister = async () => {
    setRegisterMessage("");

    // Empty field validation
    if (!name || !email || !password) {
      setRegisterMessage("Please fill all fields");
      return;
    }

    // Name validation
    if (!validateName(name)) {
      setRegisterMessage(
        "Name should contain only letters and spaces"
      );
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      setRegisterMessage(
        "Please enter a valid email address"
      );
      return;
    }

    // Password validation
    if (!validatePassword(password)) {
      setRegisterMessage(
        "Password must be at least 8 characters and contain uppercase, lowercase, number and special character"
      );
      return;
    }

    try {
      const response = await axios.post(
        "https://login-page-phi-sepia.vercel.app/api/register",
        {
          name: name,
          email: email,
          password: password
        }
      );

      setRegisterMessage(response.data.message);

      // Clear fields after successful registration
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

    // Empty field validation
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const response = await axios.post(
        "https://login-page-phi-sepia.vercel.app/api/login",
        {
          email: email,
          password: password
        }
      );

      // Login successful
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
          onChange={(e) => setName(e.target.value)}
        />

        {/* EMAIL */}

        <label>Email</label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}

        <label>Password</label>

        <div className="password-container">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="show-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>

        </div>

        {/* LOGIN ERROR / SUCCESS */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* LOGIN BUTTON */}

        <button onClick={handleLogin}>
          Login
        </button>

        {/* REGISTER BUTTON */}

        <button onClick={handleRegister}>
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
