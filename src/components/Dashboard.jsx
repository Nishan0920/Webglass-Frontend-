import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Receipt,
  PlusCircle,
  MinusCircle,
  UserPlus,
  PackagePlus,
  FileBarChart2,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://webglass-backhend.vercel.app/api";

const ROOT_BASE =
  import.meta.env.VITE_API_ROOT_URL || "https://webglass-backhend.vercel.app";

const LOW_STOCK_THRESHOLD = 10;

const currency = (n) =>
  "Rs. " +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

async function fetchJson(url) {
  const res = await fetch(url);

  const body = await res.json().catch(() => null);

  if (!res.ok || (body && body.success === false)) {
    throw new Error(
      body?.message || `Request to ${url} failed (${res.status})`,
    );
  }

  return body;
}

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rentPayments, setRentPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled([
        fetchJson(`${API_BASE}/salesalldata`),
        fetchJson(`${API_BASE}/inventoryalldata`),
        fetchJson(`${API_BASE}/staffalldata`),
        fetchJson(`${ROOT_BASE}/rentandlease/payment`),
        fetchJson(`${API_BASE}/expenses`),
      ]);

      if (cancelled) return;

      const [salesRes, inventoryRes, staffRes, rentRes, expensesRes] = results;

      setSales(
        salesRes.status === "fulfilled" ? salesRes.value.sales || [] : [],
      );

      setProducts(
        inventoryRes.status === "fulfilled"
          ? inventoryRes.value.data || []
          : [],
      );

      setStaff(
        staffRes.status === "fulfilled" ? staffRes.value.staff || [] : [],
      );

      setRentPayments(
        rentRes.status === "fulfilled" ? rentRes.value.data || [] : [],
      );

      setExpenses(
        expensesRes.status === "fulfilled" ? expensesRes.value.data || [] : [],
      );

      const allFailed = results.every((result) => result.status === "rejected");

      setError(
        allFailed
          ? results[0].reason?.message || "Could not reach the API"
          : null,
      );

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        Loading dashboard…
      </div>
    );
  }

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.Total || 0),
    0,
  );

  const totalPaid = sales.reduce(
    (sum, sale) => sum + Number(sale.AmountPaid || 0),
    0,
  );

  const totalDue = sales.reduce(
    (sum, sale) => sum + Number(sale.AmountDue || 0),
    0,
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  const lowStock = [...products]
    .filter((product) => Number(product.Stock) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => Number(a.Stock) - Number(b.Stock))
    .slice(0, 5);

  const soldTotals = new Map();

  for (const sale of sales) {
    for (const item of sale.Items || []) {
      const key = item.inventoryId || item.name;

      const previous = soldTotals.get(key) || {
        name: item.name,
        qty: 0,
        revenue: 0,
      };

      previous.qty += Number(item.qty || 0);
      previous.revenue += Number(item.amount || 0);

      soldTotals.set(key, previous);
    }
  }

  const topSelling = [...soldTotals.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const upcomingRent = [...rentPayments]
    .filter(
      (payment) => payment.status === "Due" || payment.status === "Overdue",
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const statCards = [
    {
      icon: ArrowDownToLine,
      label: "Total Revenue",
      value: currency(totalRevenue),
      tone: "green",
    },
    {
      icon: ArrowUpFromLine,
      label: "Amount Due",
      value: currency(totalDue),
      tone: "red",
    },
    {
      icon: Wallet,
      label: "Amount Collected",
      value: currency(totalPaid),
      tone: "blue",
    },
    {
      icon: Receipt,
      label: "Total Expenses",
      value: currency(totalExpenses),
      tone: "purple",
    },
  ];

  const toneClasses = {
    green: "bg-emerald-50 text-emerald-500",
    red: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-violet-50 text-violet-500",
  };

  return (
    <div className="flex min-h-screen flex-col gap-5 bg-slate-50 p-7">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

        <p className="mt-0.5 text-sm text-slate-400">Welcome back, Admin!</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-500">
          Couldn't reach the server: {error}. Make sure your Express app is
          running and VITE_API_BASE_URL / VITE_API_ROOT_URL point to it.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3.5 rounded-2xl bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
            >
              <Icon size={20} />
            </div>

            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs text-slate-400">{label}</span>

              <span className="text-lg font-bold tracking-tight text-slate-900">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3.5 text-sm font-bold text-slate-900">
            Top Selling Products
          </h2>

          {topSelling.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">
              No sales recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topSelling.map((product, index) => (
                <li
                  key={product.name + index}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-slate-50 text-xs font-bold text-slate-400">
                    {index + 1}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {product.name}
                    </span>

                    <span className="text-xs text-slate-400">
                      {product.qty} sold
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-slate-900">
                    {currency(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3.5 text-sm font-bold text-slate-900">
            Low Stock Alert
          </h2>

          {lowStock.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">
              All products are well stocked.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lowStock.map((product) => (
                <li
                  key={product._id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate text-sm font-medium text-slate-900">
                    {product.ProductName}
                  </span>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      Number(product.Stock) === 0
                        ? "bg-rose-50 text-rose-500"
                        : "bg-blue-50 text-blue-500"
                    }`}
                  >
                    Stock: {product.Stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3.5 text-sm font-bold text-slate-900">
            Quick Actions
          </h2>

          <ul className="flex flex-col gap-1">
            <li>
              <Link
                to="/sales"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <PlusCircle size={18} className="shrink-0 text-blue-500" />

                <span>Record a Sale or view SaleDetails</span>
              </Link>
            </li>

            <li>
              <Link
                to="/inventory"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <MinusCircle size={18} className="shrink-0 text-blue-500" />

                <span>Adjust Stock in Inventory</span>
              </Link>
            </li>

            <li>
              <Link
                to="/staff"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserPlus size={18} className="shrink-0 text-blue-500" />

                <span>Add Staff and SalaryManagement</span>
              </Link>
            </li>

            <li>
              <Link
                to="/inventory"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <PackagePlus size={18} className="shrink-0 text-blue-500" />

                <span>Add Product On Inventory</span>
              </Link>
            </li>

            <li>
              <Link
                to="/sales"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FileBarChart2 size={18} className="shrink-0 text-blue-500" />

                <span>View SalesDetails or add Sales</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {}
      {}
      {}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        {}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3.5 text-sm font-bold text-slate-900">
            Upcoming Rent Payments
          </h2>

          {upcomingRent.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">
              Nothing due right now.
            </p>
          ) : (
            <ul className="flex flex-col">
              {upcomingRent.map((payment, index) => (
                <li
                  key={payment._id}
                  className={`flex items-center justify-between py-2.5 ${
                    index !== upcomingRent.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">
                      {payment.leaseId?.property || "Lease"}
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-400">
                      Due{" "}
                      {new Date(payment.dueDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      payment.status === "Overdue"
                        ? "bg-rose-50 text-rose-500"
                        : "bg-emerald-50 text-emerald-500"
                    }`}
                  >
                    {payment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3.5 text-sm font-bold text-slate-900">Overview</h2>

          <div className="grid grid-cols-3 gap-4">
            {}
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-slate-900">
                {staff.length}
              </span>

              <small className="text-xs text-slate-400">Total Staff</small>
            </div>

            {}
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-slate-900">
                {products.length}
              </span>

              <small className="text-xs text-slate-400">Total Products</small>
            </div>

            {}
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-slate-900">
                {currency(totalDue)}
              </span>

              <small className="text-xs text-slate-400">
                Pending Receivables
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
