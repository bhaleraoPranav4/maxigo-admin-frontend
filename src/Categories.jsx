import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Categories.css";

import {
  getCategories,
  getAdminProducts,
  getAdminStores,
  createCategory,
  updateCategoryStatus,
  updateCategory,
  deleteCategory,
  toArray,
  formatDate,
  formatMoney,
} from "./api";

const iconFor = (
  name = ""
) => (
  {
    food: "🍛",
    kitchen: "🍳",
    vegetables: "🥦",
    fruits: "🍎",
    kirana: "🌾",
    dairy: "🥛",
    baby: "🧸",
    personal: "🧼",
    home: "🏠",
  }[
    name
      .toLowerCase()
      .split(" ")[0]
  ] ||
  "🏷️"
);

function Categories() {
  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    products,
    setProducts,
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
    status,
    setStatus,
  ] = useState("All");

  const [
    selectedCategory,
    setSelectedCategory,
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
      setLoading(true);
      setError("");

      try {
        const [
          categoryData,
          productData,
          storeData,
        ] = await Promise.all([
          getCategories(),
          getAdminProducts(),
          getAdminStores(),
        ]);

        setCategories(
          toArray(
            categoryData
          )
        );

        setProducts(
          toArray(
            productData
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
          "Unable to load categories."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    load();
  }, []);

  const normalized =
    useMemo(
      () =>
        categories.map(
          (c) => {

            const categoryId =
              c.id;

            const ps =
              products.filter(
                (p) =>
                  String(
                    p.categoryId
                  ) ===
                  String(
                    categoryId
                  )
              );

            const usingStores =
              new Set(
                ps
                  .map(
                    (p) =>
                      p.storeId
                  )
                  .filter(
                    Boolean
                  )
              );

            const st =
              String(
                c.status ||
                "ACTIVE"
              ).toUpperCase();

            return {
              ...c,

              id:
                categoryId,

              name:
                c.name ||
                "Unnamed Category",

              icon:
                c.icon ||
                iconFor(
                  c.name
                ),

              products:
                ps.length,

              stores:
                usingStores.size,

              orders: 0,

              revenue: 0,

              status:
                st ===
                "ACTIVE"
                  ? "Active"
                  : "Inactive",

              created:
                formatDate(
                  c.createdAt
                ),

              description:
                c.description ||
                "—",
            };
          }
        ),
      [
        categories,
        products,
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
          (c) =>
            (
              !q ||
              [
                c.id,
                c.name,
                c.description,
              ].some(
                (v) =>
                  String(v)
                    .toLowerCase()
                    .includes(
                      q
                    )
              )
            ) &&
            (
              status ===
                "All" ||
              c.status ===
                status
            )
        );
      },
      [
        normalized,
        search,
        status,
      ]
    );

  const summary = {
    all:
      normalized.length,

    active:
      normalized.filter(
        (c) =>
          c.status ===
          "Active"
      ).length,

    inactive:
      normalized.filter(
        (c) =>
          c.status ===
          "Inactive"
      ).length,

    products:
      normalized.reduce(
        (s, c) =>
          s + c.products,
        0
      ),

    stores:
      normalized.reduce(
        (s, c) =>
          s + c.stores,
        0
      ),
  };

  const toggle =
    async (
      c
    ) => {
      try {

        await updateCategoryStatus(
          c.id,
          c.status ===
            "Active"
            ? "INACTIVE"
            : "ACTIVE"
        );

        await load();

        setSelectedCategory(
          null
        );

      } catch (e) {
        alert(
          e.message
        );
      }
    };

  const add =
    async () => {

      const name =
        window.prompt(
          "Category name"
        );

      if (
        !name?.trim()
      ) {
        return;
      }

      const description =
        window.prompt(
          "Description"
        ) ||
        "";

      try {

        await createCategory({
          name:
            name.trim(),

          description,

          status:
            "ACTIVE",
        });

        await load();

      } catch (e) {
        alert(
          e.message
        );
      }
    };

  const edit =
    async (c) => {

      const name =
        window.prompt(
          "Category name",
          c.name
        );

      if (
        !name?.trim()
      ) {
        return;
      }

      const description =
        window.prompt(
          "Description",
          c.description ===
            "—"
            ? ""
            : c.description
        ) ||
        "";

      try {

        await updateCategory(
          c.id,
          {
            ...c,
            name:
              name.trim(),
            description,
            status:
              c.status.toUpperCase(),
          }
        );

        await load();

        setSelectedCategory(
          null
        );

      } catch (e) {
        alert(
          e.message
        );
      }
    };

  const remove =
    async (c) => {

      if (
        !window.confirm(
          `Delete ${c.name}?`
        )
      ) {
        return;
      }

      try {

        await deleteCategory(
          c.id
        );

        setSelectedCategory(
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
      <section className="admin-categories-page">
        <div className="categories-content-head">
          <h2>
            Loading categories...
          </h2>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-categories-page">
        <div className="categories-content-head">
          <h2>
            Categories error
          </h2>

          <p>
            {
              error
            }
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-categories-page">

      <div className="categories-title-row">

        <div>
          <span className="categories-breadcrumb">
            Admin / Categories
          </span>

          <h1>
            Categories
          </h1>

          <p>
            Manage MaxiGo product categories and category-wise performance.
          </p>
        </div>

        <div className="categories-title-actions">

          <button
            className="categories-secondary-btn"
            onClick={load}
          >
            ↻ Refresh
          </button>

          <button
            className="categories-primary-btn"
            onClick={add}
          >
            + Add Category
          </button>

        </div>

      </div>

      <div className="categories-summary-grid">

        <button
          className={`categories-summary-card ${
            status === "All"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus(
              "All"
            )
          }
        >
          <span className="category-summary-icon purple">
            ▦
          </span>

          <div>
            <small>
              Total Categories
            </small>

            <strong>
              {
                summary.all
              }
            </strong>
          </div>
        </button>

        <button
          className={`categories-summary-card ${
            status ===
            "Active"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus(
              "Active"
            )
          }
        >
          <span className="category-summary-icon green">
            ✓
          </span>

          <div>
            <small>
              Active
            </small>

            <strong>
              {
                summary.active
              }
            </strong>
          </div>
        </button>

        <button
          className={`categories-summary-card ${
            status ===
            "Inactive"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus(
              "Inactive"
            )
          }
        >
          <span className="category-summary-icon red">
            ×
          </span>

          <div>
            <small>
              Inactive
            </small>

            <strong>
              {
                summary.inactive
              }
            </strong>
          </div>
        </button>

        <div className="categories-summary-card static-card">

          <span className="category-summary-icon blue">
            🛍️
          </span>

          <div>
            <small>
              Total Products
            </small>

            <strong>
              {
                summary.products
              }
            </strong>
          </div>

        </div>

        <div className="categories-summary-card static-card">

          <span className="category-summary-icon orange">
            🏪
          </span>

          <div>
            <small>
              Stores Using Categories
            </small>

            <strong>
              {
                summary.stores
              }
            </strong>
          </div>

        </div>

      </div>

      <div className="categories-filter-card">

        <div className="categories-search-box">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search category, ID or description..."
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
          className="categories-select"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option>
            All
          </option>

          <option>
            Active
          </option>

          <option>
            Inactive
          </option>
        </select>

      </div>

      <div className="categories-content-head">

        <div>
          <h2>
            All Categories
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
            categories
          </p>
        </div>

        <span className="categories-result-pill">
          {
            filtered.length
          }{" "}
          Results
        </span>

      </div>

      <div className="categories-grid">

        {filtered.map(
          (c) => (
            <div
              className="category-card"
              key={c.id}
            >

              <div className="category-card-top">

                <div className="category-main-icon">
                  {
                    c.icon
                  }
                </div>

                <span
                  className={`category-status ${c.status.toLowerCase()}`}
                >
                  {
                    c.status
                  }
                </span>

              </div>

              <div className="category-card-body">

                <small>
                  {
                    c.id
                  }
                </small>

                <h3>
                  {
                    c.name
                  }
                </h3>

                <p>
                  {
                    c.description
                  }
                </p>

              </div>

              <div className="category-metrics">

                <div>
                  <small>
                    Products
                  </small>

                  <strong>
                    {
                      c.products
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Stores
                  </small>

                  <strong>
                    {
                      c.stores
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Orders
                  </small>

                  <strong>
                    {
                      c.orders
                    }
                  </strong>
                </div>

              </div>

              <div className="category-card-bottom">

                <strong>
                  {
                    formatMoney(
                      c.revenue
                    )
                  }
                </strong>

                <button
                  onClick={() =>
                    setSelectedCategory(
                      c
                    )
                  }
                >
                  View Details →
                </button>

              </div>

            </div>
          )
        )}

        {!filtered.length && (
          <div className="categories-empty">

            <div>
              🔍
            </div>

            <h3>
              No categories found
            </h3>

            <p>
              Try another search or status filter.
            </p>

          </div>
        )}

      </div>

      {selectedCategory && (
        <div
          className="category-modal-backdrop"
          onClick={() =>
            setSelectedCategory(
              null
            )
          }
        >

          <div
            className="category-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="category-modal-head">

              <div className="category-modal-title">

                <span className="category-modal-icon">
                  {
                    selectedCategory.icon
                  }
                </span>

                <div>

                  <span>
                    Category Details
                  </span>

                  <h2>
                    {
                      selectedCategory.name
                    }
                  </h2>

                  <small>
                    {
                      selectedCategory.id
                    }
                  </small>

                </div>

              </div>

              <button
                onClick={() =>
                  setSelectedCategory(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="category-modal-status">

              <span
                className={`category-status ${selectedCategory.status.toLowerCase()}`}
              >
                {
                  selectedCategory.status
                }
              </span>

            </div>

            <div className="category-detail-grid">

              <div>
                <small>
                  Total Products
                </small>

                <strong>
                  {
                    selectedCategory.products
                  }
                </strong>
              </div>

              <div>
                <small>
                  Stores
                </small>

                <strong>
                  {
                    selectedCategory.stores
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Orders
                </small>

                <strong>
                  {
                    selectedCategory.orders
                  }
                </strong>
              </div>

              <div>
                <small>
                  Revenue
                </small>

                <strong>
                  {
                    formatMoney(
                      selectedCategory.revenue
                    )
                  }
                </strong>
              </div>

              <div>
                <small>
                  Created
                </small>

                <strong>
                  {
                    selectedCategory.created
                  }
                </strong>
              </div>

              <div className="category-full-detail">

                <small>
                  Description
                </small>

                <strong>
                  {
                    selectedCategory.description
                  }
                </strong>

              </div>

            </div>

            <div className="category-modal-actions">

              <button
                className="categories-secondary-btn"
                onClick={() =>
                  setSelectedCategory(
                    null
                  )
                }
              >
                Close
              </button>

              <button
                className="categories-primary-btn"
                onClick={() =>
                  edit(
                    selectedCategory
                  )
                }
              >
                ✎ Edit Category
              </button>

              <button
                className="categories-secondary-btn"
                onClick={() =>
                  toggle(
                    selectedCategory
                  )
                }
              >
                {
                  selectedCategory.status ===
                  "Active"
                    ? "Deactivate"
                    : "Activate"
                }
              </button>

              <button
                className="categories-secondary-btn"
                onClick={() =>
                  remove(
                    selectedCategory
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

export default Categories;