import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  UserRound,
  Building2,
  Receipt,
  CircleHelp,
} from "lucide-react";
import GetSupport from "./GetSupport";

const Navbar = () => {
  const navigate = useNavigate();
  const [showSupport, setShowSupport] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/signin");
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-black hover:bg-gray-100 hover:text-black"
    }`;

  return (
    <>
      <nav className="flex h-screen w-[280px] flex-col rounded-r-2xl border-r border-gray-200 bg-white px-4 py-6 shadow-sm">
        <div className="mb-8 px-3">
          <NavLink to="/dashboard" className="block">
            <img
              className="h-auto w-[200px] object-contain"
              src="/optiflow.png"
              alt="OptiFlow"
            />
          </NavLink>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/customers" className={navClass}>
            <Users size={19} />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/inventory" className={navClass}>
            <Package size={19} />
            <span>Inventory</span>
          </NavLink>

          <NavLink to="/sales" className={navClass}>
            <ShoppingCart size={19} />
            <span>Sales</span>
          </NavLink>

          <NavLink to="/staff" className={navClass}>
            <UserRound size={19} />
            <span>Staff</span>
          </NavLink>

          <NavLink to="/rent" className={navClass}>
            <Building2 size={19} />
            <span>Rent / Lease</span>
          </NavLink>

          <NavLink to="/expenses" className={navClass}>
            <Receipt size={19} />
            <span>Expenses</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setShowSupport(true)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-black transition hover:bg-gray-100 hover:text-black"
          >
            <CircleHelp size={19} />
            <span>Get Support</span>
          </button>
        </div>

        <div className="mt-auto border-t border-gray-200 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-green-500 px-3 py-3">
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=ffffff&color=16a34a&bold=true"
              alt="Admin"
              className="h-10 w-10 rounded-full border-2 border-white object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/80">Logged in as</p>

              <p className="truncate text-sm font-semibold text-white">Admin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {showSupport && <GetSupport onClose={() => setShowSupport(false)} />}
    </>
  );
};

export default Navbar;