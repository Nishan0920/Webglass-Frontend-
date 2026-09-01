import axios from "axios";
import React, { useEffect, useState } from "react";
import SalaryManagement from "./SalesManagement";

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

        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500">{message}</p>

        <div className="mt-5 mb-4 border-t border-gray-100" />

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

// Simple 4-digit access code required before the staff screen is shown.
// Change this to whatever code you want staff-access to use.
const STAFF_PIN = "1234";

const Staff = () => {
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("Staff");

  const tabs = ["Staff", "Salary Management"];

  const [data, setData] = useState({
    name: "",
    number: "",
    email: "",
    designation: "",
  });

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

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const getStaff = async () => {
    setLoading(true);

    try {
      const result = await axios.get(
        "https://webglass-backhend.vercel.app/api/staffalldata",
      );

      if (result.data.success) {
        setStaff(result.data.staff || []);
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);

      if (error.response) {
        console.error("Server response:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStaff();
  }, []);

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);

    setData({
      name: staffMember.StaffName || "",
      number: staffMember.PhoneNumber || "",
      email: staffMember.Email || "",
      designation: staffMember.Designation || "",
    });

    setShowModal(true);
  };

  const handleAddStaff = () => {
    setEditingStaff(null);

    setData({
      name: "",
      number: "",
      email: "",
      designation: "",
    });

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);

    setData({
      name: "",
      number: "",
      email: "",
      designation: "",
    });
  };

  const handleDelete = (staffId) => {
    showConfirm(
      "Delete Staff Member",
      "Are you sure you want to delete this staff member? This action cannot be undone.",
      () => performDelete(staffId),
    );
  };

  const performDelete = async (staffId) => {
    try {
      const result = await axios.delete(
        `https://webglass-backhend.vercel.app/api/staff/${staffId}`,
      );

      if (result.data.success) {
        await getStaff();
        showAlert(
          "Staff Deleted",
          "The staff member has been deleted successfully.",
          "success",
        );
      } else {
        showAlert(
          "Delete Failed",
          result.data.message || "Failed to delete staff",
          "error",
        );
      }
    } catch (error) {
      console.error("Delete staff error:", error);

      if (error.response) {
        showAlert(
          "Delete Failed",
          error.response.data.message || "Server error while deleting staff",
          "error",
        );
      } else if (error.request) {
        showAlert("Delete Failed", "Could not connect to the server.", "error");
      } else {
        showAlert("Delete Failed", "Something went wrong.", "error");
      }
    }
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      let result;

      if (editingStaff) {
        result = await axios.put(
          `https://webglass-backhend.vercel.app/api/staff/${editingStaff._id}`,
          {
            StaffName: data.name,
            PhoneNumber: data.number,
            Email: data.email,
            Designation: data.designation,
          },
        );
      } else {
        result = await axios.post(
          "https://webglass-backhend.vercel.app/api/staff",
          {
            StaffName: data.name,
            PhoneNumber: data.number,
            Email: data.email,
            Designation: data.designation,
          },
        );
      }

      if (result.data.success) {
        handleCloseModal();

        await getStaff();

        showAlert(
          editingStaff ? "Staff Updated" : "Staff Added",
          editingStaff
            ? "The staff member has been updated successfully."
            : "The staff member has been created successfully.",
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
      console.error("Error saving staff:", error);

      if (error.response) {
        showAlert(
          "Unable to Save",
          error.response.data.message || "Server error while saving staff",
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

  const filteredStaff = staff.filter((staffMember) => {
    const searchValue = search.toLowerCase();

    return (
      staffMember.StaffName?.toLowerCase().includes(searchValue) ||
      String(staffMember.PhoneNumber || "")
        .toLowerCase()
        .includes(searchValue) ||
      staffMember.Email?.toLowerCase().includes(searchValue)
    );
  });

  const handlePinSubmit = (e) => {
    e.preventDefault();

    if (pinInput === STAFF_PIN) {
      setPinError("");
      setPinVerified(true);
    } else {
      setPinError("Incorrect code. Please try again.");
      setPinInput("");
    }
  };

  const handlePinChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);

    setPinInput(digitsOnly);

    if (pinError) {
      setPinError("");
    }
  };

  if (!pinVerified) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-8">
        <form
          onSubmit={handlePinSubmit}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <i className="fa-solid fa-lock"></i>
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              Enter Access Code
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Enter the 4-digit code to open Staff / Salary Management
            </p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinInput}
            onChange={handlePinChange}
            maxLength={4}
            placeholder="••••"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-indigo-500"
          />

          {pinError && (
            <p className="mt-3 text-center text-sm text-red-500">{pinError}</p>
          )}

          <button
            type="submit"
            disabled={pinInput.length !== 4}
            className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Unlock Staff Management
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Staff / Salary Management
        </h1>

        <p className="mt-1 text-xs text-gray-400">
          Manage staff and salary information
        </p>
      </div>

      <div className="mt-5 flex gap-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-sm transition ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 font-semibold text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Staff" && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[260px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone or email"
                className="h-9 w-full rounded-md border border-gray-200 px-3 text-[11px] outline-none focus:border-blue-500"
              />
            </div>

            <div className="hidden flex-1 sm:block" />

            <button
              type="button"
              onClick={handleAddStaff}
              className="h-9 cursor-pointer rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
            >
              Add New Staff
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-center">
                    <th className="px-4 py-3 text-left text-[10px] text-gray-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-[10px] text-gray-500">
                      Staff
                    </th>

                    <th className="px-4 py-3 text-[10px] text-gray-500">
                      Phone
                    </th>

                    <th className="px-4 py-3 text-[10px] text-gray-500">
                      Email
                    </th>

                    <th className="px-4 py-3 text-[10px] text-gray-500">
                      Designation
                    </th>

                    <th className="px-4 py-3 text-[10px] text-gray-500">
                      Joined
                    </th>

                    <th className="px-4 py-3 text-[10px] text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-10 text-center text-xs text-gray-400"
                      >
                        Loading staff...
                      </td>
                    </tr>
                  ) : filteredStaff.length > 0 ? (
                    filteredStaff.map((staffMember, index) => (
                      <tr
                        key={staffMember._id}
                        className="border-b border-gray-100 text-center hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-gray-800">
                          {staffMember.StaffName}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {staffMember.PhoneNumber}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {staffMember.Email}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {staffMember.Designation}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {staffMember.createdAt
                            ? new Date(
                                staffMember.createdAt,
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          <div className="flex justify-around text-sm">
                            <button
                              type="button"
                              onClick={() => handleEdit(staffMember)}
                              className="cursor-pointer text-blue-600 hover:text-blue-800"
                            >
                              <i className="fa-solid fa-pen text-blue-500" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(staffMember._id)}
                              className="cursor-pointer text-red-600 hover:text-red-800"
                            >
                              <i className="fa-solid fa-trash-can text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-10 text-center text-xs text-gray-400"
                      >
                        {search ? "No staff found" : "No staff available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Salary Management" && (
        <div className="mt-6">
          <SalaryManagement />
        </div>
      )}

      {showModal && activeTab === "Staff" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingStaff ? "Edit Staff" : "Add New Staff"}
              </h2>

              <button
                type="button"
                onClick={handleCloseModal}
                className="cursor-pointer text-xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleOnSubmit}>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Staff Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    className="h-10 w-full rounded-md border px-3 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="number"
                    value={data.number}
                    onChange={handleChange}
                    className="h-10 w-full rounded-md border px-3 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    className="h-10 w-full rounded-md border px-3 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Designation
                  </label>

                  <input
                    type="text"
                    name="designation"
                    value={data.designation}
                    onChange={handleChange}
                    className="w-full rounded-md border px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="cursor-pointer rounded-md border px-5 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-md bg-blue-600 px-5 py-2 text-xs text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? editingStaff
                      ? "Updating..."
                      : "Adding..."
                    : editingStaff
                      ? "Update Staff"
                      : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal
        alertState={alertState}
        onClose={closeAlert}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default Staff;
