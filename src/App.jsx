import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Signin from "./components/Signin";
import Customers from "./components/Customers";
import Inventory from "./components/Inventory";
import SalesPOS from "./components/SalesPOS";
import Staff from "./components/Staff";

import RentLease from "./components/Rentrelease";
import Expenses from "./components/Expenses";
import Navbar from "./components/Navbar";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn !== "true") {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

const AppLayout = () => {
  const location = useLocation();

  const isSigninPage = location.pathname === "/signin";

  // Signin page does not have Navbar
  if (isSigninPage) {
    return (
      <Routes>
        <Route path="/signin" element={<Signin />} />
      </Routes>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Left Sidebar */}
      <aside style={styles.sidebar}>
        <Navbar />
      </aside>

      {/* Right Content */}
      <main style={styles.content}>
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Customers */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />

          {/* Inventory */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* Sales */}
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <SalesPOS />
              </ProtectedRoute>
            }
          />

          {/* Staff */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <Staff />
              </ProtectedRoute>
            }
          />

          {/* Rent */}
          <Route
            path="/rent"
            element={
              <ProtectedRoute>
                <RentLease />
              </ProtectedRoute>
            }
          />

          {/* Expenses */}
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />

          {/* Unknown route */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return <AppLayout />;
};

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
  },

  sidebar: {
    width: "280px",
    minWidth: "280px",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },

  content: {
    marginLeft: "280px",
    flex: 1,
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
    overflowX: "hidden",
  },
};

export default App;
