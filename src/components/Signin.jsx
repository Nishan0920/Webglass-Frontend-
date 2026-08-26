import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Signin = () => {
  const navigate = useNavigate();

  const [existing, setExisting] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

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

        alert("Welcome!");

        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      console.log(error);

      if (error.response?.status === 409) {
        alert("User doesn't exist");
      } else if (error.response?.status === 401) {
        alert("Invalid email or password");
      } else {
        alert(error.response?.data?.message || "Something went wrong");
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
