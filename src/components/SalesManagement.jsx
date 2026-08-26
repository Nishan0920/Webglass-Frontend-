import axios from "axios";
import { useEffect, useMemo, useState } from "react";

const PAYMENT_METHODS = ["Bank Transfer", "Cash", "eSewa", "QR Code"];

function AlertModal({ alertState, onClose, onConfirm }) {
  if (!alertState) {
    return null;
  }

  const { type = "success", title, message } = alertState;

  const iconStyles = {
    success: { bg: "bg-green-100", text: "text-green-600", icon: "✓" },
    error: { bg: "bg-red-100", text: "text-red-600", icon: "!" },
    confirm: { bg: "bg-red-100", text: "text-red-600", icon: "?" },
  };
  const icon = iconStyles[type] || iconStyles.success;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {}
        <div className="mb-4 flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${icon.bg} ${icon.text} text-xl font-semibold`}
          >
            {icon.icon}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {}
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500">{message}</p>

        {}
        <div className="mt-5 mb-4 border-t border-gray-100" />

        {}
        <div className="flex justify-end gap-2.5">
          {type === "confirm" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (type === "confirm" && onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            className={`rounded-lg px-5 py-2 text-sm font-medium text-white ${
              type === "confirm" || type === "error"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {type === "confirm" ? "Delete" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SalaryManagement() {
  const [activeTab, setActiveTab] = useState("Salary List");
  const [salaries, setSalaries] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);

  const [selectedSalary, setSelectedSalary] = useState(null);
  const [processMethod, setProcessMethod] = useState("Bank Transfer");
  const [processPayDate, setProcessPayDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [processing, setProcessing] = useState(false);

  const [alertState, setAlertState] = useState(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState(null);

  const showAlert = (title, message, type = "success") => {
    setAlertState({ type, title, message });
  };

  const showConfirm = (title, message, onConfirmAction) => {
    setAlertState({ type: "confirm", title, message });
    setPendingConfirmAction(() => onConfirmAction);
  };

  const closeAlert = () => {
    setAlertState(null);
    setPendingConfirmAction(null);
  };

  const handleConfirmAction = () => {
    const action = pendingConfirmAction;
    setAlertState(null);
    setPendingConfirmAction(null);
    if (action) {
      action();
    }
  };

  const [data, setData] = useState({
    staffId: "",
    month: "May 2025",
    basic: "",
    allowances: "",
    deductions: "",
    status: "Pending",
    paymentMethod: "Bank Transfer",
    payDate: "",
  });

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const netPreview =
    (Number(data.basic) || 0) +
    (Number(data.allowances) || 0) -
    (Number(data.deductions) || 0);

  const getSalaries = async () => {
    setLoading(true);

    try {
      const result = await axios.get(
        "https://webglass-backhend.vercel.app/api/salaryalldata",
      );

      if (result.data.success) {
        setSalaries(result.data.salaries);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffOptions = async () => {
    try {
      const result = await axios.get(
        "https://webglass-backhend.vercel.app/api/staffalldata",
      );

      if (result.data.success) {
        setStaffOptions(result.data.staff);
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  };

  useEffect(() => {
    getSalaries();
    getStaffOptions();
  }, []);

  const pendingSalaries = useMemo(
    () => salaries.filter((s) => s.Status === "Pending"),
    [salaries],
  );

  const paidSalaries = useMemo(
    () => salaries.filter((s) => s.Status === "Paid"),
    [salaries],
  );

  const handleAddSalary = () => {
    setEditingSalary(null);

    setData({
      staffId: "",
      month: "May 2025",
      basic: "",
      allowances: "",
      deductions: "",
      status: "Pending",
      paymentMethod: "Bank Transfer",
      payDate: "",
    });

    setShowModal(true);
  };

  const handleEdit = (salary) => {
    setEditingSalary(salary);

    setData({
      staffId: salary.Staff?._id || "",
      month: salary.Month || "",
      basic: salary.BasicSalary ?? "",
      allowances: salary.Allowances ?? "",
      deductions: salary.Deductions ?? "",
      status: salary.Status || "Pending",
      paymentMethod: salary.PaymentMethod || "Bank Transfer",
      payDate: salary.PayDate ? salary.PayDate.slice(0, 10) : "",
    });

    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSalary(null);
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      Staff: data.staffId,
      Month: data.month,
      BasicSalary: data.basic,
      Allowances: data.allowances || 0,
      Deductions: data.deductions || 0,
      Status: data.status,
      PaymentMethod: data.paymentMethod,
      PayDate: data.payDate || undefined,
    };

    try {
      let result;

      if (editingSalary) {
        result = await axios.put(
          `https://webglass-backhend.vercel.app/api/salary/${editingSalary._id}`,
          payload,
        );
      } else {
        result = await axios.post(
          "https://webglass-backhend.vercel.app/api/salary",
          payload,
        );
      }

      if (result.data.success) {
        setShowModal(false);
        setEditingSalary(null);
        getSalaries();
        showAlert(
          editingSalary ? "Salary Updated" : "Salary Added",
          editingSalary
            ? "The salary record has been updated successfully."
            : "The salary record has been created successfully.",
          "success",
        );
      } else {
        showAlert(
          "Unable to Save",
          result.data.message || "Something went wrong",
          "error",
        );
      }
    } catch (error) {
      if (error.response) {
        const msg = error.response.data.errors
          ? error.response.data.errors[0].msg
          : error.response.data.message;

        showAlert(
          "Unable to Save",
          msg || "Server error while saving salary",
          "error",
        );
      } else if (error.request) {
        showAlert(
          "Unable to Save",
          "Could not connect to the server.",
          "error",
        );
      } else {
        showAlert("Unable to Save", "Something went wrong.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm(
      "Delete Salary Record",
      "Are you sure you want to delete this salary record? This action cannot be undone.",
      () => performDelete(id),
    );
  };

  const performDelete = async (id) => {
    try {
      const result = await axios.delete(
        `https://webglass-backhend.vercel.app/api/salary/${id}`,
      );

      if (result.data.success) {
        setSalaries((prev) => prev.filter((s) => s._id !== id));
        showAlert(
          "Salary Deleted",
          "The salary record has been deleted successfully.",
          "success",
        );
      } else {
        showAlert(
          "Delete Failed",
          result.data.message || "Failed to delete salary record",
          "error",
        );
      }
    } catch (error) {
      showAlert(
        "Delete Failed",
        error.response?.data?.message || "Something went wrong",
        "error",
      );
    }
  };

  const handleSelectRow = (salary) => {
    setSelectedSalary(salary);
    setProcessMethod("Bank Transfer");
    setProcessPayDate(new Date().toISOString().slice(0, 10));
  };

  const clearSelection = () => {
    if (processing) return;
    setSelectedSalary(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedSalary) return;

    setProcessing(true);

    try {
      const result = await axios.put(
        `https://webglass-backhend.vercel.app/api/salary/${selectedSalary._id}`,
        {
          Status: "Paid",
          PaymentMethod: processMethod,
          PayDate: processPayDate,
        },
      );

      if (result.data.success) {
        const paidStaffName = selectedSalary.Staff?.StaffName || "staff";
        const paidAmount = rupee(selectedSalary.NetSalary);

        setSelectedSalary(null);
        getSalaries();
        showAlert(
          "Payment Processed",
          `Payment of ${paidAmount} to ${paidStaffName} has been marked as paid via ${processMethod}.`,
          "success",
        );
      } else {
        showAlert(
          "Payment Failed",
          result.data.message || "Failed to process payment",
          "error",
        );
      }
    } catch (error) {
      showAlert(
        "Payment Failed",
        error.response?.data?.message ||
          "Something went wrong while processing payment",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteHistory = (id) => {
    showConfirm(
      "Delete Payment Record",
      "Are you sure you want to delete this payment record from history? This action cannot be undone.",
      () => performDeleteHistory(id),
    );
  };

  const performDeleteHistory = async (id) => {
    try {
      const result = await axios.delete(
        `https://webglass-backhend.vercel.app/api/salary/${id}`,
      );

      if (result.data.success) {
        setSalaries((prev) => prev.filter((s) => s._id !== id));
        showAlert(
          "Payment Record Deleted",
          "The payment record has been deleted successfully.",
          "success",
        );
      } else {
        showAlert(
          "Delete Failed",
          result.data.message || "Failed to delete payment record",
          "error",
        );
      }
    } catch (error) {
      showAlert(
        "Delete Failed",
        error.response?.data?.message || "Something went wrong",
        "error",
      );
    }
  };

  const stats = useMemo(() => {
    const totalPayroll = salaries.reduce(
      (sum, s) => sum + (s.NetSalary || 0),
      0,
    );

    const paidThisMonth = salaries
      .filter((s) => s.Status === "Paid")
      .reduce((sum, s) => sum + (s.NetSalary || 0), 0);

    const pendingAmount = salaries
      .filter((s) => s.Status === "Pending")
      .reduce((sum, s) => sum + (s.NetSalary || 0), 0);

    const employeeCount = new Set(salaries.map((s) => s.Staff?._id)).size;

    return {
      totalPayroll,
      paidThisMonth,
      pendingAmount,
      employeeCount,
    };
  }, [salaries]);

  const summary = useMemo(() => {
    const totalBasic = salaries.reduce(
      (sum, s) => sum + (s.BasicSalary || 0),
      0,
    );

    const totalAllowances = salaries.reduce(
      (sum, s) => sum + (s.Allowances || 0),
      0,
    );

    const totalDeductions = salaries.reduce(
      (sum, s) => sum + (s.Deductions || 0),
      0,
    );

    const netPayroll = totalBasic + totalAllowances - totalDeductions;

    return {
      totalBasic,
      totalAllowances,
      totalDeductions,
      netPayroll,
    };
  }, [salaries]);

  const statusStyle = {
    Paid: "bg-green-100 text-green-600",
    Pending: "bg-yellow-100 text-yellow-600",
  };

  const methodStyle = {
    "Bank Transfer": "bg-blue-50 text-blue-600",
    Cash: "bg-emerald-50 text-emerald-600",
    eSewa: "bg-purple-50 text-purple-600",
    "QR Code": "bg-orange-50 text-orange-600",
  };

  const rupee = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="w-full h-screen bg-gray-100 p-8 flex flex-col overflow-hidden">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col flex-1 min-h-0">
        {}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Salary Management</h2>

            <p className="text-sm text-gray-400">
              Manage staff salaries and payroll
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddSalary}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium"
            >
              + Add Salary
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-4 gap-4 mb-5 shrink-0">
          <div className="bg-white p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              💰
            </div>

            <div>
              <p className="text-xs text-gray-500">Total Payroll</p>

              <h3 className="text-xl font-semibold">
                {rupee(stats.totalPayroll)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              ✅
            </div>

            <div>
              <p className="text-xs text-gray-500">Paid This Month</p>

              <h3 className="text-xl font-semibold">
                {rupee(stats.paidThisMonth)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              ⏳
            </div>

            <div>
              <p className="text-xs text-gray-500">Pending Amount</p>

              <h3 className="text-xl font-semibold">
                {rupee(stats.pendingAmount)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              👥
            </div>

            <div>
              <p className="text-xs text-gray-500">Employees</p>

              <h3 className="text-xl font-semibold">{stats.employeeCount}</h3>
            </div>
          </div>
        </div>

        {}
        <div className="flex gap-6 mb-4 border-b border-gray-200 shrink-0">
          {["Salary List", "Salary History"].map((tab) => (
            <span
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-sm cursor-pointer ${
                activeTab === tab
                  ? "text-indigo-600 font-semibold border-b-2 border-indigo-600"
                  : "text-gray-500"
              }`}
            >
              {tab}

              {tab === "Salary List" && pendingSalaries.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold px-1.5 py-0.5">
                  {pendingSalaries.length}
                </span>
              )}
            </span>
          ))}
        </div>

        {activeTab === "Salary List" ? (
          <div className="flex flex-col flex-1 min-h-0 gap-5">
            {}
            <div className="bg-white rounded-xl overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      #
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Staff Name
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Designation
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Basic Salary
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Allowances
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Deductions
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Net Salary
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Status
                    </th>

                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-10 text-center text-xs text-gray-400"
                      >
                        Loading salaries...
                      </td>
                    </tr>
                  ) : pendingSalaries.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-10 text-center text-xs text-gray-400"
                      >
                        No pending salary records. Everyone's been paid 🎉
                      </td>
                    </tr>
                  ) : (
                    pendingSalaries.map((s, index) => (
                      <tr
                        key={s._id}
                        onClick={() => handleSelectRow(s)}
                        className={`border-t border-gray-100 cursor-pointer transition ${
                          selectedSalary?._id === s._id
                            ? "bg-indigo-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">{index + 1}</td>

                        <td className="px-4 py-3 font-medium">
                          {s.Staff?.StaffName || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {s.Staff?.Designation || "—"}
                        </td>

                        <td className="px-4 py-3">{rupee(s.BasicSalary)}</td>

                        <td className="px-4 py-3">{rupee(s.Allowances)}</td>

                        <td className="px-4 py-3">{rupee(s.Deductions)}</td>

                        <td className="px-4 py-3 font-medium">
                          {rupee(s.NetSalary)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusStyle[s.Status]
                            }`}
                          >
                            {s.Status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(s);
                              }}
                              className="cursor-pointer"
                            >
                              ✏️
                            </span>

                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(s._id);
                              }}
                              className="cursor-pointer"
                            >
                              🗑️
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {}
            <div className="grid grid-cols-2 gap-5 shrink-0 h-72">
              <div className="bg-white rounded-xl p-5 h-full overflow-y-auto">
                <h3 className="font-semibold mb-4">Payroll Summary</h3>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Total Basic Salary
                    </p>

                    <p className="font-medium">{rupee(summary.totalBasic)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Total Allowances
                    </p>

                    <p className="font-medium">
                      {rupee(summary.totalAllowances)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Total Deductions
                    </p>

                    <p className="font-medium">
                      {rupee(summary.totalDeductions)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Net Payroll</p>

                    <p className="font-medium">{rupee(summary.netPayroll)}</p>
                  </div>
                </div>
              </div>

              {}
              <div className="bg-white rounded-xl p-4 h-full flex flex-col justify-between overflow-y-auto">
                {selectedSalary ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        Payment Method
                      </h3>

                      <p className="text-xs text-gray-400 mb-2 truncate">
                        {selectedSalary.Staff?.StaffName || "—"} ·{" "}
                        {selectedSalary.Staff?.Designation || "—"} ·{" "}
                        {selectedSalary.Month}
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setProcessMethod(method)}
                            className={`h-8 rounded-md border text-xs font-medium transition ${
                              processMethod === method
                                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="date"
                          value={processPayDate}
                          onChange={(e) => setProcessPayDate(e.target.value)}
                          className="flex-1 h-8 border border-gray-200 rounded-md px-2 text-xs outline-none focus:border-indigo-500"
                        />

                        <span className="text-xs font-semibold whitespace-nowrap">
                          {rupee(selectedSalary.NetSalary)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={clearSelection}
                        disabled={processing}
                        className="flex-1 border rounded-lg py-2 text-xs text-gray-600 disabled:opacity-60"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleConfirmPayment}
                        disabled={processing}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium text-xs disabled:opacity-60"
                      >
                        {processing ? "Processing..." : "Process Payment"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-sm text-gray-400 py-6">
                    Click a staff member in the table above to process their
                    payment.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-y-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    #
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Staff Name
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Designation
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Month
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Net Salary
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Payment Method
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Pay Date
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Status
                  </th>

                  <th className="text-left px-4 py-3 text-gray-500 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-10 text-center text-xs text-gray-400"
                    >
                      Loading history...
                    </td>
                  </tr>
                ) : paidSalaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-10 text-center text-xs text-gray-400"
                    >
                      No completed payments yet.
                    </td>
                  </tr>
                ) : (
                  paidSalaries.map((s, index) => (
                    <tr key={s._id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{index + 1}</td>

                      <td className="px-4 py-3 font-medium">
                        {s.Staff?.StaffName || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {s.Staff?.Designation || "—"}
                      </td>

                      <td className="px-4 py-3">{s.Month}</td>

                      <td className="px-4 py-3 font-medium">
                        {rupee(s.NetSalary)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            methodStyle[s.PaymentMethod] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s.PaymentMethod || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {s.PayDate
                          ? new Date(s.PayDate).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusStyle[s.Status]
                          }`}
                        >
                          {s.Status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          onClick={() => handleDeleteHistory(s._id)}
                          className="cursor-pointer"
                          title="Delete this payment record"
                        >
                          🗑️
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b p-5">
                <h3 className="text-lg font-semibold">
                  {editingSalary ? "Edit Salary" : "Add Salary"}
                </h3>

                <button
                  onClick={handleCloseModal}
                  className="text-xl text-gray-400"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleOnSubmit} className="p-5 space-y-4">
                {}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Staff Member
                  </label>

                  <select
                    name="staffId"
                    value={data.staffId}
                    onChange={handleChange}
                    required
                    disabled={!!editingSalary}
                    className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Select staff member</option>

                    {staffOptions.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.StaffName} — {st.Designation}
                      </option>
                    ))}
                  </select>

                  {editingSalary && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Staff can't be changed on an existing record — delete and
                      re-add instead.
                    </p>
                  )}
                </div>

                {}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Month
                  </label>

                  <input
                    name="month"
                    value={data.month}
                    onChange={handleChange}
                    placeholder="e.g. May 2025"
                    required
                    className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                {}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Basic
                    </label>

                    <input
                      type="number"
                      name="basic"
                      value={data.basic}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Allowances
                    </label>

                    <input
                      type="number"
                      name="allowances"
                      value={data.allowances}
                      onChange={handleChange}
                      min="0"
                      className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Deductions
                    </label>

                    <input
                      type="number"
                      name="deductions"
                      value={data.deductions}
                      onChange={handleChange}
                      min="0"
                      className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {}
                <div className="bg-gray-50 rounded-md px-3 py-2 flex justify-between text-sm">
                  <span className="text-gray-500">Net Salary</span>

                  <span className="font-semibold">{rupee(netPreview)}</span>
                </div>

                {}
                {editingSalary && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Status
                      </label>

                      <select
                        name="status"
                        value={data.status}
                        onChange={handleChange}
                        className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500"
                      >
                        <option>Pending</option>
                        <option>Paid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Pay Date
                      </label>

                      <input
                        type="date"
                        name="payDate"
                        value={data.payDate}
                        onChange={handleChange}
                        className="w-full h-10 border rounded-md px-3 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="px-5 py-2 rounded-md border text-xs text-gray-600 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium disabled:opacity-60"
                  >
                    {saving
                      ? editingSalary
                        ? "Updating..."
                        : "Adding..."
                      : editingSalary
                        ? "Update Salary"
                        : "Add Salary"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {}
      <AlertModal
        alertState={alertState}
        onClose={closeAlert}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

export default SalaryManagement;
