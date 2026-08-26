import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://webglass-backhend.vercel.app/api";

const emptyEye = {
  sph: "",
  cyl: "",
  axis: "",
  add: "",
};

const emptyForm = {
  PrescriptionId: "",
  Customer: "",
  Date: "",
  Type: "Single Vision",
  RightEye: {
    ...emptyEye,
  },
  LeftEye: {
    ...emptyEye,
  },
};

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

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ...emptyForm,
    RightEye: {
      ...emptyEye,
    },
    LeftEye: {
      ...emptyEye,
    },
  });
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get("customerId");
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, []);

  const getCustomers = async () => {
    try {
      setCustomersLoading(true);
      const result = await axios.get(`${API_URL}/prescription/customers`);
      if (result.data.success) {
        setCustomers(result.data.customers || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setErrorMessage(
        error.response?.data?.message || "Failed to load customers.",
      );
    } finally {
      setCustomersLoading(false);
    }
  };

  const getPrescriptions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const result = await axios.get(`${API_URL}/prescriptionalldata`);
      if (result.data.success) {
        setPrescriptions(result.data.prescriptions || []);
      } else {
        setPrescriptions([]);
        setErrorMessage(result.data.message || "Failed to load prescriptions.");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      if (error.response) {
        setErrorMessage(
          error.response.data.message ||
            error.response.data.error ||
            "Failed to load prescriptions.",
        );
      } else if (error.request) {
        setErrorMessage(
          "Could not connect to the server. Make sure your backend is running.",
        );
      } else {
        setErrorMessage("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomers();
    getPrescriptions();
  }, []);

  const getCustomerName = (customerId) => {
    if (!customerId) {
      return "";
    }
    const customer = customers.find(
      (item) => item._id?.toString() === customerId?.toString(),
    );
    return customer?.Name || "";
  };

  const filteredPrescriptions = useMemo(() => {
    const searchValue = search.toLowerCase().trim();
    return prescriptions.filter((prescription) => {
      if (
        selectedCustomerId &&
        prescription.Customer?.toString() !== selectedCustomerId?.toString()
      ) {
        return false;
      }
      if (!searchValue) {
        return true;
      }
      return (
        prescription.PrescriptionId?.toLowerCase().includes(searchValue) ||
        prescription.CustomerName?.toLowerCase().includes(searchValue) ||
        prescription.CustomerPhone?.toLowerCase().includes(searchValue)
      );
    });
  }, [prescriptions, search, selectedCustomerId]);

  const totalPrescriptions = prescriptions.length;
  const singleVisionCount = prescriptions.filter(
    (p) => p.Type === "Single Vision",
  ).length;
  const bifocalCount = prescriptions.filter((p) => p.Type === "Bifocal").length;
  const progressiveCount = prescriptions.filter(
    (p) => p.Type === "Progressive",
  ).length;

  const clearCustomerFilter = () => {
    setSelectedCustomerId("");
    const url = new URL(window.location.href);
    url.searchParams.delete("customerId");
    window.history.replaceState({}, "", url.toString());
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEye = (eye) => {
    if (!eye) {
      return "-";
    }
    const values = [];
    if (eye.sph) {
      values.push(`SPH ${eye.sph}`);
    }
    if (eye.cyl) {
      values.push(`CYL ${eye.cyl}`);
    }
    if (eye.axis) {
      values.push(`AXIS ${eye.axis}°`);
    }
    if (eye.add) {
      values.push(`ADD ${eye.add}`);
    }
    return values.length > 0 ? values.join(" ") : "-";
  };

  const handleInputChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleEyeChange = (eye, field, value) => {
    setFormData((previous) => ({
      ...previous,
      [eye]: {
        ...previous[eye],
        [field]: value,
      },
    }));
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      Customer: selectedCustomerId || "",
      RightEye: {
        ...emptyEye,
      },
      LeftEye: {
        ...emptyEye,
      },
    });
    setErrorMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({
      ...emptyForm,
      RightEye: {
        ...emptyEye,
      },
      LeftEye: {
        ...emptyEye,
      },
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage("");
      if (!formData.PrescriptionId.trim()) {
        setErrorMessage("Prescription ID is required.");
        return;
      }
      if (!formData.Customer) {
        setErrorMessage("Please select a customer.");
        return;
      }
      if (!formData.Type) {
        setErrorMessage("Please select prescription type.");
        return;
      }
      const payload = {
        PrescriptionId: formData.PrescriptionId.trim(),
        Customer: formData.Customer,
        Date: formData.Date || undefined,
        Type: formData.Type,
        RightEye: {
          sph: formData.RightEye.sph.trim(),
          cyl: formData.RightEye.cyl.trim(),
          axis: formData.RightEye.axis.trim(),
          add: formData.RightEye.add.trim(),
        },
        LeftEye: {
          sph: formData.LeftEye.sph.trim(),
          cyl: formData.LeftEye.cyl.trim(),
          axis: formData.LeftEye.axis.trim(),
          add: formData.LeftEye.add.trim(),
        },
      };

      let result;
      if (editingId) {
        result = await axios.put(
          `${API_URL}/prescription/${editingId}`,
          payload,
        );
      } else {
        result = await axios.post(`${API_URL}/prescription`, payload);
      }

      if (result.data.success) {
        closeForm();
        await getPrescriptions();
        showAlert(
          editingId ? "Prescription Updated" : "Prescription Added",
          editingId
            ? "The prescription record has been updated successfully."
            : "The prescription record has been added successfully.",
          "success",
        );
      } else {
        setErrorMessage(result.data.message || "Unable to save prescription.");
      }
    } catch (error) {
      console.error("Save prescription error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to save prescription.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prescription) => {
    setEditingId(prescription._id);
    setFormData({
      PrescriptionId: prescription.PrescriptionId || "",
      Customer: prescription.Customer || "",
      Date: prescription.Date
        ? new Date(prescription.Date).toISOString().split("T")[0]
        : "",
      Type: prescription.Type || "Single Vision",
      RightEye: {
        sph: prescription.RightEye?.sph || "",
        cyl: prescription.RightEye?.cyl || "",
        axis: prescription.RightEye?.axis || "",
        add: prescription.RightEye?.add || "",
      },
      LeftEye: {
        sph: prescription.LeftEye?.sph || "",
        cyl: prescription.LeftEye?.cyl || "",
        axis: prescription.LeftEye?.axis || "",
        add: prescription.LeftEye?.add || "",
      },
    });
    setErrorMessage("");
    setShowForm(true);
  };

  const handleDelete = (id) => {
    showConfirm(
      "Delete Prescription",
      "Are you sure you want to delete this prescription? This action cannot be undone.",
      () => performDelete(id),
    );
  };

  const performDelete = async (id) => {
    try {
      setDeleting(true);
      const result = await axios.delete(`${API_URL}/prescription/${id}`);
      if (result.data.success) {
        await getPrescriptions();
        showAlert(
          "Prescription Deleted",
          "The prescription record has been deleted successfully.",
          "success",
        );
      } else {
        showAlert(
          "Delete Failed",
          result.data.message || "Failed to delete prescription.",
          "error",
        );
      }
    } catch (error) {
      console.error("Delete prescription error:", error);
      showAlert(
        "Delete Failed",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to delete prescription.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const selectedCustomer = customers.find(
    (customer) => customer._id?.toString() === selectedCustomerId?.toString(),
  );

  return (
    <div className="min-h-screen w-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col">
        {}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
            <p className="mt-1 text-sm text-gray-400">
              Manage and track customer prescriptions
            </p>
          </div>
        </div>

        {}
        {errorMessage && !showForm && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5">
            <span className="mr-2 text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone or prescription ID"
              className="w-full text-sm outline-none"
            />
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Prescription
          </button>
        </div>

        {}
        {selectedCustomerId && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <div>
              <p className="text-xs text-blue-500">
                Showing prescriptions for selected customer
              </p>
              <p className="mt-1 text-sm font-medium text-blue-900">
                Customer: {selectedCustomer?.Name || "Selected Customer"}
              </p>
            </div>
            <button
              type="button"
              onClick={clearCustomerFilter}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Show All
            </button>
          </div>
        )}

        {}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              📄
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Prescriptions</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {totalPrescriptions}
              </h3>
              <span className="text-xs text-gray-400">All Records</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              👓
            </div>
            <div>
              <p className="text-xs text-gray-500">Single Vision</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {singleVisionCount}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              🕶️
            </div>
            <div>
              <p className="text-xs text-gray-500">Bifocal</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {bifocalCount}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              👁️
            </div>
            <div>
              <p className="text-xs text-gray-500">Progressive</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {progressiveCount}
              </h3>
            </div>
          </div>
        </div>

        {}
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Prescription ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Right (OD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Left (OS)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center text-xs text-gray-400"
                    >
                      Loading prescriptions...
                    </td>
                  </tr>
                ) : filteredPrescriptions.length > 0 ? (
                  filteredPrescriptions.map((p, index) => (
                    <tr
                      key={p._id || p.PrescriptionId || index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-semibold text-indigo-600">
                          {p.PrescriptionId || "-"}
                        </span>
                      </td>
                      {}
                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-gray-800">
                          {p.CustomerName || "Unknown Customer"}
                        </div>
                        {p.CustomerPhone && (
                          <div className="mt-1 text-[11px] text-gray-400">
                            {p.CustomerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-600">
                          {formatDate(p.Date)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-medium text-indigo-600">
                          {p.Type || "-"}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-4">
                        <span className="text-xs leading-5 text-gray-600">
                          {formatEye(p.RightEye)}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-4">
                        <span className="text-xs leading-5 text-gray-600">
                          {formatEye(p.LeftEye)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDelete(p._id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-3 text-3xl">📄</div>
                        <p className="text-sm font-medium text-gray-600">
                          {search
                            ? "No prescriptions found"
                            : "No prescriptions available"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {search
                            ? "Try a different customer name, phone number or prescription ID."
                            : "Click + New Prescription to add a prescription."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Prescription" : "New Prescription"}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Enter the customer's prescription details
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {}
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {}
              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Prescription Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Prescription ID *
                    </label>
                    <input
                      type="text"
                      value={formData.PrescriptionId}
                      onChange={(e) =>
                        handleInputChange("PrescriptionId", e.target.value)
                      }
                      placeholder="PRES-001"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Customer *
                    </label>
                    <select
                      value={formData.Customer}
                      onChange={(e) =>
                        handleInputChange("Customer", e.target.value)
                      }
                      required
                      disabled={customersLoading}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {customersLoading
                          ? "Loading customers..."
                          : "Select Customer"}
                      </option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.Name}
                          {customer.PhoneNumber
                            ? ` - ${customer.PhoneNumber}`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {}
                    {formData.Customer &&
                      getCustomerName(formData.Customer) && (
                        <p className="mt-1.5 text-[11px] text-gray-400">
                          Selected:{" "}
                          <span className="font-medium text-gray-600">
                            {getCustomerName(formData.Customer)}
                          </span>
                        </p>
                      )}
                  </div>

                  {}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.Date}
                      onChange={(e) =>
                        handleInputChange("Date", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Prescription Type *
                </label>
                <select
                  value={formData.Type}
                  onChange={(e) => handleInputChange("Type", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 md:w-1/3"
                >
                  <option value="Single Vision">Single Vision</option>
                  <option value="Bifocal">Bifocal</option>
                  <option value="Progressive">Progressive</option>
                </select>
              </div>

              {}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Eye Prescription
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm">
                        R
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          Right Eye
                        </h4>
                        <p className="text-[11px] text-gray-400">OD</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          SPH
                        </label>
                        <input
                          type="text"
                          value={formData.RightEye.sph}
                          onChange={(e) =>
                            handleEyeChange("RightEye", "sph", e.target.value)
                          }
                          placeholder="-2.00"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          CYL
                        </label>
                        <input
                          type="text"
                          value={formData.RightEye.cyl}
                          onChange={(e) =>
                            handleEyeChange("RightEye", "cyl", e.target.value)
                          }
                          placeholder="-0.50"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          AXIS
                        </label>
                        <input
                          type="text"
                          value={formData.RightEye.axis}
                          onChange={(e) =>
                            handleEyeChange("RightEye", "axis", e.target.value)
                          }
                          placeholder="180"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          ADD
                        </label>
                        <input
                          type="text"
                          value={formData.RightEye.add}
                          onChange={(e) =>
                            handleEyeChange("RightEye", "add", e.target.value)
                          }
                          placeholder="+2.00"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-sm">
                        L
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          Left Eye
                        </h4>
                        <p className="text-[11px] text-gray-400">OS</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          SPH
                        </label>
                        <input
                          type="text"
                          value={formData.LeftEye.sph}
                          onChange={(e) =>
                            handleEyeChange("LeftEye", "sph", e.target.value)
                          }
                          placeholder="-2.00"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          CYL
                        </label>
                        <input
                          type="text"
                          value={formData.LeftEye.cyl}
                          onChange={(e) =>
                            handleEyeChange("LeftEye", "cyl", e.target.value)
                          }
                          placeholder="-0.50"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          AXIS
                        </label>
                        <input
                          type="text"
                          value={formData.LeftEye.axis}
                          onChange={(e) =>
                            handleEyeChange("LeftEye", "axis", e.target.value)
                          }
                          placeholder="180"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      {}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          ADD
                        </label>
                        <input
                          type="text"
                          value={formData.LeftEye.add}
                          onChange={(e) =>
                            handleEyeChange("LeftEye", "add", e.target.value)
                          }
                          placeholder="+2.00"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Prescription"
                      : "Save Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      <AlertModal
        alertState={alertState}
        onClose={closeAlert}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

export default Prescriptions;
