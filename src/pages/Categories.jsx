import { useEffect, useState } from "react";
import { BsTrash, BsPencilSquare, BsPlus } from "react-icons/bs";
import StatCard from "../components/StatCard";
import { usePermission } from "../hooks/usePermission";
import api from "../api/client";

// ── Modal ────────────────────────────────────────────────────────
function CategoryModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving }) {

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
                            {isEditing ? "Edit Category" : "Add Category"}
                        </h5>
                        <button className="btn-close" onClick={() => setShowModal(false)} />
                    </div>

                    <div className="modal-body">

                        <div className="mb-3">
                            <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                                Category Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                style={{ borderRadius: "10px" }}
                                placeholder="e.g. Electrónica"
                                value={fields.name}
                                onChange={(e) => setFields({ ...fields, name: e.target.value })}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                                Description
                            </label>
                            <textarea
                                className="form-control"
                                style={{ borderRadius: "10px" }}
                                rows="3"
                                placeholder="Short description of this category"
                                value={fields.description}
                                onChange={(e) => setFields({ ...fields, description: e.target.value })}
                            />
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
                            {saving ? "Saving..." : "Save Category"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ── Página principal ─────────────────────────────────────────────
function Categories() {

    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState(null);
    const [fields, setFields] = useState({ name: "", description: "" });

    const canManage = usePermission("categories.manage");



    // ── Cargar desde la API ──
    const fetchAll = () => {
        api.get("/categories")
            .then((res) => {
                setCategoriesList(res.data);
                setLoadError("");
            })
            .catch(() => setLoadError("Could not load categories. Is the backend running?"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // ── Stats ── (products_count viene de Category::withCount('products'))
    const totalProducts = categoriesList.reduce((s, c) => s + c.products_count, 0);
    const withProducts = categoriesList.filter((c) => c.products_count > 0).length;
    const empty = categoriesList.filter((c) => c.products_count === 0).length;

    // ── Filtrado ──
    const filteredCategories = categoriesList.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())
    );

    // ── Abrir modal nueva categoría ──
    const openNewCategory = () => {
        setEditCategoryId(null);
        setFields({ name: "", description: "" });
        setShowModal(true);
    };

    // ── Abrir modal editar ──
    const editCategory = (category) => {
        setEditCategoryId(category.id);
        setFields({ name: category.name, description: category.description || "" });
        setShowModal(true);
    };

    // ── Guardar ──
    const saveCategory = () => {
        if (!fields.name) {
            alert("Category name is required");
            return;
        }

        setSaving(true);

        const payload = { name: fields.name, description: fields.description || null };

        const request = editCategoryId
            ? api.put(`/categories/${editCategoryId}`, payload)
            : api.post("/categories", payload);

        request
            .then(() => {
                setShowModal(false);
                fetchAll();
            })
            .catch((err) => {
                const nameError = err.response?.data?.errors?.name?.[0];
                alert(nameError || err.response?.data?.message || "Could not save category.");
            })
            .finally(() => setSaving(false));
    };

    // ── Eliminar ──
    const deleteCategory = (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;

        api.delete(`/categories/${id}`)
            .then(() => fetchAll())
            .catch((err) => alert(err.response?.data?.message || "Could not delete category."));
    };

    return (
        <div>

            {/* Fila 1: Título + Search + Botón */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

                <div>
                    <h1>Categories</h1>
                    <p style={{ color: "#64748b", margin: 0 }}>
                        Manage your product categories
                    </p>
                </div>

                <div className="d-flex flex-wrap gap-2">

                    <input
                        type="text"
                        placeholder="Search category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            outline: "none",
                            minWidth: "180px"
                        }}
                    />

                    {canManage && (
                        <button
                            onClick={openNewCategory}
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
                            <BsPlus size={18} /> Add Category
                        </button>
                    )}

                </div>

            </div>

            {/* Fila 2: StatCards */}
            <div className="row mb-4">

                <div className="col-6 col-lg-3 mb-3">
                    <StatCard title="Total Categories" value={categoriesList.length} color="#0f172a" />
                </div>

                <div className="col-6 col-lg-3 mb-3">
                    <StatCard title="With Products" value={withProducts} color="#2563eb" />
                </div>

                <div className="col-6 col-lg-3 mb-3">
                    <StatCard title="Empty" value={empty} color="#dc2626" />
                </div>

                <div className="col-6 col-lg-3 mb-3">
                    <StatCard title="Total Products" value={totalProducts} color="#16a34a" />
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
                            {["ID", "Name", "Description", "Products", "Actions"].map((h) => (
                                <th key={h} style={thStyle}>{h}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">Loading...</td>
                            </tr>
                        ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <tr key={category.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                                    <td style={tdStyle}>
                                        <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{category.id}</span>
                                    </td>

                                    <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                                        {category.name}
                                    </td>

                                    <td style={{ ...tdStyle, color: "#475569" }}>
                                        {category.description || "—"}
                                    </td>

                                    <td style={tdStyle}>
                                        <span style={{
                                            display: "inline-block",
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            background: category.products_count > 0 ? "#dcfce7" : "#f1f5f9",
                                            color: category.products_count > 0 ? "#166534" : "#94a3b8"
                                        }}>
                                            {category.products_count} {category.products_count === 1 ? "product" : "products"}
                                        </span>
                                    </td>

                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "8px" }}>

                                            {canManage && (
                                                <button
                                                    onClick={() => editCategory(category)}
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

                                            {canManage && (
                                                <button
                                                    onClick={() => deleteCategory(category.id)}
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
                                    </td>

                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">
                                    No categories found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>

            {/* Modal */}
            <CategoryModal
                showModal={showModal}
                setShowModal={setShowModal}
                isEditing={!!editCategoryId}
                fields={fields}
                setFields={setFields}
                onSave={saveCategory}
                saving={saving}
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

export default Categories;