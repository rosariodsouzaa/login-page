
import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const API_URL = "http://localhost:5000";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  const [loggedInUser, setLoggedInUser] = useState(null);


  // ==================== VALIDATION ====================

  const validateName = (name) => {
    return /^[A-Za-z ]+$/.test(name);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
  };

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
      setRegisterMessage(
        "Please enter a valid email address"
      );
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
        `${API_URL}/api/register`,
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
      console.log(
        "SERVER RESPONSE:",
        error.response?.data
      );

      setRegisterMessage(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };


  // ==================== LOGIN ====================

  const handleLogin = async () => {
    setError("");
    setOtpMessage("");

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
        `${API_URL}/api/login`,
        {
          email,
          password,
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      // OTP required
      if (response.data.requiresOTP) {

        // Show OTP in browser console
        console.log(
          "Generated OTP:",
          response.data.otp
        );

        setShowOtp(true);

        setOtpMessage(
          "OTP generated. Check the browser console."
        );

        return;
      }

      setError(response.data.message);

    } catch (error) {

      console.log("LOGIN ERROR:", error);

      setError(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };


  // ==================== VERIFY OTP ====================

  const handleVerifyOTP = async () => {

    setOtpMessage("");
    setError("");

    if (!otp) {
      setOtpMessage("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      setOtpMessage("OTP must contain 6 digits");
      return;
    }

    try {

      const response = await axios.post(
        `${API_URL}/api/verify-otp`,
        {
          email,
          otp,
        }
      );

      console.log(
        "OTP VERIFICATION:",
        response.data
      );

      if (response.data.success) {

        setLoggedInUser(response.data.user);

        setShowOtp(false);

        setOtp("");

        setOtpMessage("");

      }

    } catch (error) {

      console.log(
        "OTP ERROR:",
        error
      );

      setOtpMessage(
        error.response?.data?.message ||
        "OTP verification failed"
      );
    }
  };


  // ==================== DASHBOARD ====================

  if (loggedInUser) {

    return (
      <div className="login-container">

        <div className="login-box">

          <h1>Dashboard</h1>

          <p>
            Welcome, {loggedInUser.name}! 🎉
          </p>

          <p>
            You have successfully logged in.
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {loggedInUser.email}
          </p>

          <button
            onClick={() => {
              setLoggedInUser(null);
              setEmail("");
              setPassword("");
            }}
          >
            Logout
          </button>

        </div>

      </div>
    );
  }


  // ==================== UI ====================

  return (
    <div className="login-container">

      <div className="login-box">

        <h1>Welcome Back</h1>

        <p>
          {showOtp
            ? "Enter the OTP to continue"
            : "Login to your account"}
        </p>


        {/* ================= OTP SCREEN ================= */}

        {showOtp ? (

          <>
            <label>OTP</label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {

                const value =
                  e.target.value.replace(/\D/g, "");

                setOtp(value);
                setOtpMessage("");
              }}
            />

            {otpMessage && (
              <p className="error">
                {otpMessage}
              </p>
            )}

            <button onClick={handleVerifyOTP}>
              Verify OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setOtp("");
                setOtpMessage("");
              }}
            >
              Back to Login
            </button>

          </>

        ) : (

          <>

            {/* ================= NAME ================= */}

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
                ❌ Name should contain only letters and spaces
              </p>
            )}

            {name && validateName(name) && (
              <p className="validation-success">
                ✅ Name is valid
              </p>
            )}


            {/* ================= EMAIL ================= */}

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
                ❌ Please enter a valid email address
              </p>
            )}

            {email && validateEmail(email) && (
              <p className="validation-success">
                ✅ Email is valid
              </p>
            )}


            {/* ================= PASSWORD ================= */}

            <label>Password</label>

            <div className="password-container">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
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
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>


            {/* ================= PASSWORD REQUIREMENTS ================= */}

            {password && (

              <div className="password-requirements">

                <p className={
                  passwordChecks.length
                    ? "validation-success"
                    : "validation-error"
                }>
                  {passwordChecks.length
                    ? "✅"
                    : "❌"}{" "}
                  At least 8 characters
                </p>

                <p className={
                  passwordChecks.uppercase
                    ? "validation-success"
                    : "validation-error"
                }>
                  {passwordChecks.uppercase
                    ? "✅"
                    : "❌"}{" "}
                  One uppercase letter
                </p>

                <p className={
                  passwordChecks.lowercase
                    ? "validation-success"
                    : "validation-error"
                }>
                  {passwordChecks.lowercase
                    ? "✅"
                    : "❌"}{" "}
                  One lowercase letter
                </p>

                <p className={
                  passwordChecks.number
                    ? "validation-success"
                    : "validation-error"
                }>
                  {passwordChecks.number
                    ? "✅"
                    : "❌"}{" "}
                  One number
                </p>

                <p className={
                  passwordChecks.special
                    ? "validation-success"
                    : "validation-error"
                }>
                  {passwordChecks.special
                    ? "✅"
                    : "❌"}{" "}
                  One special character
                </p>

              </div>
            )}


            {/* ================= LOGIN ERROR ================= */}

            {error && (
              <p className="error">
                {error}
              </p>
            )}


            {/* ================= LOGIN ================= */}

            <button onClick={handleLogin}>
              Login
            </button>


            {/* ================= REGISTER ================= */}

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


            {/* ================= REGISTER MESSAGE ================= */}

            {registerMessage && (
              <p>
                {registerMessage}
              </p>
            )}

          </>

        )}

      </div>

    </div>
  );
}

export default App;
