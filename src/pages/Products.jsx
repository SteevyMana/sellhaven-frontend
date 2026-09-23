import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";
import {
  BsTrash,
  BsPencilSquare,
  BsPlus
} from "react-icons/bs";

// ── Modal ────────────────────────────────────────────────────────
function ProductModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, categories }) {

  if (!showModal) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Product" : "Add Product"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <div className="row">

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Product Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. Laptop Pro"
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Price ($)
                </label>
                <input
                  type="number"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="0.00"
                  value={fields.price}
                  onChange={(e) => setFields({ ...fields, price: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Stock
                </label>

                {isEditing ? (
                  <>
                    <input
                      type="number"
                      className="form-control"
                      style={{ borderRadius: "10px", background: "#f1f5f9", color: "#94a3b8" }}
                      value={fields.stock}
                      disabled
                      readOnly
                    />
                    <small className="text-muted">
                      Stock only changes via Stock Entries
                    </small>
                  </>
                ) : (
                  <input
                    type="number"
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                    placeholder="0"
                    value={fields.stock}
                    onChange={(e) => setFields({ ...fields, stock: e.target.value })}
                  />
                )}
              </div>

              {/* Selector de categoría — llave foránea category_id */}
              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Category
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: "10px" }}
                  value={fields.category_id}
                  onChange={(e) => setFields({ ...fields, category_id: e.target.value })}
                >
                  <option value="">— Select a category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button
              className="btn btn-light"
              style={{ borderRadius: "10px" }}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                background: saving ? "#bfdbfe" : "#dbeafe",
                color: "#1d4ed8",
                border: "none",
                padding: "8px 20px",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: saving ? "default" : "pointer"
              }}
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Products() {

  const canCreate = usePermission("products.create");
  const canEdit   = usePermission("products.edit");
  const canDelete = usePermission("products.delete");

  const [productsList, setProductsList] = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]        = useState("");
  const [saving, setSaving]             = useState(false);

  const [search, setSearch]             = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [fields, setFields]             = useState({
    name: "", price: "", stock: "", category_id: ""
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([api.get("/products"), api.get("/categories")])
      .then(([productsRes, categoriesRes]) => {
        setProductsList(productsRes.data);
        setCategories(categoriesRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load products. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalStock     = productsList.reduce((t, p) => t + p.stock, 0);
  const lowStock       = productsList.filter((p) => p.stock < 10).length;
  const inventoryValue = productsList.reduce((t, p) => t + Number(p.price) * p.stock, 0);

  // ── Filtrado ──
  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Abrir modal nuevo ──
  const openNewProduct = () => {
    setEditProductId(null);
    setFields({ name: "", price: "", stock: "", category_id: "" });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editProduct = (product) => {
    setEditProductId(product.id);
    setFields({
      name:        product.name,
      price:       product.price,
      stock:       product.stock, // solo para mostrarlo, no se envía al guardar
      category_id: product.category_id
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveProduct = () => {
    const isEditing = !!editProductId;

    if (!fields.name || !fields.price || !fields.category_id || (!isEditing && !fields.stock)) {
      alert("Complete all fields including category");
      return;
    }

    setSaving(true);

    // Al editar, "stock" no se manda: el backend ya no lo acepta en update.
    // Solo cambia a través de Stock Entries.
    const payload = isEditing
      ? {
          name: fields.name,
          price: Number(fields.price),
          category_id: Number(fields.category_id)
        }
      : {
          name: fields.name,
          price: Number(fields.price),
          stock: Number(fields.stock),
          category_id: Number(fields.category_id)
        };

    const request = isEditing
      ? api.put(`/products/${editProductId}`, payload)
      : api.post("/products", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => alert(err.response?.data?.message || "Could not save product."))
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteProduct = (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    api.delete(`/products/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete product."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Products</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage your products</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              outline: "none",
              minWidth: "180px",
              flex: 1
            }}
          />

          {canCreate && (
            <button
              onClick={openNewProduct}
              style={{
                background: "#dbeafe",
                color: "#1d4ed8",
                border: "none",
                padding: "10px 18px",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap"
              }}
            >
              <BsPlus size={18} /> Add Product
            </button>
          )}

        </div>

      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Products"   value={productsList.length}               color="#0f172a" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Stock"      value={totalStock}                         color="#2563eb" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Low Stock"        value={lowStock}                           color="#dc2626" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Inventory Value"  value={"$" + inventoryValue.toLocaleString()} color="#16a34a" />
        </div>

      </div>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
          {loadError}
        </div>
      )}

      {/* Tabla */}
      <div style={{
        background: "white",
        borderRadius: "15px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        overflowX: "auto"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["ID", "Name", "Category", "Price", "Stock", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{product.id}</span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                    {product.name}
                  </td>

                  <td style={tdStyle}>
                    <span style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      {product.category?.name || "—"}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500" }}>
                    ${Number(product.price).toLocaleString()}
                  </td>

                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: product.stock < 10 ? "#fff3cd" : "#d1f5d3",
                      color:      product.stock < 10 ? "#856404" : "#1a6b2a"
                    }}>
                      {product.stock}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {(canEdit || canDelete) ? (
                      <div style={{ display: "flex", gap: "8px" }}>

                        {canEdit && (
                          <button
                            onClick={() => editProduct(product)}
                            style={{
                              background: "#dbeafe", color: "#1d4ed8",
                              border: "none", borderRadius: "8px",
                              padding: "6px 10px", cursor: "pointer",
                              display: "flex", alignItems: "center"
                            }}
                          >
                            <BsPencilSquare />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => deleteProduct(product.id)}
                            style={{
                              background: "#fee2e2", color: "#b91c1c",
                              border: "none", borderRadius: "8px",
                              padding: "6px 10px", cursor: "pointer",
                              display: "flex", alignItems: "center"
                            }}
                          >
                            <BsTrash />
                          </button>
                        )}

                      </div>
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: "12px" }}>—</span>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Modal */}
      <ProductModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editProductId}
        fields={fields}
        setFields={setFields}
        onSave={saveProduct}
        saving={saving}
        categories={categories}
      />

    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "15px",
  color: "#94a3b8",
  fontWeight: "600",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tdStyle = { padding: "15px" };

export default Products;