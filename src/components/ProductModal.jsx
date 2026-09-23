import { useState } from "react"

function ProductModal({
  showModal,
  setShowModal,
  name,
  setName,
  price,
  setPrice,
  stock,
  setStock,
  addProduct
}) {

  if (!showModal) return null;

  return (

    <div
      className="modal d-block"
      tabIndex="-1"
      style={{
        background: "rgba(0,0,0,0.5)"
      }}
    >

      <div className="modal-dialog">

        <div className="modal-content">

          <div className="modal-header">

            <h5 className="modal-title">
              Add Product
            </h5>

            <button
              className="btn-close"
              onClick={() => setShowModal(false)}
            ></button>

          </div>

          <div className="modal-body">

            <div className="mb-3">

              <label className="form-label">
                Product Name
              </label>

              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

            </div>

            <div className="mb-3">

              <label className="form-label">
                Price
              </label>

              <input
                type="number"
                className="form-control"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

            </div>

            <div className="mb-3">

              <label className="form-label">
                Stock
              </label>

              <input
                type="number"
                className="form-control"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />

            </div>

          </div>

          <div className="modal-footer">

            <button
              className="btn btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>

            <button
              className="btn btn-dark"
              onClick={addProduct}
            >
              Save Product
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

export default ProductModal;