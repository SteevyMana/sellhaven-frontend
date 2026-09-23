// ── Pagination.jsx ───────────────────────────────────────────────
// Componente reutilizable para todas las tablas del sistema.
//
// USO:
//   const { currentItems, paginationProps } = usePagination(filteredList, 10);
//   ...
//   <table>...render currentItems...</table>
//   <Pagination {...paginationProps} />

import { useState, useMemo } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

// ── Hook reutilizable ────────────────────────────────────────────
export function usePagination(items = [], itemsPerPageDefault = 10) {

  const [currentPage, setCurrentPage]       = useState(1);
  const [itemsPerPage, setItemsPerPage]     = useState(itemsPerPageDefault);

  // Cuando cambia el filtro/búsqueda volvemos a página 1
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Aseguramos que la página actual nunca supere el total
  const safePage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, safePage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const resetPage = () => setCurrentPage(1);

  return {
    currentItems,
    resetPage,
    paginationProps: {
      currentPage: safePage,
      totalPages,
      totalItems,
      itemsPerPage,
      onPageChange: goToPage,
      onItemsPerPageChange: (n) => { setItemsPerPage(n); setCurrentPage(1); }
    }
  };
}

// ── Componente visual ────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) {

  if (totalItems === 0) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);

  // Genera los números de página visibles (max 5)
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  const btnBase = {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.15s"
  };

  return (
    <div
      className="d-flex flex-wrap align-items-center justify-content-between gap-2"
      style={{ marginTop: "16px", padding: "0 4px" }}
    >

      {/* Info de registros */}
      <span style={{ fontSize: "13px", color: "#64748b" }}>
        Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong> records
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Selector de filas por página */}
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            color: "#475569",
            background: "white",
            cursor: "pointer",
            outline: "none"
          }}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>

        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            ...btnBase,
            background: currentPage === 1 ? "#f8fafc" : "white",
            color:      currentPage === 1 ? "#cbd5e1" : "#475569",
            cursor:     currentPage === 1 ? "default" : "pointer"
          }}
        >
          <BsChevronLeft size={13} />
        </button>

        {/* Números de página */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              ...btnBase,
              background: page === currentPage ? "#2563eb" : "white",
              color:      page === currentPage ? "white"   : "#475569",
              border:     page === currentPage ? "1px solid #2563eb" : "1px solid #e2e8f0",
              fontWeight: page === currentPage ? "700" : "500"
            }}
          >
            {page}
          </button>
        ))}

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            ...btnBase,
            background: currentPage === totalPages ? "#f8fafc" : "white",
            color:      currentPage === totalPages ? "#cbd5e1" : "#475569",
            cursor:     currentPage === totalPages ? "default" : "pointer"
          }}
        >
          <BsChevronRight size={13} />
        </button>

      </div>

    </div>
  );
}

export default Pagination;