import axios from "axios";
import { useEffect, useState } from "react";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
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

const LOW_STOCK_THRESHOLD = 5;

const emptyInventory = {
  productname: "",
  category: "",
  brand: "",
  costprice: "",
  sellingprice: "",
  stock: "",
};

const API_URL = "https://webglass-backhend.vercel.app/api";

// Images are now served from Mongo via a dedicated route (see backend),
// keyed by product _id, instead of a static /uploads/<filename> path.
const productImageUrl = (product) =>
  product?.ImageContentType
    ? `${API_URL}/inventory/image/${product._id}`
    : null;

const Inventory = () => {
  const [showModal, setShowModal] = useState(false);
  const [inventories, setInventories] = useState([]);
  const [editingInventory, setEditingInventory] = useState(null);
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState(emptyInventory);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState(DEFAULT_MODAL_STATE);

  const closeModal = () => {
    setModal(DEFAULT_MODAL_STATE);
  };

  const showAlert = (message, opts = {}) => {
    setModal({
      ...DEFAULT_MODAL_STATE,
      open: true,
      title: opts.title || "Heads up",
      message: String(message || ""),
      variant: opts.variant || "info",
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

  const getInventory = async () => {
    try {
      setLoading(true);

      const result = await axios.get(`${API_URL}/inventoryalldata`);

      if (result.data.success) {
        setInventories(Array.isArray(result.data.data) ? result.data.data : []);
      } else {
        setInventories([]);

        showAlert(result.data.message || "Failed to get inventory", {
          title: "Couldn't load inventory",
          variant: "info",
        });
      }
    } catch (error) {
      console.error("Error getting inventory:", error);

      showAlert(
        error.response?.data?.message || "Could not connect to the server",
        {
          title: "Connection error",
          variant: "info",
        },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInventory();
  }, []);

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setInventory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jfif"];

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".jfif"];

    const extension = "." + file.name.split(".").pop().toLowerCase();

    const typeOk = allowedTypes.includes(file.type);
    const extensionOk = allowedExtensions.includes(extension);

    if (!typeOk && !extensionOk) {
      showAlert("Only JPG, JPEG, PNG and JFIF images are allowed", {
        title: "Unsupported file type",
        variant: "warning",
      });

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Image size must be less than 5MB", {
        title: "Image too large",
        variant: "warning",
      });

      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddInventory = () => {
    setEditingInventory(null);

    setInventory({
      ...emptyInventory,
    });

    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingInventory(product);

    setInventory({
      productname: product.ProductName || "",
      category: product.Category || "",
      brand: product.Brand || "",
      costprice: product.CostPrice ?? "",
      sellingprice: product.SellingPrice ?? "",
      stock: product.Stock ?? 0,
    });

    setImageFile(null);

    // Pull the existing image from the backend via the product's id,
    // instead of a static /uploads/<filename> path.
    setImagePreview(productImageUrl(product));

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInventory(null);

    setInventory({
      ...emptyInventory,
    });

    setImageFile(null);
    setImagePreview(null);
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    if (
      inventory.stock === "" ||
      Number(inventory.stock) < 0 ||
      !Number.isFinite(Number(inventory.stock))
    ) {
      showAlert("Please enter a valid stock quantity (0 or more).", {
        title: "Invalid stock",
        variant: "warning",
      });

      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("ProductName", inventory.productname);

      formData.append("Category", inventory.category);

      formData.append("Brand", inventory.brand);

      formData.append("CostPrice", inventory.costprice);

      formData.append("SellingPrice", inventory.sellingprice);

      formData.append("Stock", inventory.stock);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let result;

      if (editingInventory) {
        result = await axios.put(
          `${API_URL}/inventory/${editingInventory._id}`,
          formData,
        );
      } else {
        result = await axios.post(`${API_URL}/inventory`, formData);
      }

      if (result.data.success) {
        showAlert(
          editingInventory
            ? "Product updated successfully"
            : "Product added successfully",
          {
            title: "Saved",
            variant: "info",
            confirmText: "Great",
          },
        );

        handleCloseModal();

        await getInventory();
      } else {
        showAlert(result.data.message || "Operation failed", {
          title: "Couldn't save product",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error saving product:", error);

      showAlert(
        error.response?.data?.message ||
          "Something went wrong while saving product",
        {
          title: "Couldn't save product",
          variant: "danger",
        },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    showConfirm(
      "Delete product?",
      `This will permanently remove ${product.ProductName} from your inventory. This action can't be undone.`,
      () => performDelete(product._id),
      {
        variant: "danger",
        confirmText: "Delete Product",
      },
    );
  };

  const performDelete = async (inventoryID) => {
    try {
      const result = await axios.delete(`${API_URL}/inventory/${inventoryID}`);

      if (result.data.success) {
        setInventories((prev) =>
          prev.filter((product) => product._id !== inventoryID),
        );

        showAlert("Product deleted successfully", {
          title: "Deleted",
          variant: "info",
          confirmText: "OK",
        });
      } else {
        showAlert(result.data.message || "Failed to delete product", {
          title: "Couldn't delete product",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);

      showAlert(
        error.response?.data?.message ||
          "Something went wrong while deleting product",
        {
          title: "Couldn't delete product",
          variant: "danger",
        },
      );
    }
  };

  const filteredInventory = inventories.filter((product) => {
    const searchValue = search.toLowerCase().trim();

    return (
      String(product.ProductName || "")
        .toLowerCase()
        .includes(searchValue) ||
      String(product.Category || "")
        .toLowerCase()
        .includes(searchValue) ||
      String(product.Brand || "")
        .toLowerCase()
        .includes(searchValue)
    );
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 p-8">
      <AppModal modalState={modal} onClose={closeModal} />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col">
        {}

        <div className="mb-5 rounded-2xl bg-[#14213d] px-8 py-6 text-white">
          <h2 className="text-2xl font-bold">Inventory</h2>

          <p className="text-sm text-gray-300">Manage your products</p>
        </div>

        {}

        <div className="mb-5 flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, category or brand"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={handleAddInventory}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm text-white hover:bg-indigo-700"
          >
            <i className="fa-solid fa-plus"></i>
            Add Product
          </button>
        </div>

        {}

        {loading ? (
          <div className="rounded-xl bg-white py-12 text-center">
            <i className="fa-solid fa-spinner fa-spin text-xl text-gray-400"></i>

            <p className="mt-2 text-sm text-gray-400">Loading inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInventory.length > 0 ? (
              filteredInventory.map((product) => {
                const stock = Number(product.Stock || 0);

                const isOutOfStock = stock <= 0;

                const isLowStock =
                  !isOutOfStock && stock <= LOW_STOCK_THRESHOLD;

                const imgUrl = productImageUrl(product);

                return (
                  <div
                    key={product._id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:shadow-md"
                  >
                    {}

                    <div className="relative h-44 w-full bg-gray-50">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.ProductName || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                          <i className="fa-regular fa-image text-2xl"></i>

                          <span className="mt-2 text-xs">No Image</span>
                        </div>
                      )}

                      {}

                      <span
                        className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          isOutOfStock
                            ? "bg-red-100 text-red-600"
                            : isLowStock
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        {isOutOfStock
                          ? "Out of stock"
                          : isLowStock
                            ? `Low stock: ${stock}`
                            : `In stock: ${stock}`}
                      </span>
                    </div>

                    {}

                    <div className="p-4">
                      {}

                      <h2 className="truncate text-base font-semibold text-gray-900">
                        {product.ProductName || "Unnamed Product"}
                      </h2>

                      {}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-600">
                          {product.Category || "No Category"}
                        </span>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                          {product.Brand || "No Brand"}
                        </span>
                      </div>

                      {}

                      <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Cost Price
                          </span>

                          <span className="text-sm font-semibold text-gray-800">
                            Rs. {product.CostPrice ?? 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Selling Price
                          </span>

                          <span className="text-sm font-semibold text-gray-800">
                            Rs. {product.SellingPrice ?? 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Stock on hand
                          </span>

                          <span
                            className={`text-sm font-semibold ${
                              isOutOfStock
                                ? "text-red-600"
                                : isLowStock
                                  ? "text-amber-600"
                                  : "text-gray-800"
                            }`}
                          >
                            {stock}
                          </span>
                        </div>
                      </div>
                    </div>

                    {}

                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-3 py-3">
                      {}

                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        title="Edit Product"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>

                      {}

                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        title="Delete Product"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-800"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full rounded-xl bg-white py-12 text-center">
                <i className="fa-solid fa-box-open text-3xl text-gray-300"></i>

                <p className="mt-3 text-sm text-gray-400">
                  {search ? "No products found" : "No inventory available"}
                </p>
              </div>
            )}
          </div>
        )}

        {}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
              {}

              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingInventory ? "Edit Product" : "Add New Product"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {editingInventory
                      ? "Update the product information"
                      : "Enter the product information"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  title="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {}

              <form onSubmit={handleOnSubmit}>
                <div className="space-y-4 p-5">
                  {}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Product Image
                    </label>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jfif,.jpg,.jpeg,.png,.jfif"
                      onChange={handleImageChange}
                      className="w-full cursor-pointer rounded-md border border-gray-200 p-2 text-xs"
                    />

                    {}

                    {imagePreview && (
                      <div className="relative mt-3 w-fit">
                        <img
                          src={imagePreview}
                          alt="Product Preview"
                          className="h-28 w-28 rounded-md border object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                          title="Remove image"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Product Name
                    </label>

                    <input
                      type="text"
                      name="productname"
                      value={inventory.productname}
                      onChange={handleOnChange}
                      placeholder="Enter product name"
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Category
                    </label>

                    <input
                      type="text"
                      name="category"
                      value={inventory.category}
                      onChange={handleOnChange}
                      placeholder="Enter category"
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Brand
                    </label>

                    <input
                      type="text"
                      name="brand"
                      value={inventory.brand}
                      onChange={handleOnChange}
                      placeholder="Enter brand"
                      className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Cost Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          Rs.
                        </span>

                        <input
                          type="number"
                          name="costprice"
                          value={inventory.costprice}
                          onChange={handleOnChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="h-10 w-full rounded-md border border-gray-200 pl-10 pr-3 text-xs outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Selling Price
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          Rs.
                        </span>

                        <input
                          type="number"
                          name="sellingprice"
                          value={inventory.sellingprice}
                          onChange={handleOnChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="h-10 w-full rounded-md border border-gray-200 pl-10 pr-3 text-xs outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Stock
                      </label>

                      <input
                        type="number"
                        name="stock"
                        value={inventory.stock}
                        onChange={handleOnChange}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="h-10 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {}

                <div className="flex justify-end gap-2 border-t p-5">
                  {}

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="cursor-pointer rounded-md border border-gray-200 px-5 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  {}

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-xs text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i
                          className={
                            editingInventory
                              ? "fa-solid fa-pen"
                              : "fa-solid fa-plus"
                          }
                        ></i>

                        {editingInventory ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
