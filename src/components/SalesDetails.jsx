import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SALES_API = "https://webglass-backhend.vercel.app/api/salesalldata";
const DELETE_SALE_API = "https://webglass-backhend.vercel.app/api/sale";

function SalesDetails({ onBack, onNewSale }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const getAllSales = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(SALES_API);

      if (response.data.success) {
        setSales(response.data.sales || []);
      } else {
        setSales([]);
        setError(response.data.message || "Failed to load sales.");
      }
    } catch (err) {
      console.error("Error getting sales:", err);

      if (err.response) {
        setError(
          err.response.data.message || "Server error while loading sales.",
        );
      } else if (err.request) {
        setError("Could not connect to the server.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sale?\n\nThis action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(saleId);
      setError("");

      const response = await axios.delete(`${DELETE_SALE_API}/${saleId}`);

      if (response.data.success) {
        setSales((prevSales) =>
          prevSales.filter((sale) => sale._id !== saleId),
        );
      } else {
        setError(response.data.message || "Failed to delete sale.");
      }
    } catch (err) {
      console.error("Error deleting sale:", err);

      if (err.response) {
        setError(err.response.data.message || "Failed to delete sale.");
      } else if (err.request) {
        setError("Could not connect to the server.");
      } else {
        setError("Something went wrong while deleting the sale.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    getAllSales();
  }, []);

  const filteredSales = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return sales;
    }

    return sales.filter((sale) => {
      const customerName = String(sale.Customer?.Name || "").toLowerCase();

      const phoneNumber = String(
        sale.Customer?.PhoneNumber || "",
      ).toLowerCase();

      const invoiceNumber = String(sale.InvoiceNumber || "").toLowerCase();

      return (
        customerName.includes(value) ||
        phoneNumber.includes(value) ||
        invoiceNumber.includes(value)
      );
    });
  }, [sales, search]);

  const exportToExcel = () => {
    if (filteredSales.length === 0) {
      setError("There are no sales to export.");
      return;
    }

    try {
      setExporting(true);
      setError("");

      const excelData = filteredSales.map((sale, index) => ({
        "#": index + 1,
        "Invoice Number": sale.InvoiceNumber || "-",
        "Sale Date": sale.createdAt
          ? new Date(sale.createdAt).toLocaleString("en-IN")
          : "-",
        "Customer Name": sale.Customer?.Name || "-",
        "Phone Number": sale.Customer?.PhoneNumber || "-",
        Email: sale.Customer?.Email || "-",

        "Sub Total": Number(sale.SubTotal || 0),
        Discount: Number(sale.Discount || 0),
        Tax: Number(sale.Tax || 0),
        "Round Off": Number(sale.RoundOff || 0),
        Total: Number(sale.Total || 0),

        "Paid By": sale.PaidBy || "-",
        "Amount Paid": Number(sale.AmountPaid || 0),
        "Amount Due": Number(sale.AmountDue || 0),

        Note: sale.Note || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 22 },
        { wch: 25 },
        { wch: 18 },
        { wch: 30 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 30 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

      const today = new Date().toISOString().split("T")[0];

      XLSX.writeFile(workbook, `Sales_Report_${today}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      setError("Failed to export sales to Excel.");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    if (filteredSales.length === 0) {
      setError("There are no sales to export.");
      return;
    }

    try {
      setExporting(true);
      setError("");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const today = new Date().toLocaleDateString("en-IN");

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Sales Report", 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      doc.text(`Generated: ${today}`, 14, 22);

      doc.text(`Total Sales: ${filteredSales.length}`, 14, 27);

      if (search.trim()) {
        doc.text(`Search: ${search}`, 14, 32);
      }

      const tableStartY = search.trim() ? 38 : 33;

      const tableData = filteredSales.map((sale, index) => {
        const customer = sale.Customer || {};

        return [
          index + 1,
          sale.InvoiceNumber || "-",

          sale.createdAt
            ? new Date(sale.createdAt).toLocaleDateString("en-IN")
            : "-",

          customer.Name || "-",
          customer.PhoneNumber || "-",

          `Rs. ${formatMoney(sale.SubTotal)}`,

          `Rs. ${formatMoney(sale.Discount)}`,

          `Rs. ${formatMoney(sale.Tax)}`,

          `Rs. ${formatMoney(sale.Total)}`,

          sale.PaidBy || "-",

          `Rs. ${formatMoney(sale.AmountPaid)}`,

          `Rs. ${formatMoney(sale.AmountDue)}`,
        ];
      });

      autoTable(doc, {
        startY: tableStartY,

        head: [
          [
            "#",
            "Invoice",
            "Date",
            "Customer",
            "Phone",
            "Sub Total",
            "Discount",
            "Tax",
            "Total",
            "Paid By",
            "Paid",
            "Due",
          ],
        ],

        body: tableData,

        theme: "grid",

        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: "linebreak",
        },

        headStyles: {
          fontSize: 7,
          fontStyle: "bold",
        },

        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 25 },
          2: { cellWidth: 22 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 24 },
          6: { cellWidth: 22 },
          7: { cellWidth: 20 },
          8: { cellWidth: 24 },
          9: { cellWidth: 20 },
          10: { cellWidth: 24 },
          11: { cellWidth: 24 },
        },

        margin: {
          left: 10,
          right: 10,
        },
      });

      const totalSubTotal = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.SubTotal || 0),
        0,
      );

      const totalDiscount = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.Discount || 0),
        0,
      );

      const totalTax = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.Tax || 0),
        0,
      );

      const grandTotal = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.Total || 0),
        0,
      );

      const totalPaid = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.AmountPaid || 0),
        0,
      );

      const totalDue = filteredSales.reduce(
        (sum, sale) => sum + Number(sale.AmountDue || 0),
        0,
      );

      let finalY = doc.lastAutoTable?.finalY || 40;

      finalY += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");

      doc.text(`Sub Total: Rs. ${formatMoney(totalSubTotal)}`, 14, finalY);

      doc.text(`Discount: Rs. ${formatMoney(totalDiscount)}`, 70, finalY);

      doc.text(`Tax: Rs. ${formatMoney(totalTax)}`, 130, finalY);

      doc.text(`Grand Total: Rs. ${formatMoney(grandTotal)}`, 180, finalY);

      finalY += 7;

      doc.text(`Amount Paid: Rs. ${formatMoney(totalPaid)}`, 14, finalY);

      doc.text(`Amount Due: Rs. ${formatMoney(totalDue)}`, 80, finalY);

      const pageCount = doc.internal.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);

        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");

        doc.text(`Page ${page} of ${pageCount}`, 14, pageHeight - 8);

        doc.text("Sales Report", 250, pageHeight - 8);
      }

      const todayFileName = new Date().toISOString().split("T")[0];

      doc.save(`Sales_Report_${todayFileName}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      setError("Failed to export sales to PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-xl p-10 text-center">
            <p className="text-sm text-gray-500">Loading sales...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && sales.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-xl p-10 text-center">
            <p className="text-red-500 text-sm">{error}</p>

            <div className="flex justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={getAllSales}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-700"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={onBack}
                className="border border-gray-200 bg-white px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <div>
            <h2 className="text-2xl font-bold">Sales Details</h2>

            <p className="text-sm text-gray-400 mt-1">
              View and manage all completed sales
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportToExcel}
              disabled={exporting || filteredSales.length === 0}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-file-excel" />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>

            <button
              type="button"
              onClick={exportToPDF}
              disabled={exporting || filteredSales.length === 0}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-file-pdf" />
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>

        {error && sales.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="fa-solid fa-magnifying-glass" />
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name, phone number or invoice..."
                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="border border-gray-200 rounded-lg px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex justify-between mt-3">
            <p className="text-xs text-gray-400">
              Showing {filteredSales.length} of {sales.length} sales
            </p>

            {search && (
              <p className="text-xs text-indigo-500">
                Export will use the filtered results
              </p>
            )}
          </div>
        </div>

        {sales.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">🧾</div>

            <p className="text-sm text-gray-500">No sales found.</p>

            <button
              type="button"
              onClick={onNewSale}
              className="mt-5 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-700"
            >
              + Create New Sale
            </button>
          </div>
        )}

        {sales.length > 0 && filteredSales.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>

            <p className="text-sm text-gray-500">No matching sales found.</p>

            <p className="text-xs text-gray-400 mt-1">
              Try another customer name, phone number or invoice number.
            </p>
          </div>
        )}

        {}
        {filteredSales.length > 0 && (
          <div
            className="space-y-6 overflow-y-auto pr-2"
            style={{
              maxHeight: "calc(100vh - 260px)",
            }}
          >
            {filteredSales.map((sale) => {
              const items = Array.isArray(sale.Items) ? sale.Items : [];

              const customer = sale.Customer || {};

              return (
                <div key={sale._id} className="bg-white rounded-xl p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 pb-5 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Invoice Number</p>

                      <h3 className="text-lg font-semibold mt-1">
                        {sale.InvoiceNumber || "-"}
                      </h3>

                      <p className="text-xs text-gray-400 mt-2">
                        Sale ID: {sale._id}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Sale Date</p>

                        <p className="text-sm font-medium mt-1">
                          {sale.createdAt
                            ? new Date(sale.createdAt).toLocaleString("en-IN")
                            : "-"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteSale(sale._id)}
                        disabled={deletingId === sale._id}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {deletingId === sale._id ? (
                          "Deleting..."
                        ) : (
                          <i className="fa-solid fa-trash" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="py-5 border-b border-gray-100">
                    <h3 className="font-semibold mb-4">Customer</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <p className="text-xs text-gray-400">Name</p>

                        <p className="text-sm font-medium mt-1">
                          {customer.Name || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Phone</p>

                        <p className="text-sm font-medium mt-1">
                          {customer.PhoneNumber || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Email</p>

                        <p className="text-sm font-medium mt-1">
                          {customer.Email || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-5 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-semibold">Sold Items</h3>

                      <span className="text-xs text-gray-400">
                        {items.length} {items.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      {items.length === 0 ? (
                        <div className="border border-dashed border-gray-200 rounded-lg py-8 text-center">
                          <p className="text-sm text-gray-400">
                            No items found.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-left text-gray-400">
                              <th className="pb-3">#</th>

                              <th className="pb-3">Product</th>

                              <th className="pb-3">Details</th>

                              <th className="pb-3">Qty</th>

                              <th className="pb-3">Price</th>

                              <th className="pb-3">Discount</th>

                              <th className="pb-3 text-right">Amount</th>
                            </tr>
                          </thead>

                          <tbody>
                            {items.map((item, index) => (
                              <tr
                                key={`${sale._id}-${index}`}
                                className="border-b border-gray-50"
                              >
                                <td className="py-4">{index + 1}</td>

                                <td className="py-4">
                                  <p className="font-medium">
                                    {item.name || "-"}
                                  </p>
                                </td>

                                <td className="py-4 text-xs text-gray-500">
                                  {item.details || "-"}
                                </td>

                                <td className="py-4">{item.qty ?? 0}</td>

                                <td className="py-4 whitespace-nowrap">
                                  Rs. {formatMoney(item.price)}
                                </td>

                                <td className="py-4">{item.discount ?? 0}%</td>

                                <td className="py-4 text-right font-medium whitespace-nowrap">
                                  Rs. {formatMoney(item.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
                    <div>
                      <h3 className="font-semibold mb-5">Payment Summary</h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-gray-500">
                          <span>Sub Total</span>

                          <span className="text-gray-800">
                            Rs. {formatMoney(sale.SubTotal)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-500">
                          <span>Discount</span>

                          <span className="text-gray-800">
                            Rs. {formatMoney(sale.Discount)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-500">
                          <span>Tax</span>

                          <span className="text-gray-800">
                            Rs. {formatMoney(sale.Tax)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-500">
                          <span>Round Off</span>

                          <span className="text-gray-800">
                            Rs. {formatMoney(sale.RoundOff)}
                          </span>
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-base">
                          <span>Total</span>

                          <span className="text-indigo-600">
                            Rs. {formatMoney(sale.Total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-5">Payment</h3>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Paid By</span>

                          <span className="text-sm font-medium">
                            {sale.PaidBy || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">
                            Amount Paid
                          </span>

                          <span className="text-sm font-medium text-green-600">
                            Rs. {formatMoney(sale.AmountPaid)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">
                            Amount Due
                          </span>

                          <span
                            className={`text-sm font-medium ${
                              Number(sale.AmountDue) > 0
                                ? "text-red-500"
                                : "text-green-600"
                            }`}
                          >
                            Rs. {formatMoney(sale.AmountDue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {sale.Note && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <h3 className="font-semibold mb-3">Note</h3>

                      <p className="text-sm text-gray-500">{sale.Note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesDetails;
