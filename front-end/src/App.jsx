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
  const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
  const validatePassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
};

  const handleRegister = async () => {
    setRegisterMessage("");

    if (!name || !email || !password) {
      setRegisterMessage("Please fill all fields");
      return;
    }
    if (!validateEmail(email)) {
  setRegisterMessage("Please enter a valid email address");
  return;
}

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

  const handleLogin = async () => {
  setError("");

  if (!email || !password) {
    setError("Please enter email and password");
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

  return (
    <div className="login-container">
      <div className="login-box">

        <h1>Welcome Back</h1>
        <p>Login to your account</p>

        <label>Name</label>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Email</label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

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

        {error && <p className="error">{error}</p>}

        <button onClick={handleLogin}>
          Login
        </button>

        <button onClick={handleRegister}>
          Register
        </button>

        {registerMessage && (
          <p>{registerMessage}</p>
        )}

      </div>
    </div>
  );
}

export default App;