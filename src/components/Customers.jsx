import axios from "axios";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Prescriptions from "./Prescriptions";

const Customers = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("Customers");

  const tabs = ["Customers", "Prescription"];

  const [data, setData] = useState({
    name: "",
    number: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const getCustomers = async () => {
    try {
      const result = await axios.get(
        "https://webglass-backhend.vercel.app/api/customeralldata",
      );

      if (result.data.success) {
        setCustomers(result.data.customers || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);

      if (error.response) {
        console.error("Server response:", error.response.data);
      }
    }
  };

  useEffect(() => {
    getCustomers();
  }, []);

  const handleEdit = (customer) => {
    setEditingCustomer(customer);

    setData({
      name: customer.Name || "",
      number: customer.PhoneNumber || "",
      email: customer.Email || "",
      address: customer.Address || "",
    });

    setShowModal(true);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);

    setData({
      name: "",
      number: "",
      email: "",
      address: "",
    });

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);

    setData({
      name: "",
      number: "",
      email: "",
      address: "",
    });
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;

    setCustomerToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);

    try {
      const result = await axios.delete(
        `https://webglass-backhend.vercel.app/api/customer/${customerToDelete._id}`,
      );

      if (result.data.success) {
        await getCustomers();
        setCustomerToDelete(null);
      } else {
        alert(result.data.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Delete customer error:", error);

      if (error.response) {
        alert(
          error.response.data.message || "Server error while deleting customer",
        );
      } else if (error.request) {
        alert("Could not connect to the server.");
      } else {
        alert("Something went wrong.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    try {
      let result;

      if (editingCustomer) {
        result = await axios.put(
          `https://webglass-backhend.vercel.app/api/customer/${editingCustomer._id}`,
          {
            Name: data.name,
            PhoneNumber: data.number,
            Email: data.email,
            Address: data.address,
          },
        );
      } else {
        result = await axios.post(
          "https://webglass-backhend.vercel.app/api/customer",
          {
            Name: data.name,
            PhoneNumber: data.number,
            Email: data.email,
            Address: data.address,
          },
        );
      }

      if (result.data.success) {
        alert(
          editingCustomer
            ? "Customer updated successfully"
            : "Customer created successfully",
        );

        handleCloseModal();
        await getCustomers();
      } else {
        alert(result.data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error saving customer:", error);

      if (error.response) {
        console.log("Server response:", error.response.data);

        const serverData = error.response.data;

        const validationMessage = serverData.errors?.[0]?.msg;

        alert(
          serverData.message ||
            validationMessage ||
            "Server error while saving customer",
        );
      } else if (error.request) {
        alert("Could not connect to the server.");
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    const name = String(customer.Name || "").toLowerCase();

    const phone = String(customer.PhoneNumber || "").toLowerCase();

    const email = String(customer.Email || "").toLowerCase();

    return (
      name.includes(searchValue) ||
      phone.includes(searchValue) ||
      email.includes(searchValue)
    );
  });

  const exportToExcel = () => {
    if (filteredCustomers.length === 0) {
      alert("No customer data available to export.");
      return;
    }

    const excelData = filteredCustomers.map((customer, index) => ({
      "#": index + 1,
      Name: customer.Name || "",
      Phone: customer.PhoneNumber || "",
      Email: customer.Email || "",
      Address: customer.Address || "",
      "Created Date": customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString()
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    XLSX.writeFile(workbook, "Customers.xlsx");

    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    if (filteredCustomers.length === 0) {
      alert("No customer data available to export.");
      return;
    }

    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text("Customer List", 14, 15);

    doc.setFontSize(9);

    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = filteredCustomers.map((customer, index) => [
      index + 1,
      customer.Name || "-",
      customer.PhoneNumber || "-",
      customer.Email || "-",
      customer.Address || "-",
      customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString()
        : "-",
    ]);

    autoTable(doc, {
      startY: 28,

      head: [["#", "Customer", "Phone", "Email", "Address", "Created Date"]],

      body: tableData,

      styles: {
        fontSize: 8,
        cellPadding: 3,
      },

      headStyles: {
        fontSize: 8,
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save("Customers.pdf");

    setShowExportMenu(false);
  };

  return (
    <>
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Customers / Prescription
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Manage your customers and prescriptions
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);

                if (tab !== "Customers") {
                  setShowModal(false);
                }
              }}
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

        {activeTab === "Customers" && (
          <>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              {}
              <div className="relative w-full sm:w-[280px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone or email..."
                  className="h-9 w-full rounded-md border border-gray-200 px-3 pr-8 text-[11px] outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-sm text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="hidden flex-1 sm:block" />

              {}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="h-9 cursor-pointer rounded-md border border-gray-200 px-4 text-[11px] text-gray-600 hover:bg-gray-50"
                >
                  Export
                  <span className="ml-2">▾</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 z-30 mt-1 w-32 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={exportToPDF}
                      className="block w-full cursor-pointer px-4 py-2 text-left text-[11px] text-gray-700 hover:bg-gray-100"
                    >
                      Export PDF
                    </button>

                    <button
                      type="button"
                      onClick={exportToExcel}
                      className="block w-full cursor-pointer px-4 py-2 text-left text-[11px] text-gray-700 hover:bg-gray-100"
                    >
                      Export Excel
                    </button>
                  </div>
                )}
              </div>

              {}
              <button
                type="button"
                onClick={handleAddCustomer}
                className="h-9 cursor-pointer rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
              >
                Add New Customer
              </button>
            </div>

            {search && (
              <p className="mt-2 text-[11px] text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {filteredCustomers.length}
                </span>{" "}
                matching customer
                {filteredCustomers.length !== 1 ? "s" : ""}
              </p>
            )}

            <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b bg-gray-50 text-center">
                      <th className="px-4 py-3 text-left text-[10px] text-gray-500">
                        #
                      </th>

                      <th className="px-4 py-3 text-[10px] text-gray-500">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-[10px] text-gray-500">
                        Phone
                      </th>

                      <th className="px-4 py-3 text-[10px] text-gray-500">
                        Email
                      </th>

                      <th className="px-4 py-3 text-[10px] text-gray-500">
                        Last Visit
                      </th>

                      <th className="px-4 py-3 text-[10px] text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer, index) => (
                        <tr
                          key={customer._id}
                          className="border-b border-gray-100 text-center hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3 text-xs font-medium text-gray-800">
                            {customer.Name || "-"}
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-600">
                            {customer.PhoneNumber || "-"}
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-600">
                            {customer.Email || "-"}
                          </td>

                          <td className="px-4 py-3 text-xs text-gray-600">
                            {customer.createdAt
                              ? new Date(
                                  customer.createdAt,
                                ).toLocaleDateString()
                              : "-"}
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <div className="flex items-center justify-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleEdit(customer)}
                                className="cursor-pointer text-blue-600 hover:text-blue-800"
                                title="Edit Customer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteClick(customer)}
                                className="cursor-pointer text-red-600 hover:text-red-800"
                                title="Delete Customer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-10 text-center text-xs text-gray-400"
                        >
                          {search
                            ? `No customers found for "${search}"`
                            : "No customers available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b p-5">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingCustomer ? "Edit Customer" : "Add New Customer"}
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
                          Customer Name
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
                          onChange={(e) => {
                            const digitsOnly = e.target.value.replace(
                              /\D/g,
                              "",
                            );

                            setData({
                              ...data,
                              number: digitsOnly,
                            });
                          }}
                          placeholder="10-digit phone number"
                          maxLength={10}
                          pattern="\d{10}"
                          title="Phone number must be exactly 10 digits"
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
                          Address
                        </label>

                        <input
                          type="text"
                          name="address"
                          value={data.address}
                          onChange={handleChange}
                          className="w-full rounded-md border px-3 py-2 text-xs outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t p-5">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="cursor-pointer rounded-md border px-5 py-2 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="cursor-pointer rounded-md bg-blue-600 px-5 py-2 text-xs text-white hover:bg-blue-700"
                      >
                        {editingCustomer ? "Update Customer" : "Add Customer"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {customerToDelete && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={handleCancelDelete}
              >
                <div
                  className="w-full max-w-sm rounded-xl bg-white shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-red-50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-red-500"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-gray-800">
                          Delete customer?
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                          This will permanently remove{" "}
                          <span className="font-medium text-gray-700">
                            {customerToDelete.Name || "this customer"}
                          </span>{" "}
                          from your customer list. This action can't be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t p-5">
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      disabled={isDeleting}
                      className="cursor-pointer rounded-md border px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={isDeleting}
                      className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete Customer"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "Prescription" && (
          <div className="mt-6">
            <Prescriptions />
          </div>
        )}
      </div>
    </>
  );
};

export default Customers;
