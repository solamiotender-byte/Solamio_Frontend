// components/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Fade,
  Zoom,
  InputLabel,
  FormHelperText,
  useMediaQuery,
  useTheme,
  Backdrop,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Smartphone,
  ArrowBack,
  ErrorOutline,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/sunergy-tech-logo.svg";

const COLOR = "#4569ea";
const COLOR_LIGHT = "#5c7cec";
const COLOR_DARK = "#3a5ac8";
const COLOR_VERY_LIGHT = "#e8edff";
const COLOR_VERY_DARK = "#2d47a6";

// Validation error types
const ERROR_TYPES = {
  REQUIRED: "REQUIRED",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  RATE_LIMIT: "RATE_LIMIT",
  MAINTENANCE: "MAINTENANCE",
  PERMISSION_DENIED: "PERMISSION_DENIED",
};

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const { login, error: authError, setError, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [validation, setValidation] = useState({
    emailValid: false,
    passwordValid: false,
    formValid: false,
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "default",
  });

  // Clear errors on component mount
  useEffect(() => {
    setLocalError(null);
    setSuccessMessage("");

    // Check if account is locked
    const lockTime = localStorage.getItem("loginLockUntil");
    if (lockTime && new Date(lockTime) > new Date()) {
      setLockUntil(new Date(lockTime));
      handleError({
        type: ERROR_TYPES.RATE_LIMIT,
        message: `Too many failed attempts. Try again after ${formatLockTime(lockTime)}`,
      });
    }

    // Restore remember me email
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail && formData.rememberMe) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
      }));
      validateField("email", rememberedEmail);
    }
  }, []);

  // Check form validity
  useEffect(() => {
    const isFormValid = validation.emailValid && validation.passwordValid;
    setValidation((prev) => ({
      ...prev,
      formValid: isFormValid,
    }));
  }, [validation.emailValid, validation.passwordValid]);

  // Handle rate limiting
  useEffect(() => {
    if (attemptCount >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      setLockUntil(lockTime);
      localStorage.setItem("loginLockUntil", lockTime.toISOString());
      localStorage.setItem("failedAttempts", "0");

      handleError({
        type: ERROR_TYPES.RATE_LIMIT,
        message: "Too many failed attempts. Account locked for 15 minutes.",
      });
    }
  }, [attemptCount]);

  // Check if still locked
  useEffect(() => {
    if (lockUntil && new Date() > lockUntil) {
      setLockUntil(null);
      localStorage.removeItem("loginLockUntil");
      setAttemptCount(0);
      setLocalError(null);
    }
  }, [lockUntil]);

  // Email validation
  const validateEmail = (email) => {
    if (!email) {
      return {
        valid: false,
        message: "Email is required",
        type: ERROR_TYPES.REQUIRED,
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: "Please enter a valid email address",
        type: ERROR_TYPES.INVALID_EMAIL,
      };
    }

    if (email.length > 100) {
      return {
        valid: false,
        message: "Email must be less than 100 characters",
        type: ERROR_TYPES.INVALID_EMAIL,
      };
    }

    return {
      valid: true,
      message: "",
      type: null,
    };
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return {
        valid: false,
        message: "Password is required",
        type: ERROR_TYPES.REQUIRED,
      };
    }

    if (password.length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters",
        type: ERROR_TYPES.INVALID_PASSWORD,
      };
    }

    if (password.length > 50) {
      return {
        valid: false,
        message: "Password must be less than 50 characters",
        type: ERROR_TYPES.INVALID_PASSWORD,
      };
    }

    // Calculate password strength
    let score = 0;
    let message = "";
    let color = "";

    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score >= 5) {
      message = "Strong password";
      color = "success";
    } else if (score >= 3) {
      message = "Moderate password";
      color = "warning";
    } else {
      message = "Weak password";
      color = "error";
    }

    setPasswordStrength({
      score,
      message,
      color,
    });

    return {
      valid: true,
      message: "",
      type: null,
      strength: { score, message, color },
    };
  };

  // Validate individual field
  const validateField = (fieldName, value) => {
    let validationResult;

    if (fieldName === "email") {
      validationResult = validateEmail(value);
      setValidation((prev) => ({
        ...prev,
        emailValid: validationResult.valid,
      }));
    } else if (fieldName === "password") {
      validationResult = validatePassword(value);
      setValidation((prev) => ({
        ...prev,
        passwordValid: validationResult.valid,
      }));
    }

    return validationResult;
  };

  // Validate entire form
  const validateForm = () => {
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);

    const newErrors = {
      email: emailValidation.message,
      password: passwordValidation.message,
    };

    setErrors(newErrors);
    setValidation({
      emailValid: emailValidation.valid,
      passwordValid: passwordValidation.valid,
      formValid: emailValidation.valid && passwordValidation.valid,
    });

    return emailValidation.valid && passwordValidation.valid;
  };

  // Handle error with type
  const handleError = (error) => {
    console.error("Login error:", error);

    let errorMessage = "An unexpected error occurred. Please try again.";
    let errorType = ERROR_TYPES.SERVER_ERROR;

    if (error.type) {
      errorType = error.type;
      switch (error.type) {
        case ERROR_TYPES.REQUIRED:
          errorMessage = "Please fill in all required fields";
          break;
        case ERROR_TYPES.INVALID_EMAIL:
          errorMessage = "Please enter a valid email address";
          break;
        case ERROR_TYPES.INVALID_PASSWORD:
          errorMessage = "Please enter a valid password (min 6 characters)";
          break;
        case ERROR_TYPES.NETWORK_ERROR:
          errorMessage =
            "Network error. Please check your internet connection.";
          break;
        case ERROR_TYPES.UNAUTHORIZED:
          errorMessage = "Invalid email or password. Please try again.";
          setAttemptCount((prev) => prev + 1);
          break;
        case ERROR_TYPES.ACCOUNT_LOCKED:
          errorMessage =
            "Your account has been locked. Please contact support.";
          break;
        case ERROR_TYPES.SESSION_EXPIRED:
          errorMessage = "Your session has expired. Please login again.";
          break;
        case ERROR_TYPES.INVALID_CREDENTIALS:
          errorMessage =
            "Invalid credentials. Please check your email and password.";
          setAttemptCount((prev) => prev + 1);
          break;
        case ERROR_TYPES.RATE_LIMIT:
          errorMessage =
            error.message ||
            "Too many failed attempts. Please try again later.";
          break;
        case ERROR_TYPES.MAINTENANCE:
          errorMessage = "System is under maintenance. Please try again later.";
          break;
        case ERROR_TYPES.PERMISSION_DENIED:
          errorMessage =
            "You do not have permission to access the system. Please contact your administrator.";
          break;
        default:
          errorMessage =
            error.message || "An error occurred. Please try again.";
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    setLocalError({
      message: errorMessage,
      type: errorType,
      timestamp: new Date().toISOString(),
    });
    setError(errorMessage);

    sessionStorage.setItem(
      "lastLoginError",
      JSON.stringify({
        message: errorMessage,
        type: errorType,
        timestamp: new Date().toISOString(),
        attempt: attemptCount + 1,
      }),
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (authError || localError) {
      setError("");
      setLocalError(null);
    }

    if (successMessage) {
      setSuccessMessage("");
    }

    if (touched[name]) {
      validateField(name, newValue);
    }

    if (name === "email" && formData.rememberMe) {
      localStorage.setItem("rememberedEmail", newValue);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const validationResult = validateField(name, value);
    if (!validationResult.valid) {
      setErrors((prev) => ({
        ...prev,
        [name]: validationResult.message,
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // In Login.jsx - Replace the handleSubmit function

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (lockUntil && new Date(lockUntil) > new Date()) {
      handleError({
        type: ERROR_TYPES.RATE_LIMIT,
        message: `Too many failed attempts. Try again after ${formatLockTime(lockUntil)}`,
      });
      return;
    }

    setTouched({
      email: true,
      password: true,
    });

    if (!validateForm()) {
      if (errors.email) {
        document.getElementById("email").focus();
      } else if (errors.password) {
        document.getElementById("password").focus();
      }

      handleError({
        type: ERROR_TYPES.REQUIRED,
        message: "Please fix the errors in the form",
      });
      return;
    }

    setLoading(true);
    setShowBackdrop(true);
    setLocalError(null);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      //console.log("Calling login with:", formData.email);

      const result = await login(formData.email, formData.password);
      //console.log("Login result:", result);

      if (result?.success) {
        setAttemptCount(0);
        localStorage.removeItem("loginLockUntil");
        localStorage.removeItem("failedAttempts");

        // CORRECTED: Get user data from result.user (not from a separate user variable)
        const userData = result.user;
        const userRole = userData?.role;

        //console.log("User role after login:", userRole);

        if (!userRole) {
          throw new Error("User role not found in login response");
        }

        if (!["Head_office", "ZSM", "ASM", "TEAM"].includes(userRole)) {
          throw new Error("You do not have permission to access this system");
        }

        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedEmail");
        }

        localStorage.setItem("lastLogin", new Date().toISOString());

        setSuccessMessage("Login successful! Redirecting to dashboard...");

        setTimeout(() => {
          if (userRole === "TEAM") {
            navigate("/attendance", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 1500);
      } else {
        handleError({
          type: ERROR_TYPES.UNAUTHORIZED,
          message: result?.error || "Invalid email or password. Please try again.",
        });
      }
    } catch (err) {
      handleError({
        type: ERROR_TYPES.SERVER_ERROR,
        message: err.message || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
      setShowBackdrop(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const formatLockTime = (lockTime) => {
    if (!lockTime) return "";
    const now = new Date();
    const lockDate = new Date(lockTime);
    const diffMinutes = Math.ceil((lockDate - now) / (1000 * 60));

    if (diffMinutes <= 0) return "now";
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : ""}`;
  };

  const handleKeyDown = (e) => {
    if (isMobile && e.key === "Enter") {
      e.preventDefault();
      if (validation.formValid && !loading) {
        handleSubmit(e);
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Display error message with icon
  const renderErrorMessage = () => {
    if (!localError && !authError) return null;

    const error = localError || {
      message: authError,
      type: ERROR_TYPES.SERVER_ERROR,
    };
    const isRateLimit = error.type === ERROR_TYPES.RATE_LIMIT;
    const isNetworkError = error.type === ERROR_TYPES.NETWORK_ERROR;
    const isPermissionError = error.type === ERROR_TYPES.PERMISSION_DENIED;

    return (
      <Fade in={true}>
        <Alert
          severity={
            isRateLimit ? "warning" : isPermissionError ? "warning" : "error"
          }
          icon={
            isRateLimit || isPermissionError ? (
              <ErrorOutline />
            ) : (
              <ErrorOutline />
            )
          }
          sx={{
            width: "100%",
            mb: 2,
            borderRadius: 2,
            fontSize: { xs: "0.875rem", sm: "1rem" },
            py: { xs: 0.5, sm: 1 },
            backgroundColor: "rgba(69, 105, 234, 0.1)",
            border: "1px solid",
            borderColor: "rgba(69, 105, 234, 0.2)",
            "& .MuiAlert-icon": {
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              color: COLOR,
            },
          }}
          onClose={() => {
            setError("");
            setLocalError(null);
          }}
        >
          <Box>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{ color: COLOR_DARK }}
            >
              {error.message}
            </Typography>
            {isRateLimit && lockUntil && (
              <Typography
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: COLOR }}
              >
                Lock expires: {new Date(lockUntil).toLocaleTimeString()}
              </Typography>
            )}
            {isNetworkError && (
              <Typography
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: COLOR }}
              >
                Please check your internet connection and try again.
              </Typography>
            )}
            {isPermissionError && (
              <Typography
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: COLOR }}
              >
                Contact your administrator for system access
              </Typography>
            )}
            {attemptCount > 0 && attemptCount < 5 && !isPermissionError && (
              <Typography
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: COLOR }}
              >
                Failed attempts: {attemptCount}/5
              </Typography>
            )}
          </Box>
        </Alert>
      </Fade>
    );
  };

  // Display success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;

    return (
      <Fade in={true}>
        <Alert
          severity="success"
          icon={<CheckCircleOutline />}
          sx={{
            width: "100%",
            mb: 2,
            borderRadius: 2,
            fontSize: { xs: "0.875rem", sm: "1rem" },
            py: { xs: 0.5, sm: 1 },
            backgroundColor: "rgba(69, 105, 234, 0.1)",
            border: "1px solid",
            borderColor: "rgba(69, 105, 234, 0.3)",
            "& .MuiAlert-icon": {
              color: COLOR,
            },
          }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      </Fade>
    );
  };

  // Display password strength indicator
  const renderPasswordStrength = () => {
    if (!formData.password || !touched.password || errors.password) return null;

    return (
      <Box sx={{ mt: 0.5, mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: COLOR,
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        >
          {passwordStrength.message}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 0.25,
          }}
        >
          {[1, 2, 3, 4, 5].map((index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 3,
                borderRadius: 1,
                backgroundColor:
                  index <= passwordStrength.score ? COLOR : COLOR_VERY_LIGHT,
              }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  // Calculate paper padding
  const getPaperPadding = () => {
    if (isMobile) return { xs: 2, sm: 3 };
    if (isTablet) return { xs: 3, sm: 4 };
    return { xs: 4, sm: 5 };
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLOR} 0%, ${COLOR_DARK} 50%, ${COLOR_LIGHT} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 2, sm: 3, md: 4 },
        position: "relative",
        overflow: "hidden",
        width: "100%",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
        },
      }}
    >
      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        }}
        open={showBackdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Centered Container with responsive width */}
      <Box
        sx={{
          width: "100%",
          maxWidth: {
            xs: "100%",
            sm: "500px",
            md: "500px",
            lg: "500px",
          },
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Back Button for Mobile */}
        {isMobile && (
          <Box
            sx={{
              mb: 2,
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              alignItems: "center",
              paddingLeft: 1,
            }}
          >
            <IconButton
              onClick={handleBack}
              sx={{
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.2)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
                mr: 1,
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="caption"
              sx={{ color: "#fff", fontWeight: 500 }}
            >
              Back to Application
            </Typography>
          </Box>
        )}

        <Zoom in={true} timeout={isMobile ? 500 : 800}>
          <Paper
            elevation={isMobile ? 6 : 24}
            sx={{
              width: "100%",
              maxWidth: "500px",
              padding: getPaperPadding(),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: { xs: 2, sm: 3, md: 3 },
              backgroundColor: "#ffffff",
              boxShadow: `0 8px 32px rgba(69, 105, 234, 0.2)`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: COLOR,
              },
            }}
          >
            {/* Mobile Header Bar */}
            {isMobile && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  mb: 2,
                  pb: 1,
                  borderBottom: "1px solid",
                  borderColor: COLOR_VERY_LIGHT,
                }}
              >
                <Smartphone sx={{ fontSize: 20, color: COLOR }} />
                <Typography
                  variant="caption"
                  sx={{ color: COLOR, fontWeight: 500 }}
                >
                   Sunergy Tech Mobile
                </Typography>
              </Box>
            )}

            {/* Logo Section */}
            <Fade in={true} timeout={1000}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: { xs: 2, sm: 3, md: 3 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 80, sm: 100, md: 120 },
                    height: { xs: 80, sm: 100, md: 120 },
                    borderRadius: "50%",
                    background: COLOR_VERY_LIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: { xs: 1.5, sm: 2, md: 2 },
                    boxShadow: `0 8px 24px rgba(69, 105, 234, 0.2)`,
                    border: `3px solid ${COLOR}`,
                    overflow: "hidden",
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { boxShadow: `0 0 0 0 rgba(69, 105, 234, 0.4)` },
                      "70%": { boxShadow: `0 0 0 10px rgba(69, 105, 234, 0)` },
                      "100%": { boxShadow: `0 0 0 0 rgba(69, 105, 234, 0)` },
                    },
                  }}
                >
                  {/* Logo Image */}
                  <img
                    src={logo}
                    alt="Sunergy Tech logo"
                    style={{
                      width: "120%",
                      height: "120%",
                      objectFit: "contain",
                      padding: "12px",
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.5rem" },
                    color: COLOR,
                    letterSpacing: "0.5px",
                  }}
                >
                  Welcome Back to Sunergy Tech
                </Typography>
              </Box>
            </Fade>

            {/* Success Message */}
            {renderSuccessMessage()}

            {/* Error Message */}
            {renderErrorMessage()}

            {/* Warning for remaining attempts */}
            {attemptCount >= 3 && attemptCount < 5 && !lockUntil && (
              <Alert
                severity="warning"
                sx={{
                  width: "100%",
                  mb: 2,
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  py: 0.5,
                  backgroundColor: "rgba(69, 105, 234, 0.1)",
                  border: `1px solid ${COLOR}`,
                  "& .MuiAlert-icon": {
                    color: COLOR,
                  },
                }}
              >
                <Typography variant="caption" sx={{ color: COLOR_DARK }}>
                  <strong>Warning:</strong> {5 - attemptCount} attempt
                  {5 - attemptCount > 1 ? "s" : ""} remaining before account
                  lock.
                </Typography>
              </Alert>
            )}

            <Box
              component="form"
              id="login-form"
              onSubmit={handleSubmit}
              sx={{
                width: "100%",
                "& input": {
                  fontSize: { xs: "16px", sm: "inherit" },
                },
              }}
            >
              {/* Email Field */}
              <Box sx={{ mb: { xs: 1.5, sm: 2, md: 2 } }}>
                <InputLabel
                  htmlFor="email"
                  sx={{
                    mb: 0.5,
                    color: COLOR_DARK,
                    fontWeight: 500,
                    fontSize: { xs: "0.875rem", sm: "0.9rem", md: "1rem" },
                  }}
                >
                  Email Address *
                </InputLabel>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  error={touched.email && Boolean(errors.email)}
                  placeholder="Enter your email"
                  disabled={lockUntil && new Date(lockUntil) > new Date()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email
                          sx={{
                            fontSize: { xs: "1rem", sm: "1.25rem" },
                            color: errors.email
                              ? "error.main"
                              : validation.emailValid
                                ? COLOR
                                : COLOR,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: { xs: 1, sm: 2, md: 2 },
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      height: { xs: "48px", sm: "56px", md: "56px" },
                      backgroundColor: COLOR_VERY_LIGHT,
                      "&.Mui-focused fieldset": {
                        borderColor: COLOR,
                        borderWidth: 2,
                      },
                    },
                  }}
                />
                {touched.email && errors.email && (
                  <FormHelperText
                    error
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: COLOR,
                    }}
                  >
                    <ErrorOutline sx={{ fontSize: "0.875rem", color: COLOR }} />
                    {errors.email}
                  </FormHelperText>
                )}
                {touched.email && !errors.email && formData.email && (
                  <FormHelperText
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      color: COLOR,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <CheckCircleOutline
                      sx={{ fontSize: "0.875rem", color: COLOR }}
                    />
                    Valid email address
                  </FormHelperText>
                )}
              </Box>

              {/* Password Field */}
              <Box sx={{ mb: { xs: 1, sm: 1.5, md: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <InputLabel
                    htmlFor="password"
                    sx={{
                      color: COLOR_DARK,
                      fontWeight: 500,
                      fontSize: { xs: "0.875rem", sm: "0.9rem", md: "1rem" },
                    }}
                  >
                    Password *
                  </InputLabel>
                </Box>
                <TextField
                  fullWidth
                  name="password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  error={touched.password && Boolean(errors.password)}
                  placeholder="Enter your password"
                  disabled={lockUntil && new Date(lockUntil) > new Date()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock
                          sx={{
                            fontSize: { xs: "1rem", sm: "1.25rem" },
                            color: errors.password
                              ? "error.main"
                              : validation.passwordValid
                                ? COLOR
                                : COLOR,
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                          disabled={
                            lockUntil && new Date(lockUntil) > new Date()
                          }
                          sx={{
                            color: errors.password
                              ? "error.main"
                              : validation.passwordValid
                                ? COLOR
                                : COLOR,
                            "&:hover": { backgroundColor: COLOR_VERY_LIGHT },
                            padding: { xs: "8px", sm: "12px" },
                          }}
                        >
                          {showPassword ? (
                            <VisibilityOff
                              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                            />
                          ) : (
                            <Visibility
                              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                            />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: { xs: 1, sm: 2, md: 2 },
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      height: { xs: "48px", sm: "56px", md: "56px" },
                      backgroundColor: COLOR_VERY_LIGHT,
                      "&.Mui-focused fieldset": {
                        borderColor: COLOR,
                        borderWidth: 2,
                      },
                    },
                  }}
                />
                {/* Password strength indicator */}
                {renderPasswordStrength()}

                {touched.password && errors.password && (
                  <FormHelperText
                    error
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: COLOR,
                    }}
                  >
                    <ErrorOutline sx={{ fontSize: "0.875rem", color: COLOR }} />
                    {errors.password}
                  </FormHelperText>
                )}
                {touched.password && !errors.password && formData.password && (
                  <FormHelperText
                    sx={{
                      mt: 0.25,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      color: COLOR,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <CheckCircleOutline
                      sx={{ fontSize: "0.875rem", color: COLOR }}
                    />
                    Password meets requirements
                  </FormHelperText>
                )}
              </Box>

              {/* Remember Me Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    sx={{
                      color: COLOR,
                      "&.Mui-checked": {
                        color: COLOR,
                      },
                    }}
                    disabled={lockUntil && new Date(lockUntil) > new Date()}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontSize: { xs: "0.875rem", sm: "0.9rem", md: "1rem" },
                      color: COLOR_DARK,
                    }}
                  >
                    Remember me
                  </Typography>
                }
                sx={{ mb: 1 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || (lockUntil && new Date(lockUntil) > new Date())}
                sx={{
                  mt: { xs: 0.5, sm: 1, md: 1.5 },
                  mb: { xs: 1.5, sm: 2, md: 2.5 },
                  py: { xs: 1.25, sm: 1.5, md: 1.5 },
                  background: COLOR,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.125rem" },
                  borderRadius: { xs: 1, sm: 2, md: 2 },
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  minHeight: { xs: "44px", sm: "48px", md: "52px" },
                  transition: "all 0.2s ease",
                  "&.Mui-disabled": {
                    background: COLOR_LIGHT,
                    color: "#fff",
                  },
                }}
              >
                Login
              </Button>
            </Box>

            {/* Footer Copyright */}
            <Fade in={true}>
              <Typography
                variant="caption"
                sx={{
                  mt: { xs: 2, sm: 3, md: 3 },
                  color: COLOR,
                  textAlign: "center",
                  fontSize: { xs: "0.75rem", sm: "0.875rem", md: "0.875rem" },
                  display: "block",
                  lineHeight: 1.4,
                }}
              >
                {"\u00A9"} {new Date().getFullYear()} Sunergy Tech.
                All rights reserved.
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.75rem" },
                    color: COLOR_LIGHT,
                  }}
                >
                  Version 2.1.0 {"\u2022"} Last updated:{" "}
                  {new Date().toLocaleDateString()}
                </Typography>
              </Typography>
            </Fade>

            {/* Mobile Version Info */}
            {isMobile && (
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  color: COLOR_LIGHT,
                  textAlign: "center",
                  fontSize: "0.7rem",
                  display: "block",
                }}
              >
                Mobile v2.1.0 {"\u2022"} {new Date().toLocaleDateString()}
              </Typography>
            )}
          </Paper>
        </Zoom>
      </Box>
    </Box>
  );
};

export default Login;


