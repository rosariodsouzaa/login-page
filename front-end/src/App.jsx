import { useState,useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const API_URL = "https://login-page-phi-sepia.vercel.app";
  const ROSARIO_TOKEN_ADDRESS =
  "0x5aEcae526872e40dFc3C478e40fCE2Ab814090E4";

const ROSARIO_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

  // =========================
  // STATE
  // =========================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [error, setError] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  // Stores the currently logged-in user
  const [loggedInUser, setLoggedInUser] = useState(null);

  // =========================
  // METAMASK WEB3 STATE
  // =========================

  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);
  const [rosBalance, setRosBalance] = useState(null);
  const [rosSymbol, setRosSymbol] = useState("ROS");

const [recipientAddress, setRecipientAddress] = useState("");
const [rosAmount, setRosAmount] = useState("");

const [isSendingROS, setIsSendingROS] = useState(false);
const [rosTransactionStatus, setRosTransactionStatus] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("BNB");
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [web3Error, setWeb3Error] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const verifySession = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/session`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setLoggedInUser(response.data.user);
        }
      } catch {
        localStorage.removeItem("token");
      }
    };

    verifySession();
  }, []);

  // Map Chain IDs to Human Readable Names & Native Token Symbol
  const getNetworkDetailsByChainId = (chainId) => {
    switch (chainId) {
      case "0x38":
        return { name: "BNB Smart Chain Mainnet", symbol: "BNB" };
      case "0x61":
        return { name: "BNB Smart Chain Testnet", symbol: "BNB" };
      case "0x1":
        return { name: "Ethereum Mainnet", symbol: "ETH" };
      case "0xaa36a7":
        return { name: "Sepolia Testnet", symbol: "ETH" };
      case "0x5":
        return { name: "Goerli Testnet", symbol: "ETH" };
      case "0x89":
        return { name: "Polygon Mainnet", symbol: "MATIC" };
      case "0x13881":
        return { name: "Polygon Mumbai", symbol: "MATIC" };
      case "0xa4b1":
        return { name: "Arbitrum One", symbol: "ETH" };
      case "0xa":
        return { name: "Optimism", symbol: "ETH" };
      case "0x539":
      case "0x7a69":
        return { name: "Localhost 8545", symbol: "BNB" };
      default:
        return { name: `Chain ID: ${chainId}`, symbol: "BNB" };
    }
  };
  const fetchWalletDetails = async (account) => {
  if (!window.ethereum || !account) return;

  try {
    const provider = new ethers.BrowserProvider(
      window.ethereum
    );

    // Get BNB balance
    const balance = await provider.getBalance(account);

    setWalletBalance(
      Number(ethers.formatEther(balance)).toFixed(4)
    );

    // Get network
    const network = await provider.getNetwork();

    const chainId = "0x" + Number(network.chainId).toString(16);

    const networkDetails =
      getNetworkDetailsByChainId(chainId);

    setNetworkName(networkDetails.name);
    setCurrencySymbol(networkDetails.symbol);

    // Get ROS balance
    await fetchRosarioTokenBalance(account);

  } catch (error) {
    console.error(
      "Error fetching wallet details:",
      error
    );
  }
};

  // Fetch Balance and Network details
  const fetchRosarioTokenBalance = async (account) => {
  if (!window.ethereum || !account) return;

  try {
    const provider = new ethers.BrowserProvider(
      window.ethereum
    );

    const tokenContract = new ethers.Contract(
      ROSARIO_TOKEN_ADDRESS,
      ROSARIO_TOKEN_ABI,
      provider
    );

    const balance = await tokenContract.balanceOf(account);

    const decimals = await tokenContract.decimals();

    const symbol = await tokenContract.symbol();

    const formattedBalance = ethers.formatUnits(
      balance,
      decimals
    );

    setRosBalance(formattedBalance);
    setRosSymbol(symbol);

  } catch (error) {
    console.error(
      "Error fetching ROS balance:",
      error
    );

    setRosBalance(null);
  }
};
// =========================
// CONNECT METAMASK
// =========================

const connectMetaMask = async () => {
  setWeb3Error("");
  setIsConnectingWallet(true);

  if (!window.ethereum) {
    setWeb3Error(
      "MetaMask extension is not installed in your browser."
    );
    setIsConnectingWallet(false);
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts && accounts.length > 0) {
      const account = accounts[0];

      setWalletAddress(account);

      await fetchWalletDetails(account);
    }
  } catch (err) {
    if (err.code === 4001) {
      setWeb3Error(
        "Connection request was cancelled in MetaMask."
      );
    } else {
      setWeb3Error(
        err.message || "Failed to connect MetaMask wallet."
      );
    }
  } finally {
    setIsConnectingWallet(false);
  }
};

  // Disconnect Wallet
  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletBalance(null);
    setNetworkName("");
    setCurrencySymbol("BNB");
    setSignature("");
    setWeb3Error("");
  };

  // Sign Session Message with MetaMask
  const handleSignMessage = async () => {
    if (!walletAddress || !window.ethereum) return;
    setIsSigning(true);
    setWeb3Error("");
    try {
      const timestamp = new Date().toISOString();
      const message = `MetaMask Session Verification\n\nUser: ${loggedInUser?.name} (${loggedInUser?.email})\nWallet: ${walletAddress}\nTime: ${timestamp}`;
      const sig = await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });
      setSignature(sig);
    } catch (err) {
      if (err.code === 4001) {
        setWeb3Error("Signature request was cancelled by user.");
      } else {
        setWeb3Error("Failed to sign message.");
      }
    } finally {
      setIsSigning(false);
    }
  };

  // Copy wallet address to clipboard
  const handleCopyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // MetaMask Auto-detect & Event Listeners
  useEffect(() => {
    if (!loggedInUser) return;

    if (typeof window !== "undefined" && window.ethereum) {
      setIsMetaMaskInstalled(true);

      // Check if wallet is already connected
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchWalletDetails(accounts[0]);
          }
        })
        .catch(console.error);

      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletAddress(accounts[0]);
          fetchWalletDetails(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        if (walletAddress) {
          fetchWalletDetails(walletAddress);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    } else {
      setIsMetaMaskInstalled(false);
    }
  }, [loggedInUser]);

  // =========================
  // VALIDATION
  // =========================

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

  // =========================
  // REGISTER
  // =========================

  const handleRegister = async () => {
    setRegisterMessage("");
    setError("");

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

      if (response.data.requiresOTP) {
        console.log(
          "Registration OTP:",
          response.data.otp
        );

        setShowOtp(true);

        setOtpMessage(
          response.data.message ||
            "OTP generated. Please enter the OTP."
        );
      }
    } catch (error) {
      setRegisterMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  // =========================
  // LOGIN
  // =========================

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
        `${API_URL}/api/login`,
        {
          email,
          password,
        }
      );

      if (response.data.success) {
        // Save JWT token
        localStorage.setItem(
          "token",
          response.data.token
        );

        // Save logged-in user
        setLoggedInUser(response.data.user);

        // Clear login messages
        setError("");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    }
  };
  

  // =========================
  // REGISTRATION OTP
  // =========================

  const handleVerifyOTP = async () => {
    setOtpMessage("");

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
        `${API_URL}/api/verify-registration-otp`,
        {
          email,
          otp,
        }
      );

      if (response.data.success) {
        // Hide OTP screen
        setShowOtp(false);

        // Clear OTP
        setOtp("");

        // Clear registration fields
        setName("");
        setEmail("");
        setPassword("");

        // Go back to login
        setIsRegistering(false);

        // Show success message
        setRegisterMessage(
          "Registration successful. Please login."
        );
      }
    } catch (error) {
      setOtpMessage(
        error.response?.data?.message ||
          "OTP verification failed"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    try {
      // Tell backend to invalidate the JWT session
      await axios.post(
        `${API_URL}/api/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      // Remove JWT from browser
      localStorage.removeItem("token");

      // Disconnect MetaMask session
      disconnectWallet();

      // Clear logged-in user
      setLoggedInUser(null);

      // Clear login fields
      setEmail("");
      setPassword("");

      // Clear messages
      setError("");
      setRegisterMessage("");
      setOtpMessage("");
    }
  };
  const handleSendROS = async () => {
  setRosTransactionStatus("");
  setWeb3Error("");

  if (!walletAddress) {
    setWeb3Error("Please connect your wallet first.");
    return;
  }

  if (!recipientAddress) {
    setRosTransactionStatus(
      "Please enter the recipient address."
    );
    return;
  }

  if (!ethers.isAddress(recipientAddress)) {
    setRosTransactionStatus(
      "Invalid wallet address."
    );
    return;
  }

  if (!rosAmount || Number(rosAmount) <= 0) {
    setRosTransactionStatus(
      "Please enter a valid ROS amount."
    );
    return;
  }

  try {
    setIsSendingROS(true);

    const provider = new ethers.BrowserProvider(
      window.ethereum
    );

    // MetaMask account
    const signer = await provider.getSigner();

    // Connect contract with signer
    const tokenContract = new ethers.Contract(
      ROSARIO_TOKEN_ADDRESS,
      ROSARIO_TOKEN_ABI,
      signer
    );

    // Get token decimals
    const decimals =
      await tokenContract.decimals();

    // Convert human amount to blockchain amount
    const amount =
      ethers.parseUnits(
        rosAmount,
        decimals
      );

    setRosTransactionStatus(
      "Please confirm the transaction in MetaMask..."
    );

    // Send ROS
    const transaction =
      await tokenContract.transfer(
        recipientAddress,
        amount
      );

    setRosTransactionStatus(
      "Transaction submitted. Waiting for confirmation..."
    );

    // Wait for blockchain confirmation
    await transaction.wait();

    setRosTransactionStatus(
      "ROS sent successfully! 🎉"
    );

    // Clear form
    setRecipientAddress("");
    setRosAmount("");

    // Refresh balance
    await fetchRosarioTokenBalance(
      walletAddress
    );

  } catch (error) {

    console.error(
      "ROS transfer error:",
      error
    );

    if (error.code === 4001) {
      setRosTransactionStatus(
        "Transaction cancelled in MetaMask."
      );
    } else {
      setRosTransactionStatus(
        error.reason ||
        error.message ||
        "Transaction failed."
      );
    }

  } finally {
    setIsSendingROS(false);
  }
};
const handleReceiveROS = async () => {
  if (!walletAddress) {
    setWeb3Error(
      "Connect your wallet first."
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(
      walletAddress
    );

    setRosTransactionStatus(
      "Your wallet address has been copied. Send it to the person who wants to send you ROS."
    );

  } catch {
    setRosTransactionStatus(
      "Copy failed. Your address is: " +
      walletAddress
    );
  }
};

  // =========================
  // DASHBOARD
  // =========================

  if (loggedInUser) {
    return (
      <div className="login-container">
        <div className="login-box dashboard-box">
          <div className="user-profile-header">
            <div className="avatar-circle">
              {loggedInUser.name ? loggedInUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1>Welcome, {loggedInUser.name}!</h1>
              <p className="user-email">{loggedInUser.email}</p>
            </div>
          </div>

          <div className="metamask-section">
            <div className="metamask-header">
              <div className="metamask-title">
                <svg className="metamask-icon" viewBox="0 0 318.6 318.6" width="28" height="28">
                  <path fill="#E2761B" stroke="#E2761B" strokeMiterlimit="10" d="M274.1 35.5l-99.5 73.9L193.5 18l-114.7 0 18.9 91.4-99.5-73.9L0 159.9l104.9 51.5-39.6 61.1 114.7-31.5 114.7 31.5-39.6-61.1L318.6 159.9z"/>
                  <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M117.8 241l-24.7 44.4 99.5 0-24.7-44.4z"/>
                </svg>
                <h2>MetaMask Web3 Account</h2>
              </div>
              {walletAddress && (
                <span className="status-badge connected">
                  <span className="dot"></span> Connected
                </span>
              )}
            </div>

            {web3Error && <div className="error web3-error-banner">{web3Error}</div>}

            {!isMetaMaskInstalled ? (
              <div className="metamask-notice">
                <p>MetaMask extension is not detected in your browser.</p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-metamask-install"
                >
                  Install MetaMask Extension ↗
                </a>
              </div>
            ) : !walletAddress ? (
              <div className="metamask-connect-prompt">
                <p>Connect your MetaMask wallet to access your Ethereum account session.</p>
                <button
                  type="button"
                  className="btn-metamask-connect"
                  onClick={connectMetaMask}
                  disabled={isConnectingWallet}
                >
                  {isConnectingWallet ? "Connecting to MetaMask..." : "Connect MetaMask Wallet"}
                </button>
              </div>
            ) : (
              <div className="metamask-dashboard-content">
                <div className="wallet-card">
                <div className="rosario-token-card">

  <div className="rosario-token-header">

    <div>
      <span className="field-label">
        Your Token
      </span>

      <h2>Rosario Token</h2>
    </div>

    <span className="ros-token-badge">
      ROS
    </span>

  </div>

  <div className="ros-balance">

    <span className="ros-balance-label">
      ROS Balance
    </span>

    <span className="ros-balance-amount">
      {rosBalance !== null
        ? Number(rosBalance).toLocaleString()
        : "0"}
    </span>

    <span className="ros-symbol">
      ROS
    </span>

  </div>

  <div className="ros-actions">

    <button
      type="button"
      className="btn-action"
      onClick={handleReceiveROS}
    >
      Receive ROS
    </button>

  </div>

  <div className="ros-send-section">

    <h3>Send ROS</h3>

    <label>
      Recipient Wallet Address
    </label>

    <input
      type="text"
      placeholder="0x..."
      value={recipientAddress}
      onChange={(e) =>
        setRecipientAddress(e.target.value)
      }
    />

    <label>
      Amount
    </label>

    <input
      type="number"
      min="0"
      step="any"
      placeholder="Enter ROS amount"
      value={rosAmount}
      onChange={(e) =>
        setRosAmount(e.target.value)
      }
    />

    <button
      type="button"
      className="btn-action btn-send-ros"
      onClick={handleSendROS}
      disabled={isSendingROS}
    >
      {isSendingROS
        ? "Sending ROS..."
        : "Send ROS"}
    </button>

  </div>

  {rosTransactionStatus && (
    <div className="ros-status">
      {rosTransactionStatus}
    </div>
  )}

</div>
                  <div className="wallet-field">
                    <span className="field-label">Connected Network</span>
                    <span className="network-tag">{networkName || "Detecting..."}</span>
                  </div>

                  <div className="wallet-field">
                    <span className="field-label">Account Balance</span>
                    <div className="balance-display">
                      <span className="balance-amount">
                        {walletBalance !== null ? walletBalance : "0.0000"}
                      </span>
                      <span className={`balance-unit token-${currencySymbol.toLowerCase()}`}>
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  <div className="wallet-field full-address-field">
                    <div className="field-header">
                      <span className="field-label">MetaMask User Address</span>
                      <button
                        type="button"
                        className="btn-copy-address"
                        onClick={handleCopyAddress}
                      >
                        {copiedAddress ? "Copied Address!" : "Copy Address"}
                      </button>
                    </div>
                    <div className="full-address-box">
                      <code className="full-address-code">{walletAddress}</code>
                    </div>
                  </div>
                </div>

                <div className="web3-actions">
                  <button
                    type="button"
                    className="btn-action btn-sign"
                    onClick={handleSignMessage}
                    disabled={isSigning}
                  >
                    {isSigning ? "Signing..." : "Sign Verification Message"}
                  </button>

                  <button
                    type="button"
                    className="btn-action btn-refresh"
                    onClick={() => fetchWalletDetails(walletAddress)}
                  >
                    Refresh Balance
                  </button>

                  <button
                    type="button"
                    className="btn-action btn-disconnect"
                    onClick={disconnectWallet}
                  >
                    Disconnect Wallet
                  </button>
                </div>

                {signature && (
                  <div className="signature-box">
                    <p className="signature-label">✓ Session Signed & Verified:</p>
                    <code className="signature-code">
                      {signature.slice(0, 18)}...{signature.slice(-14)}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="dashboard-footer">
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Logout Session
            </button>
          </div>
        </div>
      </div>
    );
  }
  

  // =========================
  // LOGIN / REGISTER PAGE
  // =========================

  return (
    <div className="login-container">

      <div className="login-box">

        {/* PAGE TITLE */}

        <h1>
          {showOtp
            ? "Verify OTP"
            : isRegistering
            ? "Create Account"
            : "Welcome Back"}
        </h1>

        {/* PAGE DESCRIPTION */}

        <p>
          {showOtp
            ? "Enter the OTP to complete registration"
            : isRegistering
            ? "Create your account"
            : "Login to your account"}
        </p>

        {/* =========================
            OTP SCREEN
        ========================= */}

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
                  e.target.value.replace(
                    /\D/g,
                    ""
                  );

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
                setIsRegistering(false);
                setName("");
                setEmail("");
                setPassword("");
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            {/* =========================
                NAME
            ========================= */}

            {isRegistering && (
              <>
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

                {name &&
                  !validateName(name) && (
                    <p className="validation-error">
                      Name should contain only
                      letters and spaces
                    </p>
                  )}

                {name &&
                  validateName(name) && (
                    <p className="validation-success">
                      Name is valid
                    </p>
                  )}
              </>
            )}

            {/* =========================
                EMAIL
            ========================= */}

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

            {email &&
              !validateEmail(email) && (
                <p className="validation-error">
                  Please enter a valid email address
                </p>
              )}

            {email &&
              validateEmail(email) && (
                <p className="validation-success">
                  Email is valid
                </p>
              )}

            {/* =========================
                PASSWORD
            ========================= */}

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
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

            {/* =========================
                PASSWORD REQUIREMENTS
            ========================= */}

            {password &&
              isRegistering && (
                <div className="password-requirements">

                  <p
                    className={
                      passwordChecks.length
                        ? "validation-success"
                        : "validation-error"
                    }
                  >
                    {passwordChecks.length
                      ? "Valid"
                      : "Invalid"}{" "}
                    At least 8 characters
                  </p>

                  <p
                    className={
                      passwordChecks.uppercase
                        ? "validation-success"
                        : "validation-error"
                    }
                  >
                    {passwordChecks.uppercase
                      ? "Valid"
                      : "Invalid"}{" "}
                    One uppercase letter
                  </p>

                  <p
                    className={
                      passwordChecks.lowercase
                        ? "validation-success"
                        : "validation-error"
                    }
                  >
                    {passwordChecks.lowercase
                      ? "Valid"
                      : "Invalid"}{" "}
                    One lowercase letter
                  </p>

                  <p
                    className={
                      passwordChecks.number
                        ? "validation-success"
                        : "validation-error"
                    }
                  >
                    {passwordChecks.number
                      ? "Valid"
                      : "Invalid"}{" "}
                    One number
                  </p>

                  <p
                    className={
                      passwordChecks.special
                        ? "validation-success"
                        : "validation-error"
                    }
                  >
                    {passwordChecks.special
                      ? "Valid"
                      : "Invalid"}{" "}
                    One special character
                  </p>

                </div>
              )}

            {/* =========================
                LOGIN ERROR
            ========================= */}

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            {/* =========================
                REGISTER / LOGIN BUTTON
            ========================= */}

            {isRegistering ? (
              <>
                <button onClick={handleRegister}>
                  Register
                </button>

                <p>
                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setRegisterMessage("");
                      setError("");
                      setName("");
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Login
                  </button>
                </p>
              </>
            ) : (
              <>
                <button onClick={handleLogin}>
                  Login
                </button>

                <p>
                  Don't have an account?{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setRegisterMessage("");
                      setError("");
                      setName("");
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Register
                  </button>
                </p>
              </>
            )}

            {/* =========================
                REGISTRATION MESSAGE
            ========================= */}

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