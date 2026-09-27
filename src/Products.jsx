import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Products.css";

import {
  getAdminProducts,
  getCategories,
  getAdminStores,
  updateAdminProductActive,
  deleteAdminProduct,
  toArray,
  formatDate,
  formatMoney,
} from "./api";

function Products() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    stores,
    setStores,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    availability,
    setAvailability,
  ] = useState(
    "All"
  );

  const [
    category,
    setCategory,
  ] = useState(
    "All"
  );

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const load =
    async () => {
      setLoading(
        true
      );

      setError("");

      try {
        const [
          productData,
          categoryData,
          storeData,
        ] = await Promise.all([
          getAdminProducts(),
          getCategories(),
          getAdminStores(),
        ]);

        setProducts(
          toArray(
            productData
          )
        );

        setCategories(
          toArray(
            categoryData
          )
        );

        setStores(
          toArray(
            storeData
          )
        );

      } catch (e) {
        setError(
          e.message ||
          "Unable to load products."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    load();
  }, []);

  const categoryMap =
    useMemo(
      () =>
        new Map(
          categories.map(
            (c) => [
              String(c.id),
              c.name,
            ]
          )
        ),
      [categories]
    );

  const storeMap =
    useMemo(
      () =>
        new Map(
          stores.map(
            (s) => [
              String(s.id),
              s.storeName ||
                s.name,
            ]
          )
        ),
      [stores]
    );

  const normalizeProduct =
    (p) => {

      const stock =
        Number(
          p.stock ||
          0
        );

      const stockStatus =
        stock <= 0
          ? "Out of Stock"
          : stock <= 5
            ? "Low Stock"
            : "In Stock";

      const active =
        Boolean(
          p.isActive
        );

      return {
        ...p,

        store:
          storeMap.get(
            String(
              p.storeId
            )
          ) ||
          `Store #${
            p.storeId ??
            "—"
          }`,

        category:
          categoryMap.get(
            String(
              p.categoryId
            )
          ) ||
          `Category #${
            p.categoryId ??
            "—"
          }`,

        stock,

        stockStatus,

        status:
          active
            ? (
                String(
                  p.status ||
                  "ACTIVE"
                ).toUpperCase() ===
                "ACTIVE"
                  ? "ACTIVE"
                  : p.status
              )
            : "INACTIVE",

        sold:
          Number(
            p.sold ||
            0
          ),

        rating:
          Number(
            p.rating ||
            0
          ),

        created:
          formatDate(
            p.createdAt
          ),
      };
    };

  const normalized =
    useMemo(
      () =>
        products.map(
          normalizeProduct
        ),
      [
        products,
        storeMap,
        categoryMap,
      ]
    );

  const filtered =
    useMemo(
      () => {
        const q =
          search
            .trim()
            .toLowerCase();

        return normalized.filter(
          (p) =>
            (
              !q ||
              [
                p.id,
                p.name,
                p.store,
                p.category,
                p.brand,
              ].some(
                (v) =>
                  String(
                    v ||
                    ""
                  )
                    .toLowerCase()
                    .includes(
                      q
                    )
              )
            ) &&
            (
              availability ===
                "All" ||
              p.stockStatus ===
                availability
            ) &&
            (
              category ===
                "All" ||
              p.category ===
                category
            )
        );
      },
      [
        normalized,
        search,
        availability,
        category,
      ]
    );

  const summary = {
    all:
      normalized.length,

    inStock:
      normalized.filter(
        (p) =>
          p.stockStatus ===
          "In Stock"
      ).length,

    lowStock:
      normalized.filter(
        (p) =>
          p.stockStatus ===
          "Low Stock"
      ).length,

    outOfStock:
      normalized.filter(
        (p) =>
          p.stockStatus ===
          "Out of Stock"
      ).length,

    categories:
      new Set(
        normalized
          .map(
            (p) =>
              p.categoryId
          )
          .filter(
            Boolean
          )
      ).size,
  };

  const toggleActive =
    async (p) => {
      try {
        await updateAdminProductActive(
          p.id,
          !p.isActive
        );

        await load();

        setSelectedProduct(
          null
        );
      } catch (e) {
        alert(
          e.message
        );
      }
    };

  const remove =
    async (p) => {

      if (
        !window.confirm(
          `Delete ${p.name}?`
        )
      ) {
        return;
      }

      try {
        await deleteAdminProduct(
          p.id
        );

        setSelectedProduct(
          null
        );

        await load();

      } catch (e) {
        alert(
          e.message
        );
      }
    };

  if (loading) {
    return (
      <section className="admin-products-page">
        <div className="products-table-card">
          Loading products...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-products-page">
        <div className="products-table-card">

          <strong>
            Products error
          </strong>

          <p
            style={{
              marginTop: 8,
            }}
          >
            {
              error
            }
          </p>

        </div>
      </section>
    );
  }

  return (
    <section className="admin-products-page">

      <div className="products-title-row">

        <div>
          <span className="products-breadcrumb">
            Admin / Products
          </span>

          <h1>
            Products
          </h1>

          <p>
            Manage products, pricing, stock and availability across MaxiGo stores.
          </p>
        </div>

        <div className="products-title-actions">

          <button
            className="products-secondary-btn"
            onClick={load}
          >
            ↻ Refresh
          </button>

          <button className="products-primary-btn">
            + Add Product
          </button>

        </div>

      </div>

      <div className="products-summary-grid">

        <button
          className={`products-summary-card ${
            availability ===
            "All"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setAvailability(
              "All"
            )
          }
        >
          <span className="product-summary-icon purple">
            🛍️
          </span>

          <div>
            <small>
              Total Products
            </small>

            <strong>
              {
                summary.all
              }
            </strong>
          </div>
        </button>

        <button
          className={`products-summary-card ${
            availability ===
            "In Stock"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setAvailability(
              "In Stock"
            )
          }
        >
          <span className="product-summary-icon green">
            ✓
          </span>

          <div>
            <small>
              In Stock
            </small>

            <strong>
              {
                summary.inStock
              }
            </strong>
          </div>
        </button>

        <button
          className={`products-summary-card ${
            availability ===
            "Low Stock"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setAvailability(
              "Low Stock"
            )
          }
        >
          <span className="product-summary-icon orange">
            !
          </span>

          <div>
            <small>
              Low Stock
            </small>

            <strong>
              {
                summary.lowStock
              }
            </strong>
          </div>
        </button>

        <button
          className={`products-summary-card ${
            availability ===
            "Out of Stock"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setAvailability(
              "Out of Stock"
            )
          }
        >
          <span className="product-summary-icon red">
            ×
          </span>

          <div>
            <small>
              Out of Stock
            </small>

            <strong>
              {
                summary.outOfStock
              }
            </strong>
          </div>
        </button>

        <div className="products-summary-card static-card">
          <span className="product-summary-icon blue">
            ▦
          </span>

          <div>
            <small>
              Categories
            </small>

            <strong>
              {
                summary.categories
              }
            </strong>
          </div>
        </div>

      </div>

      <div className="products-filter-card">

        <div className="products-search-box">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search product, store, category or product ID..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
            >
              ✕
            </button>
          )}

        </div>

        <select
          className="products-select"
          value={availability}
          onChange={(e) =>
            setAvailability(
              e.target.value
            )
          }
        >
          <option>
            All
          </option>

          <option>
            In Stock
          </option>

          <option>
            Low Stock
          </option>

          <option>
            Out of Stock
          </option>
        </select>

        <select
          className="products-select"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
        >
          <option>
            All
          </option>

          {categories.map(
            (c) => (
              <option
                key={c.id}
                value={c.name}
              >
                {
                  c.name
                }
              </option>
            )
          )}

        </select>

      </div>

      <div className="products-table-card">

        <div className="products-card-head">

          <div>
            <h2>
              All Products
            </h2>

            <p>
              Showing{" "}
              {
                filtered.length
              }{" "}
              of{" "}
              {
                normalized.length
              }{" "}
              products
            </p>
          </div>

          <span className="products-result-pill">
            {
              filtered.length
            }{" "}
            Results
          </span>

        </div>

        <div className="products-table-wrap">

          <table className="products-table">

            <thead>
              <tr>
                <th>
                  Product
                </th>
                <th>
                  Store
                </th>
                <th>
                  Category
                </th>
                <th>
                  Price
                </th>
                <th>
                  Stock
                </th>
                <th>
                  Sold
                </th>
                <th>
                  Rating
                </th>
                <th>
                  Availability
                </th>
                <th />
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                (p) => (
                  <tr
                    key={p.id}
                  >

                    <td>

                      <div className="product-profile-cell">

                        <span className="product-avatar">
                          🛍️
                        </span>

                        <div>

                          <button
                            className="product-name-btn"
                            onClick={() =>
                              setSelectedProduct(
                                p
                              )
                            }
                          >
                            {
                              p.name
                            }
                          </button>

                          <small>
                            PR
                            {
                              String(
                                p.id
                              ).padStart(
                                3,
                                "0"
                              )
                            }
                          </small>

                        </div>

                      </div>

                    </td>

                    <td>
                      {
                        p.store
                      }
                    </td>

                    <td>
                      <span className="product-category-pill">
                        {
                          p.category
                        }
                      </span>
                    </td>

                    <td>

                      <strong>
                        {
                          formatMoney(
                            p.price
                          )
                        }
                      </strong>

                      <small className="product-unit">
                        {
                          p.unit ||
                          "—"
                        }
                      </small>

                    </td>

                    <td>

                      <span
                        className={`stock-number ${p.stockStatus.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {
                          p.stock
                        }
                      </span>

                    </td>

                    <td>
                      <strong>
                        {
                          p.sold
                        }
                      </strong>
                    </td>

                    <td>

                      {p.rating >
                      0 ? (
                        <span className="product-rating">
                          ★{" "}
                          {
                            p.rating
                          }
                        </span>
                      ) : (
                        <span>
                          —
                        </span>
                      )}

                    </td>

                    <td>

                      <span
                        className={`product-status ${p.stockStatus.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {
                          p.stockStatus
                        }
                      </span>

                    </td>

                    <td>

                      <button
                        className="product-view-btn"
                        onClick={() =>
                          setSelectedProduct(
                            p
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>
                )
              )}

              {!filtered.length && (
                <tr>
                  <td colSpan="9">

                    <div className="products-empty">
                      <div>
                        🔍
                      </div>

                      <h3>
                        No products found
                      </h3>

                      <p>
                        Try another search or filter.
                      </p>
                    </div>

                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selectedProduct && (
        <div
          className="product-modal-backdrop"
          onClick={() =>
            setSelectedProduct(
              null
            )
          }
        >

          <div
            className="product-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="product-modal-head">

              <div className="product-modal-user">

                <span className="product-modal-avatar">
                  🛍️
                </span>

                <div>
                  <span>
                    Product Details
                  </span>

                  <h2>
                    {
                      selectedProduct.name
                    }
                  </h2>

                  <small>
                    PR
                    {
                      String(
                        selectedProduct.id
                      ).padStart(
                        3,
                        "0"
                      )
                    }
                  </small>
                </div>

              </div>

              <button
                onClick={() =>
                  setSelectedProduct(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="product-modal-status">

              <span
                className={`product-status ${String(selectedProduct.stockStatus || selectedProduct.status)
                  .toLowerCase()
                  .replaceAll(
                    " ",
                    "-"
                  )}`}
              >
                {
                  selectedProduct.stockStatus ||
                  selectedProduct.status
                }
              </span>

            </div>

            <div className="product-detail-grid">

              <div>
                <small>
                  Store
                </small>

                <strong>
                  {
                    selectedProduct.store
                  }
                </strong>
              </div>

              <div>
                <small>
                  Category
                </small>

                <strong>
                  {
                    selectedProduct.category
                  }
                </strong>
              </div>

              <div>
                <small>
                  Price
                </small>

                <strong>
                  {
                    formatMoney(
                      selectedProduct.price
                    )
                  }
                </strong>
              </div>

              <div>
                <small>
                  Unit
                </small>

                <strong>
                  {
                    selectedProduct.unit ||
                    "—"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Current Stock
                </small>

                <strong>
                  {
                    selectedProduct.stock
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Sold
                </small>

                <strong>
                  {
                    selectedProduct.sold
                  }
                </strong>
              </div>

              <div>
                <small>
                  Rating
                </small>

                <strong>
                  {
                    selectedProduct.rating
                      ? `★ ${selectedProduct.rating}`
                      : "Not Rated"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Created
                </small>

                <strong>
                  {
                    selectedProduct.created
                  }
                </strong>
              </div>

            </div>

            <div className="product-modal-actions">

              <button
                className="products-secondary-btn"
                onClick={() =>
                  setSelectedProduct(
                    null
                  )
                }
              >
                Close
              </button>

              <button
                className="products-primary-btn"
                onClick={() =>
                  toggleActive(
                    selectedProduct
                  )
                }
              >
                {
                  selectedProduct.isActive
                    ? "Disable Product"
                    : "Enable Product"
                }
              </button>

              <button
                className="products-secondary-btn"
                onClick={() =>
                  remove(
                    selectedProduct
                  )
                }
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default Products;