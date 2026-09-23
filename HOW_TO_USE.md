# Cómo integrar Toast y Paginación en cada módulo

## 1. Toast (reemplaza alert y window.confirm)

```jsx
import { toastSuccess, toastError, confirmDelete, alertValidation } from "../utils/toast";

// En lugar de: alert("Complete all fields")
alertValidation("Name and email are required");

// En lugar de: if (window.confirm("Delete?"))
const confirmed = await confirmDelete(product.name);
if (confirmed) {
  deleteProduct(id);
  toastSuccess("Product deleted successfully");
}

// Al guardar:
saveProduct();
toastSuccess("Product saved successfully");

// En caso de error:
toastError("Something went wrong");
```

## 2. Paginación (mismo patrón en todos los módulos)

```jsx
import Pagination, { usePagination } from "../components/Pagination";

function Products() {
  const [productsList, setProductsList] = useState(initialProducts);
  const [search, setSearch] = useState("");

  const filteredProducts = productsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // 👇 Agregar esto (10 = items por página por defecto)
  const { currentItems, resetPage, paginationProps } = usePagination(filteredProducts, 10);

  // 👇 Cuando cambia el search, volver a página 1
  const handleSearch = (e) => {
    setSearch(e.target.value);
    resetPage();
  };

  return (
    <div>
      {/* ... header, statcards ... */}

      <div style={{ background: "white", borderRadius: "15px", padding: "20px" }}>
        <table>
          <tbody>
            {/* 👇 Usar currentItems en lugar de filteredProducts */}
            {currentItems.map(product => (
              <tr key={product.id}>...</tr>
            ))}
          </tbody>
        </table>

        {/* 👇 Agregar Pagination al final de la tabla */}
        <Pagination {...paginationProps} />
      </div>
    </div>
  );
}
```

## Módulos donde aplicar estos cambios:
- Products.jsx
- Categories.jsx
- Suppliers.jsx
- Purchases.jsx
- Orders.jsx
- Customers.jsx
- Sales.jsx
- Payments.jsx
- StockEntries.jsx
- ReturnToSupplier.jsx
- Users.jsx
- Roles.jsx
- Permissions.jsx