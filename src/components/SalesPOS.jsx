import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import SalesDetails from "./SalesDetails";

const MODAL_STYLES = {
  danger: {
    icon: "🗑",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    confirmBtn: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: "!",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmBtn: "bg-amber-500 hover:bg-amber-600",
  },
  info: {
    icon: "i",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    confirmBtn: "bg-indigo-600 hover:bg-indigo-700",
  },
};

function AppModal({ modalState, onClose }) {
  if (!modalState.open) return null;

  const style = MODAL_STYLES[modalState.variant] || MODAL_STYLES.info;

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-lg font-bold ${style.iconBg} ${style.iconColor}`}
          >
            {style.icon}
          </div>

          <div className="flex-1 pt-1">
            <h3 className="text-base font-semibold text-gray-900 m-0">
              {modalState.title}
            </h3>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
              {modalState.message}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-5 pt-4 flex justify-end gap-3">
          {modalState.showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              {modalState.cancelText || "Cancel"}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${style.confirmBtn}`}
          >
            {modalState.confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_MODAL_STATE = {
  open: false,
  title: "",
  message: "",
  variant: "info",
  confirmText: "OK",
  cancelText: "Cancel",
  showCancel: false,
  onConfirm: null,
};

const SalesPOS = ({ onSaleCompleted }) => {
  const [activeTab, setActiveTab] = useState("pos");
  const [selectedSale, setSelectedSale] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);

  const [paidBy, setPaidBy] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [note, setNote] = useState("Thank you!");

  const [productSearch, setProductSearch] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  const productSearchRef = useRef(null);

  const [isCompletingSale, setIsCompletingSale] = useState(false);

  const [modal, setModal] = useState(DEFAULT_MODAL_STATE);

  const closeModal = () => {
    setModal(DEFAULT_MODAL_STATE);
  };

  const showAlert = (message, opts = {}) => {
    const text = String(message || "");

    let variant = opts.variant;

    if (!variant) {
      if (
        /could not connect|server error|something went wrong|not returned/i.test(
          text,
        )
      ) {
        variant = "info";
      } else if (
        /out of stock|only .* unit|not enough stock|missing for|cannot be negative|cannot be greater|please pay|please select|please add/i.test(
          text,
        )
      ) {
        variant = "warning";
      } else {
        variant = "danger";
      }
    }

    setModal({
      ...DEFAULT_MODAL_STATE,
      open: true,
      title: opts.title || "Heads up",
      message: text,
      variant,
      confirmText: opts.confirmText || "OK",
      showCancel: false,
    });
  };

  const showConfirm = (
    title,
    message,
    onConfirm,
    { variant = "danger", confirmText = "Confirm" } = {},
  ) => {
    setModal({
      ...DEFAULT_MODAL_STATE,
      open: true,
      title,
      message,
      variant,
      confirmText,
      cancelText: "Cancel",
      showCancel: true,
      onConfirm,
    });
  };

  const CUSTOMER_API =
    "https://webglass-backhend.vercel.app/api/customeralldata";

  const INVENTORY_API =
    "https://webglass-backhend.vercel.app/api/inventoryalldata";

  const SALE_API = "https://webglass-backhend.vercel.app/api/sale";

  const getCustomers = async () => {
    try {
      const result = await axios.get(CUSTOMER_API);

      if (result.data.success) {
        setCustomers(result.data.customers || []);
      } else {
        setCustomers([]);

        showAlert(result.data.message || "Failed to get customers", {
          title: "Couldn't load customers",
        });
      }
    } catch (error) {
      console.error("Error getting customers:", error);

      if (error.response) {
        showAlert(
          error.response.data.message || "Server error while getting customers",
          {
            title: "Couldn't load customers",
            variant: "info",
          },
        );
      } else if (error.request) {
        showAlert("Could not connect to the server.", {
          title: "Connection error",
          variant: "info",
        });
      } else {
        showAlert("Something went wrong.", {
          variant: "info",
        });
      }
    }
  };

  const getInventory = async () => {
    try {
      const result = await axios.get(INVENTORY_API);

      if (result.data.success) {
        const inventoryData =
          result.data.in ||
          result.data.inventory ||
          result.data.inventories ||
          result.data.data ||
          [];

        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      } else {
        setInventory([]);

        showAlert(result.data.message || "Failed to get inventory", {
          title: "Couldn't load inventory",
        });
      }
    } catch (error) {
      console.error("Error getting inventory:", error);

      if (error.response) {
        showAlert(
          error.response.data.message || "Server error while getting inventory",
          {
            title: "Couldn't load inventory",
            variant: "info",
          },
        );
      } else if (error.request) {
        showAlert("Could not connect to the server.", {
          title: "Connection error",
          variant: "info",
        });
      } else {
        showAlert("Something went wrong.", {
          variant: "info",
        });
      }
    }
  };

  useEffect(() => {
    getCustomers();
    getInventory();
  }, []);

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;

    const customer = customers.find((item) => item._id === customerId);

    setSelectedCustomer(customer || null);
    setShowCustomerDetails(false);
  };

  const getProductPrice = (product) => {
    const possiblePrices = [
      product.SellingPrice,
      product.sellingPrice,
      product.SalePrice,
      product.salePrice,
      product.Price,
      product.price,
      product.UnitPrice,
      product.unitPrice,
      product.Selling_Price,
      product.selling_price,
    ];

    const foundPrice = possiblePrices.find(
      (value) => value !== undefined && value !== null && value !== "",
    );

    return Number(foundPrice || 0);
  };

  const getProductCostPrice = (product) => {
    const possibleCosts = [
      product.CostPrice,
      product.costPrice,
      product.Cost_Price,
      product.cost_price,
    ];

    const foundCost = possibleCosts.find(
      (value) => value !== undefined && value !== null && value !== "",
    );

    return Number(foundCost || 0);
  };

  const getProductSku = (product) => {
    return (
      product.SKU ||
      product.Sku ||
      product.sku ||
      product.Barcode ||
      product.barcode ||
      product._id ||
      ""
    );
  };

  const filteredProducts = useMemo(() => {
    const search = productSearch.toLowerCase().trim();

    if (!search) {
      return inventory;
    }

    return inventory.filter((product) => {
      return (
        String(product.ProductName || "")
          .toLowerCase()
          .includes(search) ||
        String(product.Category || "")
          .toLowerCase()
          .includes(search) ||
        String(product.Brand || "")
          .toLowerCase()
          .includes(search) ||
        String(getProductSku(product)).toLowerCase().includes(search) ||
        String(product._id || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [inventory, productSearch]);

  const handleAddProductClick = () => {
    setProductSearch("");
    setShowProductResults(true);

    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 0);
  };

  const handleSelectProduct = (product) => {
    const stock = Number(product.Stock || 0);

    if (stock <= 0) {
      showAlert(`${product.ProductName} is out of stock.`, {
        title: "Out of stock",
        variant: "warning",
      });

      return;
    }

    const existingItem = items.find((item) => item.inventoryId === product._id);

    const price = getProductPrice(product);
    const costPrice = getProductCostPrice(product);

    if (existingItem) {
      if (existingItem.qty >= stock) {
        showAlert(
          `Only ${stock} unit(s) of ${product.ProductName} are available.`,
          {
            title: "Not enough stock",
            variant: "warning",
          },
        );

        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.inventoryId !== product._id) {
            return item;
          }

          const newQty = item.qty + 1;

          return {
            ...item,
            qty: newQty,
            stock,
            amount: newQty * item.price * (1 - item.discount / 100),
          };
        }),
      );
    } else {
      const newItem = {
        id: Date.now(),
        inventoryId: product._id,
        name: product.ProductName || "Unnamed Product",
        sku: getProductSku(product),
        details: `${product.Brand || ""}${
          product.Category ? ` / ${product.Category}` : ""
        }`,
        qty: 1,
        price,
        costPrice,
        discount: 0,
        amount: price,
        stock,
      };

      setItems((prevItems) => [...prevItems, newItem]);
    }

    setProductSearch("");
    setShowProductResults(false);
  };

  const handleRemoveItem = (itemId) => {
    const item = items.find((i) => i.id === itemId);

    if (!item) return;

    showConfirm(
      "Remove item?",
      `This will remove ${item.name} from the sale. This action can't be undone.`,
      () => {
        setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
      },
      {
        variant: "danger",
        confirmText: "Remove Item",
      },
    );
  };

  const handleQuantityChange = (itemId, newQty) => {
    let qty = Number(newQty);

    if (!Number.isFinite(qty)) {
      return;
    }

    qty = Math.floor(qty);

    if (qty < 1) {
      qty = 1;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (item.inventoryId && qty > item.stock) {
          showAlert(
            `Only ${item.stock} unit(s) of ${item.name} are available.`,
            {
              title: "Not enough stock",
              variant: "warning",
            },
          );

          qty = item.stock;
        }

        return {
          ...item,
          qty,
          amount: qty * item.price * (1 - item.discount / 100),
        };
      }),
    );
  };

  const handleDiscountChange = (itemId, newDiscount) => {
    let discount = Number(newDiscount);

    if (!Number.isFinite(discount)) {
      discount = 0;
    }

    if (discount < 0) {
      discount = 0;
    }

    if (discount > 100) {
      discount = 100;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          discount,
          amount: item.qty * item.price * (1 - discount / 100),
        };
      }),
    );
  };

  const subTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);
  }, [items]);

  const discount = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.qty * item.price * (item.discount / 100),
      0,
    );
  }, [items]);

  const totalCost = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.qty * (item.costPrice || 0),
      0,
    );
  }, [items]);

  const taxableAmount = subTotal - discount;

  const total = Math.round(taxableAmount);

  const roundOff = total - taxableAmount;

  const profit = taxableAmount - totalCost;

  const numericAmountPaid = Number(String(amountPaid).replace(/,/g, "")) || 0;

  const amountDue = Math.max(total - numericAmountPaid, 0);

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const handlePaymentMethodChange = (method) => {
    setPaidBy(method);

    if (method === "Due") {
      setAmountPaid("0");
    } else {
      setAmountPaid(String(total));
    }
  };

  const resetSaleForm = () => {
    setItems([]);
    setSelectedCustomer(null);
    setPaidBy("Cash");
    setAmountPaid("");
    setNote("Thank you!");
    setProductSearch("");
    setShowProductResults(false);
    setShowCustomerDetails(false);
  };

  const handleCancelClick = () => {
    if (items.length === 0 && !selectedCustomer) {
      resetSaleForm();
      return;
    }

    showConfirm(
      "Cancel this sale?",
      "This will clear all items, the selected customer, and payment details. This action can't be undone.",
      resetSaleForm,
      {
        variant: "danger",
        confirmText: "Cancel Sale",
      },
    );
  };

  const handleCompleteSale = async () => {
    if (isCompletingSale) {
      return;
    }

    if (!selectedCustomer) {
      showAlert("Please select a customer before completing the sale.", {
        title: "Customer required",
        variant: "warning",
      });

      return;
    }

    if (items.length === 0) {
      showAlert("Please add at least one product.", {
        title: "No items added",
        variant: "warning",
      });

      return;
    }

    const productsWithoutPrice = items.filter((item) => item.price <= 0);

    if (productsWithoutPrice.length > 0) {
      showAlert(
        `Selling price is missing for:\n\n${productsWithoutPrice
          .map((item) => item.name)
          .join("\n")}`,
        {
          title: "Missing selling price",
          variant: "warning",
        },
      );

      return;
    }

    if (numericAmountPaid < 0) {
      showAlert("Amount paid cannot be negative.", {
        title: "Invalid amount",
        variant: "warning",
      });

      return;
    }

    if (paidBy !== "Due" && numericAmountPaid < total) {
      showAlert(
        `Please pay the full amount of Rs. ${formatMoney(
          total,
        )} for ${paidBy}.`,
        {
          title: "Payment incomplete",
          variant: "warning",
        },
      );

      return;
    }

    if (numericAmountPaid > total) {
      showAlert("Amount paid cannot be greater than the total amount.", {
        title: "Invalid amount",
        variant: "warning",
      });

      return;
    }

    for (const item of items) {
      const currentProduct = inventory.find(
        (product) => product._id === item.inventoryId,
      );

      if (!currentProduct) {
        showAlert(`${item.name} could not be found in inventory.`, {
          title: "Item not found",
          variant: "warning",
        });

        return;
      }

      const currentStock = Number(currentProduct.Stock || 0);

      if (currentStock < item.qty) {
        showAlert(
          `Not enough stock for ${item.name}.\n\nAvailable: ${currentStock}\nRequired: ${item.qty}`,
          {
            title: "Not enough stock",
            variant: "warning",
          },
        );

        return;
      }
    }

    setIsCompletingSale(true);

    try {
      for (const item of items) {
        await axios.patch(
          `https://webglass-backhend.vercel.app/api/inventory/${item.inventoryId}/adjust-stock`,
          {
            amount: -item.qty,
          },
        );
      }

      const salePayload = {
        customerId: selectedCustomer._id,

        items: items.map((item) => ({
          inventoryId: item.inventoryId,
          name: item.name,
          details: item.details || "",
          qty: item.qty,
          price: item.price,
          costPrice: item.costPrice || 0,
          discount: item.discount || 0,
          amount: item.amount,
        })),

        subTotal,
        discount,
        roundOff,
        total,
        totalCost,
        profit,
        paidBy,
        amountPaid: numericAmountPaid,
        amountDue,
        note,
      };

      const saleResponse = await axios.post(SALE_API, salePayload);

      if (!saleResponse.data.success) {
        throw new Error(saleResponse.data.message || "Failed to create sale");
      }

      const createdSale = saleResponse.data.sale;

      if (!createdSale) {
        throw new Error(
          "Sale was created but sale data was not returned by server.",
        );
      }

      await getInventory();
      await getCustomers();

      resetSaleForm();

      setSelectedSale(createdSale);

      setActiveTab("details");

      if (onSaleCompleted) {
        onSaleCompleted(createdSale);
      }
    } catch (error) {
      console.error("Error completing sale:", error);

      if (error.response) {
        showAlert(
          error.response.data.message || "Server error while completing sale",
          {
            title: "Sale failed",
            variant: "danger",
          },
        );
      } else if (error.request) {
        showAlert("Could not connect to the server.", {
          title: "Connection error",
          variant: "info",
        });
      } else {
        showAlert(
          error.message || "Something went wrong while completing the sale.",
          {
            title: "Sale failed",
            variant: "danger",
          },
        );
      }
    } finally {
      setIsCompletingSale(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-8">
      <AppModal modalState={modal} onClose={closeModal} />

      <div className="max-w-[1400px] mx-auto">
        {}

        <div className="bg-white rounded-xl px-5 mb-6">
          <div className="flex items-center gap-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("pos")}
              className={`relative px-2 py-4 text-sm font-medium transition ${
                activeTab === "pos"
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sales POS
              {activeTab === "pos" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`relative px-2 py-4 text-sm font-medium transition ${
                activeTab === "details"
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sales Details
              {activeTab === "details" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {}

        {activeTab === "pos" && (
          <>
            {}

            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-bold m-0">Sales POS</h2>
              </div>
            </div>

            {}

            <div className="relative">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6">
                <span>🔍</span>

                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductResults(true);
                  }}
                  onFocus={() => setShowProductResults(true)}
                  placeholder="Search by Product"
                  className="flex-1 outline-none text-sm"
                />
              </div>

              {showProductResults && filteredProducts.length > 0 && (
                <div className="absolute z-50 top-[55px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const stock = Number(product.Stock || 0);

                    const price = getProductPrice(product);

                    return (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {product.ProductName}
                          </p>

                          <p className="text-xs text-gray-400">
                            {product.Brand || "No Brand"}

                            {product.Category ? ` • ${product.Category}` : ""}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            SKU: {getProductSku(product)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">
                            Rs. {formatMoney(price)}
                          </p>

                          <p
                            className={`text-xs font-semibold ${
                              stock <= 0 ? "text-red-500" : "text-green-600"
                            }`}
                          >
                            Stock: {stock}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {showProductResults &&
                productSearch &&
                filteredProducts.length === 0 && (
                  <div className="absolute z-50 top-[55px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-5 text-center">
                    <p className="text-sm text-gray-500">No products found.</p>
                  </div>
                )}
            </div>

            {}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {}

              <div className="lg:col-span-2 space-y-6">
                {}

                <div className="bg-white rounded-xl p-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-2">Customer</p>

                      <select
                        value={selectedCustomer?._id || ""}
                        onChange={handleCustomerChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      >
                        <option value="">Select Customer</option>

                        {customers.map((customer) => (
                          <option key={customer._id} value={customer._id}>
                            {customer.Name} - {customer.PhoneNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => setShowCustomerDetails((prev) => !prev)}
                        className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                      >
                        {showCustomerDetails
                          ? "Hide Customer Details"
                          : "Customer Details"}
                      </button>
                    )}
                  </div>

                  {}

                  {selectedCustomer && showCustomerDetails && (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <h3 className="font-semibold text-sm mb-4">
                        Customer Details
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Name</p>

                          <p className="text-sm font-medium mt-1">
                            {selectedCustomer.Name}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">Mobile</p>

                          <p className="text-sm font-medium mt-1">
                            {selectedCustomer.PhoneNumber || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">Email</p>

                          <p className="text-sm font-medium mt-1">
                            {selectedCustomer.Email || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Total Purchases
                          </p>

                          <p className="text-sm font-medium mt-1">
                            Rs.{" "}
                            {formatMoney(selectedCustomer.TotalPurchases || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {}

                <div className="bg-white rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Items</h3>

                    <span className="text-xs text-gray-400">
                      {items.length} {items.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    {items.length === 0 ? (
                      <div className="border border-dashed border-gray-200 rounded-lg py-12 text-center">
                        <div className="text-3xl mb-3">🛒</div>

                        <p className="text-sm text-gray-500">
                          No products added
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Search for a product above or click Add Product
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-center">
                            <th className="pb-2 font-medium">Product</th>

                            <th className="pb-2 font-medium">Details</th>

                            <th className="pb-2 font-medium">Stock</th>

                            <th className="pb-2 font-medium">Qty</th>

                            <th className="pb-2 font-medium">Cost</th>

                            <th className="pb-2 font-medium">Sell</th>

                            <th className="pb-2 font-medium">Discount</th>

                            <th className="pb-2 font-medium">Amount</th>

                            <th />
                          </tr>
                        </thead>

                        <tbody>
                          {items.map((item, index) => (
                            <tr
                              key={item.id}
                              className="border-t text-center border-gray-100"
                            >
                              <td className="py-3 pr-3">
                                <p className="font-medium m-0">{item.name}</p>

                                <p className="text-xs text-gray-400 m-0">
                                  SKU: {item.sku}
                                </p>
                              </td>

                              <td className="py-3 pr-3 text-gray-500 text-xs">
                                {item.details || "-"}
                              </td>

                              <td className="py-3 pr-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    Number(item.stock) <= 0
                                      ? "bg-red-100 text-red-600"
                                      : "bg-green-100 text-green-600"
                                  }`}
                                >
                                  {item.stock}
                                </span>
                              </td>

                              <td className="py-3 pr-3">
                                <input
                                  type="number"
                                  min="1"
                                  max={item.stock}
                                  value={item.qty}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      e.target.value,
                                    )
                                  }
                                  className="w-16 border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                                />
                              </td>

                              <td className="py-3 pr-3 whitespace-nowrap text-gray-500">
                                Rs. {formatMoney(item.costPrice || 0)}
                              </td>

                              <td className="py-3 pr-3 whitespace-nowrap">
                                Rs. {formatMoney(item.price)}
                              </td>

                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.discount}
                                    onChange={(e) =>
                                      handleDiscountChange(
                                        item.id,
                                        e.target.value,
                                      )
                                    }
                                    className="w-14 border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                                  />

                                  <span>%</span>
                                </div>
                              </td>

                              <td className="py-3 pr-3 font-medium whitespace-nowrap">
                                Rs. {formatMoney(item.amount)}
                              </td>

                              <td className="py-3">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  🗑
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <button
                      type="button"
                      onClick={handleAddProductClick}
                      className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                    >
                      + Add Product
                    </button>

                    <span className="text-xs text-gray-400">
                      {items.length} Items
                    </span>
                  </div>
                </div>
              </div>

              {}

              <div className="bg-white rounded-xl p-5 h-fit space-y-5">
                <h3 className="font-semibold">Summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Sub Total</span>

                    <span className="text-gray-800">
                      Rs. {formatMoney(subTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500">
                    <span>Discount</span>

                    <span className="text-gray-800">
                      Rs. {formatMoney(discount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500">
                    <span>Round Off</span>

                    <span className="text-gray-800">
                      Rs. {formatMoney(roundOff)}
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
                    <span>Total Amount</span>

                    <span className="text-indigo-600">
                      Rs. {formatMoney(total)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500 pt-2 border-t border-gray-100">
                    <span>Total Cost</span>

                    <span className="text-gray-800">
                      Rs. {formatMoney(totalCost)}
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold">
                    <span>Profit</span>

                    <span
                      className={
                        profit >= 0 ? "text-green-600" : "text-red-500"
                      }
                    >
                      Rs. {formatMoney(profit)}
                    </span>
                  </div>
                </div>

                {}

                <div>
                  <p className="text-xs text-gray-400 mb-2">Paid By</p>

                  <div className="grid grid-cols-3 gap-2">
                    {["Cash", "QR", "Due"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handlePaymentMethodChange(method)}
                        className={`text-sm py-2.5 rounded-lg border transition ${
                          paidBy === method
                            ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {}

                <div>
                  <p className="text-xs text-gray-400 mb-2">Amount Paid</p>

                  <input
                    type="number"
                    min="0"
                    max={total}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="Enter amount paid"
                  />

                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-400">Due Amount</span>

                    <span
                      className={
                        amountDue > 0
                          ? "text-red-500 font-medium"
                          : "text-green-600 font-medium"
                      }
                    >
                      Rs. {formatMoney(amountDue)}
                    </span>
                  </div>
                </div>

                {}

                <div>
                  <p className="text-xs text-gray-400 mb-2">Note</p>

                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="Add a note"
                  />
                </div>

                {}

                <button
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={isCompletingSale || items.length === 0}
                  className={`w-full text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    isCompletingSale || items.length === 0
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isCompletingSale ? "Processing..." : "Complete Sale"}

                  {!isCompletingSale && (
                    <span className="text-xs opacity-70">F4</span>
                  )}
                </button>

                {}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="flex-1 bg-red-600 border border-gray-200 py-2.5 rounded-lg text-sm text-white hover:bg-red-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {}

        {activeTab === "details" && (
          <div className="w-full">
            <SalesDetails sale={selectedSale} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPOS;
