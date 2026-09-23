import Swal from "sweetalert2";

// ── Configuración base ───────────────────────────────────────────
// Toast liviano (esquina inferior derecha)
const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  }
});

// ── Toasts rápidos ───────────────────────────────────────────────
export const toastSuccess = (message) =>
  Toast.fire({ icon: "success", title: message });

export const toastError = (message) =>
  Toast.fire({ icon: "error", title: message });

export const toastWarning = (message) =>
  Toast.fire({ icon: "warning", title: message });

export const toastInfo = (message) =>
  Toast.fire({ icon: "info", title: message });

// ── Confirmación de eliminación ──────────────────────────────────
// Reemplaza window.confirm() en todos los módulos
export const confirmDelete = async (itemName = "this item") => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `"${itemName}" will be permanently deleted.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    borderRadius: "16px",
    customClass: {
      popup:          "swal-popup",
      confirmButton:  "swal-confirm",
      cancelButton:   "swal-cancel"
    }
  });
  return result.isConfirmed;
};

// ── Confirmación genérica ────────────────────────────────────────
export const confirmAction = async ({ title, text, confirmText = "Confirm", icon = "question" }) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#94a3b8",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel"
  });
  return result.isConfirmed;
};

// ── Alerta de error de validación ────────────────────────────────
export const alertValidation = (message) =>
  Swal.fire({
    icon: "error",
    title: "Missing fields",
    text: message,
    confirmButtonColor: "#2563eb",
    borderRadius: "16px"
  });