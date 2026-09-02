import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const MODAL_STYLES = {
  danger: {
    icon: "🗑",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    confirmBtn: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: "!",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmBtn: "bg-amber-500 hover:bg-amber-600",
  },
  info: {
    icon: "i",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    confirmBtn: "bg-indigo-600 hover:bg-indigo-700",
  },
};

function AppModal({ modalState, onClose }) {
  if (!modalState.open) return null;

  const style = MODAL_STYLES[modalState.variant] || MODAL_STYLES.info;

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-lg font-bold ${style.iconBg} ${style.iconColor}`}
          >
            {style.icon}
          </div>

          <div className="flex-1 pt-1">
            <h3 className="text-base font-semibold text-gray-900 m-0">
              {modalState.title}
            </h3>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
              {modalState.message}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-5 pt-4 flex justify-end gap-3">
          {modalState.showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              {modalState.cancelText || "Cancel"}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${style.confirmBtn}`}
          >
            {modalState.confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_MODAL_STATE = {
  open: false,
  title: "",
  message: "",
  variant: "info",
  confirmText: "OK",
  cancelText: "Cancel",
  showCancel: false,
  onConfirm: null,
};

const Signin = () => {
  const navigate = useNavigate();

  const [existing, setExisting] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [modal, setModal] = useState(DEFAULT_MODAL_STATE);

  const closeModal = () => {
    setModal(DEFAULT_MODAL_STATE);
  };

  const showAlert = (message, opts = {}) => {
    const text = String(message || "");

    let variant = opts.variant;

    if (!variant) {
      if (/could not connect|server error|something went wrong/i.test(text)) {
        variant = "info";
      } else if (/invalid email or password|user doesn't exist/i.test(text)) {
        variant = "warning";
      } else {
        variant = "info";
      }
    }

    setModal({
      ...DEFAULT_MODAL_STATE,
      open: true,
      title: opts.title || "Heads up",
      message: text,
      variant,
      confirmText: opts.confirmText || "OK",
      showCancel: false,
      onConfirm: opts.onConfirm || null,
    });
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://webglass-backhend.vercel.app/api/signin",
        {
          email: existing.email,
          password: existing.password,
        },
      );

      console.log(response.data);

      if (response.data.success) {
        localStorage.setItem("isLoggedIn", "true");

        showAlert("Welcome!", {
          title: "Signed in",
          variant: "info",
          confirmText: "Continue",
          onConfirm: () => {
            navigate("/dashboard", {
              replace: true,
            });
          },
        });
      }
    } catch (error) {
      console.log(error);

      if (error.response?.status === 409) {
        showAlert("User doesn't exist", {
          title: "Account not found",
          variant: "warning",
        });
      } else if (error.response?.status === 401) {
        showAlert("Invalid email or password", {
          title: "Sign in failed",
          variant: "warning",
        });
      } else {
        showAlert(error.response?.data?.message || "Something went wrong", {
          title: "Sign in failed",
          variant: "danger",
        });
      }
    }
  };

  const handleChange = (e) => {
    setExisting({
      ...existing,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppModal modalState={modal} onClose={closeModal} />

      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="hidden h-[500px] w-[500px] shrink-0 items-center justify-center rounded-l-2xl bg-blue-600 shadow-xl lg:flex">
          <div className="px-10 text-center">
            <h1 className="text-6xl font-bold tracking-tight text-white">
              OptiFlow
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-blue-100">
              Manage your business smarter, faster and more efficiently with
              OptiFlow.
            </p>
          </div>
        </div>

        <div className="flex h-[500px] w-[500px] max-w-full shrink-0 items-center justify-center rounded-r-2xl bg-white p-10 shadow-xl">
          <div className="w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>

              <p className="mt-2 text-sm text-gray-500">
                Sign in to your OptiFlow admin account
              </p>
            </div>

            <form onSubmit={handleOnSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={existing.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={existing.password}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Sign In
              </button>
            </form>

            <p className="mt-10 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} OptiFlow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;