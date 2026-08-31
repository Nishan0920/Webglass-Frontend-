import React, { useEffect, useState } from "react";
import axios from "axios";

function RentLease() {
  const [activeTab, setActiveTab] = useState("Rent Payments");

  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [leases, setLeases] = useState([]);
  const [loadingLease, setLoadingLease] = useState(true);
  const [leaseIndex, setLeaseIndex] = useState(0);

  const activeLease = leases[0] || null;

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [editingLease, setEditingLease] = useState(null);

  const [leaseDetails, setLeaseDetails] = useState({
    Property: "",
    Location: "",
    PropertyOwner: "",
    MonthlyRent: "",
    AgreementStartDate: "",
    AgreementEndDate: "",
    SecurityDeposit: "",
    AdvancePaid: "",
    NoticePeriod: "",
    RentIncrement: "",
    Notes: "",
  });

  const [editingPayment, setEditingPayment] = useState(null);

  const [paymentDetails, setPaymentDetails] = useState({
    rentAmount: "",
    dueDate: "",
    paidDate: "",
    paymentMethod: "Due",
    status: "Due",
    notes: "",
  });

  const [alertModal, setAlertModal] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
    });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const getErrorMessage = (error, fallback) => {
    if (error?.response) {
      return error.response.data?.message || fallback;
    }

    if (error?.request) {
      return "Could not connect to the server.";
    }

    return error?.message || fallback;
  };

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        setLoadingLease(true);

        const result = await axios.get(
          "https://webglass-backhend.vercel.app/rentandlease",
        );

        if (result.data.success) {
          setLeases(result.data.data || []);
        }
      } catch (error) {
        console.error("Fetch lease error:", error);

        showAlert(
          "error",
          "Loading Failed",
          getErrorMessage(error, "Failed to load leases."),
        );
      } finally {
        setLoadingLease(false);
      }
    };

    fetchLeases();
  }, []);

  useEffect(() => {
    if (leaseIndex >= leases.length) {
      setLeaseIndex(0);
    }
  }, [leases, leaseIndex]);

  const fetchPayments = async () => {
    if (!activeLease?._id) {
      setPayments([]);
      return;
    }

    try {
      setLoadingPayments(true);

      const result = await axios.get(
        `https://webglass-backhend.vercel.app/rentandlease/${activeLease._id}/payments`,
      );

      if (result.data.success) {
        setPayments(result.data.data || []);
      }
    } catch (error) {
      console.error("Fetch payments error:", error);

      showAlert(
        "error",
        "Loading Failed",
        getErrorMessage(error, "Failed to load rent payments."),
      );
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeLease?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLeaseDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;

    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddLease = () => {
    setEditingLease(null);

    setLeaseDetails({
      Property: "",
      Location: "",
      PropertyOwner: "",
      MonthlyRent: "",
      AgreementStartDate: "",
      AgreementEndDate: "",
      SecurityDeposit: "",
      AdvancePaid: "",
      NoticePeriod: "",
      RentIncrement: "",
      Notes: "",
    });

    setShowLeaseModal(true);
  };

  const openEditLease = (lease) => {
    setEditingLease(lease);

    setLeaseDetails({
      Property: lease.property || "",
      Location: lease.location || "",
      PropertyOwner: lease.propertyOwner || "",
      MonthlyRent: lease.monthlyRent ?? "",

      AgreementStartDate: lease.agreementStartDate
        ? lease.agreementStartDate.slice(0, 10)
        : "",

      AgreementEndDate: lease.agreementEndDate
        ? lease.agreementEndDate.slice(0, 10)
        : "",

      SecurityDeposit: lease.securityDeposit ?? "",
      AdvancePaid: lease.advancePaid ?? "",
      NoticePeriod: lease.noticePeriod || "",
      RentIncrement: lease.rentIncrement || "",
      Notes: lease.notes || "",
    });

    setShowLeaseModal(true);
  };

  const closeLeaseModal = () => {
    setShowLeaseModal(false);
    setEditingLease(null);
  };

  const handleSaveLease = async (e) => {
    e.preventDefault();

    const payload = {
      property: leaseDetails.Property,
      location: leaseDetails.Location,
      propertyOwner: leaseDetails.PropertyOwner,
      monthlyRent: Number(leaseDetails.MonthlyRent),
      agreementStartDate: leaseDetails.AgreementStartDate,
      agreementEndDate: leaseDetails.AgreementEndDate,
      securityDeposit: Number(leaseDetails.SecurityDeposit || 0),
      advancePaid: Number(leaseDetails.AdvancePaid || 0),
      noticePeriod: leaseDetails.NoticePeriod,
      rentIncrement: leaseDetails.RentIncrement,
      notes: leaseDetails.Notes,
    };

    try {
      let result;

      if (editingLease) {
        result = await axios.put(
          `https://webglass-backhend.vercel.app/rentandlease/${editingLease._id}`,
          payload,
        );
      } else {
        result = await axios.post(
          "https://webglass-backhend.vercel.app/rentandlease",
          payload,
        );
      }

      if (result.data.success) {
        if (editingLease) {
          setLeases((prev) =>
            prev.map((l) =>
              l._id === editingLease._id ? result.data.data : l,
            ),
          );
        } else {
          setLeases((prev) => [result.data.data, ...prev]);
          setLeaseIndex(0);
        }

        closeLeaseModal();

        showAlert(
          "success",
          editingLease ? "Lease Updated" : "Lease Created",
          editingLease
            ? "The lease details have been updated successfully."
            : "The new lease has been created successfully.",
        );
      } else {
        showAlert(
          "error",
          "Save Failed",
          result.data.message || "Something went wrong while saving the lease.",
        );
      }
    } catch (error) {
      console.error("Save lease error:", error);

      showAlert(
        "error",
        "Save Failed",
        getErrorMessage(error, "Server error while saving lease."),
      );
    }
  };

  const handleDeleteLease = async (lease) => {
    if (
      !window.confirm(
        `Delete the lease for "${lease.property}"? This also removes its rent payment history.`,
      )
    ) {
      return;
    }

    try {
      const result = await axios.delete(
        `https://webglass-backhend.vercel.app/rentandlease/${lease._id}`,
      );

      if (result.data.success) {
        setLeases((prev) => prev.filter((l) => l._id !== lease._id));

        setLeaseIndex((prev) => Math.max(0, prev - 1));

        showAlert(
          "success",
          "Lease Deleted",
          `The lease for "${lease.property}" has been removed.`,
        );
      } else {
        showAlert(
          "error",
          "Delete Failed",
          result.data.message || "Failed to delete lease",
        );
      }
    } catch (error) {
      showAlert(
        "error",
        "Delete Failed",
        getErrorMessage(error, "Something went wrong"),
      );
    }
  };

  const openAddPayment = () => {
    setEditingPayment(null);

    setPaymentDetails({
      rentAmount: "",
      dueDate: "",
      paidDate: "",
      paymentMethod: "Due",
      status: "Due",
      notes: "",
    });

    setShowPaymentModal(true);
  };

  const openEditPayment = (payment) => {
    setEditingPayment(payment);

    setPaymentDetails({
      rentAmount: payment.rentAmount ?? "",

      dueDate: payment.dueDate ? payment.dueDate.slice(0, 10) : "",

      paidDate: payment.paidDate ? payment.paidDate.slice(0, 10) : "",

      paymentMethod: payment.paymentMethod || "Due",
      status: payment.status || "Due",
      notes: payment.notes || "",
    });

    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();

    if (!activeLease?._id) {
      showAlert(
        "warning",
        "No Lease Found",
        "Please create a lease first before adding a rent payment.",
      );

      return;
    }

    const payload = {
      leaseId: activeLease._id,
      rentAmount: Number(paymentDetails.rentAmount),
      dueDate: paymentDetails.dueDate,
      paidDate: paymentDetails.paidDate || null,
      paymentMethod: paymentDetails.paymentMethod || "Due",
      status: paymentDetails.status || "Due",
      notes: paymentDetails.notes,
    };

    try {
      let result;

      if (editingPayment) {
        result = await axios.put(
          `https://webglass-backhend.vercel.app/rentandlease/payment/${editingPayment._id}`,
          payload,
        );
      } else {
        result = await axios.post(
          "https://webglass-backhend.vercel.app/rentandlease/payment",
          payload,
        );
      }

      if (result.data.success) {
        if (editingPayment) {
          setPayments((prev) =>
            prev.map((p) =>
              p._id === editingPayment._id ? result.data.data : p,
            ),
          );
        } else {
          setPayments((prev) => [result.data.data, ...prev]);
        }

        closePaymentModal();

        setPaymentDetails({
          rentAmount: "",
          dueDate: "",
          paidDate: "",
          paymentMethod: "Due",
          status: "Due",
          notes: "",
        });

        showAlert(
          "success",
          editingPayment ? "Payment Updated" : "Payment Added",
          editingPayment
            ? "The rent payment record has been updated successfully."
            : "The rent payment has been recorded successfully.",
        );
      } else {
        showAlert(
          "error",
          "Save Failed",
          result.data.message ||
            "Something went wrong while saving the payment.",
        );
      }
    } catch (error) {
      console.error("Save rent payment error:", error);

      showAlert(
        "error",
        "Save Failed",
        getErrorMessage(error, "Server error while saving payment."),
      );
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Delete this rent payment record?")) {
      return;
    }

    try {
      const result = await axios.delete(
        `https://webglass-backhend.vercel.app/rentandlease/payment/${id}`,
      );

      if (result.data.success) {
        setPayments((prev) => prev.filter((p) => p._id !== id));

        showAlert(
          "success",
          "Payment Deleted",
          "The rent payment record has been removed.",
        );
      } else {
        showAlert(
          "error",
          "Delete Failed",
          result.data.message || "Failed to delete rent payment",
        );
      }
    } catch (error) {
      showAlert(
        "error",
        "Delete Failed",
        getErrorMessage(error, "Something went wrong"),
      );
    }
  };

  const statusBadgeStyle = {
    Paid: "bg-green-100 text-green-700",
    Due: "bg-orange-100 text-orange-700",
    Overdue: "bg-red-100 text-red-700",
  };

  const displayedLease = leases[leaseIndex] || null;

  const goPrevLease = () => {
    if (leases.length === 0) return;

    setLeaseIndex((prev) => (prev - 1 + leases.length) % leases.length);
  };

  const goNextLease = () => {
    if (leases.length === 0) return;

    setLeaseIndex((prev) => (prev + 1) % leases.length);
  };

  const buildLeaseFields = (lease) => [
    {
      label: "Property",
      value: lease.property,
    },
    {
      label: "Location",
      value: lease.location,
    },
    {
      label: "Property Owner",
      value: lease.propertyOwner,
    },
    {
      label: "Monthly Rent",
      value: `Rs. ${Number(lease.monthlyRent || 0).toLocaleString()}`,
    },
    {
      label: "Agreement Start Date",
      value: lease.agreementStartDate
        ? new Date(lease.agreementStartDate).toLocaleDateString()
        : "--",
    },
    {
      label: "Agreement End Date",
      value: lease.agreementEndDate
        ? new Date(lease.agreementEndDate).toLocaleDateString()
        : "--",
    },
    {
      label: "Security Deposit",
      value: `Rs. ${Number(lease.securityDeposit || 0).toLocaleString()}`,
    },
    {
      label: "Advance Paid",
      value: `Rs. ${Number(lease.advancePaid || 0).toLocaleString()}`,
    },
    {
      label: "Notice Period",
      value: lease.noticePeriod || "--",
    },
    {
      label: "Rent Increment",
      value: lease.rentIncrement || "--",
    },
    {
      label: "Status",
      value: "Active",
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex h-full min-h-[calc(100vh-4rem)] w-full max-w-[1400px] flex-col">
        {}

        <div className="mb-5 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rent</h2>

            <p className="text-sm text-gray-400">
              Manage your property rent and lease payments
            </p>
          </div>

          <button
            type="button"
            onClick={openAddLease}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Lease
          </button>
        </div>

        {}

        <div className="mb-5 grid shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
          {}

          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              📅
            </div>

            <div>
              <p className="text-xs text-gray-500">Monthly Rent</p>

              <h3 className="text-xl font-semibold">
                Rs. {activeLease?.monthlyRent?.toLocaleString?.() ?? "--"}
              </h3>
            </div>
          </div>

          {}

          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              📆
            </div>

            <div>
              <p className="text-xs text-gray-500">Next Due Date</p>

              <h3 className="text-xl font-semibold">
                {payments[0]?.dueDate
                  ? new Date(payments[0].dueDate).toLocaleDateString()
                  : "--"}
              </h3>
            </div>
          </div>

          {}

          <div className="flex items-center gap-3 rounded-xl bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              💰
            </div>

            <div>
              <p className="text-xs text-gray-500">Advance Paid</p>

              <h3 className="text-xl font-semibold">
                Rs. {activeLease?.advancePaid?.toLocaleString?.() ?? "--"}
              </h3>
            </div>
          </div>
        </div>

        {}

        <div className="mb-4 flex shrink-0 gap-6 border-b border-gray-200">
          {["Rent Payments", "Lease Details"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-sm ${
                activeTab === tab
                  ? "border-b-2 border-indigo-600 font-semibold text-indigo-600"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {}

        {activeTab === "Rent Payments" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Rent Payment History
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  {payments.length} payment
                  {payments.length !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={openAddPayment}
                className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
              >
                + Add Rent Payment
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Property / Location
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Rent Amount
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Due Date
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Paid Date
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Payment Method
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingPayments && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-center text-xs text-gray-400"
                      >
                        Loading payments...
                      </td>
                    </tr>
                  )}

                  {!loadingPayments && payments.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-center text-xs text-gray-400"
                      >
                        No rent payments yet.
                      </td>
                    </tr>
                  )}

                  {!loadingPayments &&
                    payments.map((payment, index) => (
                      <tr
                        key={payment._id}
                        className="border-b border-gray-50 text-center last:border-none"
                      >
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {activeLease?.property} / {activeLease?.location}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          Rs. {Number(payment.rentAmount).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {payment.dueDate
                            ? new Date(payment.dueDate).toLocaleDateString()
                            : "--"}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {payment.paidDate
                            ? new Date(payment.paidDate).toLocaleDateString()
                            : "--"}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {payment.paymentMethod}
                        </td>

                        {}

                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                              statusBadgeStyle[payment.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        {}

                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-center gap-5">
                            {}

                            <button
                              type="button"
                              onClick={() => openEditPayment(payment)}
                              className="cursor-pointer text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>

                            {}

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(payment._id)}
                              className="cursor-pointer text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Lease Information
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  {leases.length > 0
                    ? `Lease ${leaseIndex + 1} of ${leases.length}`
                    : "Current property lease details"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    displayedLease && openEditLease(displayedLease)
                  }
                  disabled={!displayedLease}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    displayedLease && handleDeleteLease(displayedLease)
                  }
                  disabled={!displayedLease}
                  className="rounded-lg border border-red-200 px-4 py-2 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>

            {loadingLease && (
              <p className="text-xs text-gray-400">Loading lease...</p>
            )}

            {!loadingLease && leases.length === 0 && (
              <p className="text-xs text-gray-400">
                No lease found. Click "+ Add Lease" above to create one.
              </p>
            )}

            {!loadingLease && displayedLease && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={goPrevLease}
                  disabled={leases.length <= 1}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous lease"
                >
                  ←
                </button>

                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                    {buildLeaseFields(displayedLease).map((detail) => (
                      <Detail
                        key={detail.label}
                        label={detail.label}
                        value={detail.value}
                      />
                    ))}
                  </div>

                  <div className="mt-8">
                    <p className="mb-2 text-xs text-gray-400">Notes</p>

                    <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                      {displayedLease.notes || "--"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goNextLease}
                  disabled={leases.length <= 1}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next lease"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}

        {}

        {showLeaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingLease ? "Edit Lease" : "Create Lease"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {editingLease
                      ? "Update this property's lease information"
                      : "Enter your property lease information"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeLeaseModal}
                  className="text-xl text-gray-400"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveLease}>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  <Input
                    label="Property"
                    name="Property"
                    onChange={handleChange}
                    value={leaseDetails.Property}
                    placeholder="e.g. Main Shop"
                    required
                  />

                  <Input
                    label="Location"
                    name="Location"
                    onChange={handleChange}
                    value={leaseDetails.Location}
                    placeholder="Enter location"
                    required
                  />

                  <Input
                    label="Property Owner"
                    name="PropertyOwner"
                    onChange={handleChange}
                    value={leaseDetails.PropertyOwner}
                    placeholder="Enter owner name"
                    required
                  />

                  <Input
                    label="Monthly Rent"
                    name="MonthlyRent"
                    onChange={handleChange}
                    value={leaseDetails.MonthlyRent}
                    type="number"
                    placeholder="0"
                    required
                  />

                  <Input
                    label="Agreement Start Date"
                    name="AgreementStartDate"
                    onChange={handleChange}
                    value={leaseDetails.AgreementStartDate}
                    type="date"
                    required
                  />

                  <Input
                    label="Agreement End Date"
                    name="AgreementEndDate"
                    onChange={handleChange}
                    value={leaseDetails.AgreementEndDate}
                    type="date"
                    required
                  />

                  <Input
                    label="Security Deposit"
                    name="SecurityDeposit"
                    onChange={handleChange}
                    value={leaseDetails.SecurityDeposit}
                    type="number"
                    placeholder="0"
                  />

                  <Input
                    label="Advance Paid"
                    name="AdvancePaid"
                    onChange={handleChange}
                    value={leaseDetails.AdvancePaid}
                    type="number"
                    placeholder="0"
                  />

                  <Input
                    label="Notice Period"
                    name="NoticePeriod"
                    onChange={handleChange}
                    value={leaseDetails.NoticePeriod}
                    placeholder="e.g. 2 Months"
                  />

                  <Input
                    label="Rent Increment"
                    name="RentIncrement"
                    onChange={handleChange}
                    value={leaseDetails.RentIncrement}
                    placeholder="e.g. 10% Every Year"
                  />

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Notes
                    </label>

                    <textarea
                      rows="3"
                      name="Notes"
                      onChange={handleChange}
                      value={leaseDetails.Notes}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                      placeholder="Additional lease notes"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t p-5">
                  <button
                    type="button"
                    onClick={closeLeaseModal}
                    className="rounded-md border px-5 py-2 text-xs text-gray-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-5 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    {editingLease ? "Update Lease" : "Create Lease"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {}

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingPayment ? "Edit Rent Payment" : "Add Rent Payment"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {editingPayment
                      ? "Update this rent payment record"
                      : "Record your rent payment"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="text-xl text-gray-400"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSavePayment}>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  {}

                  <Input
                    label="Rent Amount"
                    name="rentAmount"
                    onChange={handlePaymentChange}
                    value={paymentDetails.rentAmount}
                    type="number"
                    placeholder="50,000"
                    required
                  />

                  {}

                  <Input
                    label="Due Date"
                    name="dueDate"
                    onChange={handlePaymentChange}
                    value={paymentDetails.dueDate}
                    type="date"
                    required
                  />

                  {}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Payment Method
                    </label>

                    <select
                      name="paymentMethod"
                      value={paymentDetails.paymentMethod}
                      onChange={handlePaymentChange}
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Due">Due</option>

                      <option value="Cash">Cash</option>

                      <option value="Bank Transfer">Bank Transfer</option>

                      <option value="QR">QR</option>
                    </select>
                  </div>

                  {}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Status
                    </label>

                    <select
                      name="status"
                      value={paymentDetails.status}
                      onChange={handlePaymentChange}
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Due">Due</option>

                      <option value="Paid">Paid</option>

                      <option value="Overdue">Overdue</option>
                    </select>

                    <p className="mt-1 text-[10px] text-gray-400">
                      Select the current payment status.
                    </p>
                  </div>

                  {}

                  <Input
                    label="Paid Date"
                    name="paidDate"
                    onChange={handlePaymentChange}
                    value={paymentDetails.paidDate}
                    type="date"
                  />

                  {}

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Notes
                    </label>

                    <textarea
                      rows="3"
                      name="notes"
                      onChange={handlePaymentChange}
                      value={paymentDetails.notes}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t p-5">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="rounded-md border px-5 py-2 text-xs text-gray-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-5 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    {editingPayment ? "Update Payment" : "Add Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {}

        <AlertModal
          show={alertModal.show}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          onClose={closeAlert}
        />
      </div>
    </div>
  );
}

function AlertModal({ show, type = "success", title, message, onClose }) {
  if (!show) return null;

  const config = {
    success: {
      icon: "✓",
      iconBg: "bg-green-100",
      iconColor: "text-green-500",
      buttonBg: "bg-green-600 hover:bg-green-700",
    },

    error: {
      icon: "!",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },

    warning: {
      icon: "!",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-500",
      buttonBg: "bg-orange-500 hover:bg-orange-600",
    },
  };

  const { icon, iconBg, iconColor, buttonBg } = config[type] || config.success;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor} text-xl font-bold`}
          >
            {icon}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>

        <p className="mt-2 text-sm text-gray-500">{message}</p>

        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md px-6 py-2.5 text-sm font-medium text-white ${buttonBg}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-indigo-500 disabled:bg-gray-100"
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-400">{label}</p>

      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default RentLease;
