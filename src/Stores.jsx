import { useEffect, useMemo, useState } from "react";
import "./Stores.css";

import {
  getAdminStores,
  getAdminOrders,
  updateStoreVerification,
  updateStoreStatus,
  toArray,
  formatMoney,
  formatDate,
} from "./api";

function Stores() {
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [storeData, orderData] =
        await Promise.all([
          getAdminStores(),
          getAdminOrders(),
        ]);

      setStores(toArray(storeData));
      setOrders(toArray(orderData));
    } catch (e) {
      setError(
        e.message ||
        "Unable to load stores."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        stores
          .map((s) => s.category)
          .filter(Boolean)
      ),
    ],
    [stores]
  );

  const normalized = useMemo(
    () =>
      stores.map((s) => {
        const storeId =
          s.id ??
          s.storeId;

        const storeOrders =
          orders.filter(
            (o) =>
              String(o.storeId) ===
              String(storeId)
          );

        const verification =
          String(
            s.verificationStatus ||
            ""
          ).toUpperCase();

        const storeStatus =
          String(
            s.storeStatus ||
            ""
          ).toUpperCase();

        const uiStatus =
          verification ===
          "VERIFIED"
            ? (
                storeStatus ===
                "SUSPENDED"
                  ? "Suspended"
                  : "Verified"
              )
            : verification ===
              "PENDING"
              ? "Pending"
              : storeStatus ===
                "SUSPENDED"
                ? "Suspended"
                : "Pending";

        return {
          ...s,

          id:
            `ST${storeId ?? ""}`,

          rawId:
            storeId,

          name:
            s.storeName ??
            s.name ??
            "Unknown Store",

          owner:
            s.ownerName ??
            s.owner ??
            "—",

          mobile:
            s.mobile ??
            "—",

          email:
            s.email ??
            "—",

          city:
            s.city ??
            "—",

          category:
            s.category ??
            "—",

          status:
            uiStatus,

          orders:
            storeOrders.length,

          revenue:
            storeOrders.reduce(
              (sum, o) =>
                sum +
                Number(
                  o.totalAmount ||
                  0
                ),
              0
            ),

          rating:
            Number(
              s.rating ??
              0
            ),

          joined:
            formatDate(
              s.createdAt ??
              s.joinedAt
            ),

          address: [
            s.address,
            s.city,
            s.state,
            s.pincode,
          ]
            .filter(Boolean)
            .join(", ") ||
            "—",
        };
      }),
    [stores, orders]
  );

  const filtered = useMemo(
    () => {
      const q =
        search
          .trim()
          .toLowerCase();

      return normalized.filter(
        (s) =>
          (
            !q ||
            [
              s.id,
              s.name,
              s.owner,
              s.mobile,
              s.city,
            ].some((v) =>
              String(v)
                .toLowerCase()
                .includes(q)
            )
          ) &&
          (
            status === "All" ||
            s.status === status
          ) &&
          (
            category === "All" ||
            s.category === category
          )
      );
    },
    [
      normalized,
      search,
      status,
      category,
    ]
  );

  const summary = {
    all:
      normalized.length,

    verified:
      normalized.filter(
        (s) =>
          s.status ===
          "Verified"
      ).length,

    pending:
      normalized.filter(
        (s) =>
          s.status ===
          "Pending"
      ).length,

    suspended:
      normalized.filter(
        (s) =>
          s.status ===
          "Suspended"
      ).length,

    activeOrders:
      normalized.reduce(
        (sum, s) =>
          sum + s.orders,
        0
      ),
  };

  const approve = async (
    store
  ) => {
    try {
      await updateStoreVerification(
        store.rawId,
        "VERIFIED"
      );

      await load();

      setSelectedStore(
        null
      );
    } catch (e) {
      alert(
        e.message
      );
    }
  };

  const suspend = async (
    store
  ) => {
    try {
      await updateStoreStatus(
        store.rawId,
        "SUSPENDED"
      );

      await load();

      setSelectedStore(
        null
      );
    } catch (e) {
      alert(
        e.message
      );
    }
  };

  if (loading) {
    return (
      <section className="admin-stores-page">
        <div className="stores-table-card">
          Loading stores...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-stores-page">
        <div className="stores-table-card">
          <strong>
            Stores error
          </strong>

          <p
            style={{
              marginTop: 8,
            }}
          >
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-stores-page">

      <div className="stores-title-row">

        <div>
          <span className="stores-breadcrumb">
            Admin / Stores
          </span>

          <h1>
            Stores / Partners
          </h1>

          <p>
            Manage MaxiGo seller accounts, verification and store performance.
          </p>
        </div>

        <div className="stores-title-actions">

          <button
            className="stores-secondary-btn"
            onClick={load}
          >
            ↻ Refresh
          </button>

          <button className="stores-primary-btn">
            + Add Store
          </button>

        </div>

      </div>

      <div className="stores-summary-grid">

        <button
          className={`stores-summary-card ${
            status === "All"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("All")
          }
        >
          <span className="store-summary-icon purple">
            🏪
          </span>

          <div>
            <small>
              Total Stores
            </small>

            <strong>
              {summary.all}
            </strong>
          </div>
        </button>

        <button
          className={`stores-summary-card ${
            status === "Verified"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Verified")
          }
        >
          <span className="store-summary-icon green">
            ✓
          </span>

          <div>
            <small>
              Verified
            </small>

            <strong>
              {summary.verified}
            </strong>
          </div>
        </button>

        <button
          className={`stores-summary-card ${
            status === "Pending"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Pending")
          }
        >
          <span className="store-summary-icon orange">
            !
          </span>

          <div>
            <small>
              Pending Approval
            </small>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </button>

        <button
          className={`stores-summary-card ${
            status === "Suspended"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Suspended")
          }
        >
          <span className="store-summary-icon red">
            ×
          </span>

          <div>
            <small>
              Suspended
            </small>

            <strong>
              {summary.suspended}
            </strong>
          </div>
        </button>

        <div className="stores-summary-card static-card">

          <span className="store-summary-icon blue">
            📦
          </span>

          <div>
            <small>
              Total Orders
            </small>

            <strong>
              {summary.activeOrders}
            </strong>
          </div>

        </div>

      </div>

      <div className="stores-filter-card">

        <div className="stores-search-box">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search store, owner, mobile or city..."
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
          className="stores-select"
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
            Verified
          </option>

          <option>
            Pending
          </option>

          <option>
            Suspended
          </option>
        </select>

        <select
          className="stores-select"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
        >
          {categories.map(
            (c) => (
              <option
                key={c}
              >
                {c}
              </option>
            )
          )}
        </select>

      </div>

      <div className="stores-table-card">

        <div className="stores-card-head">

          <div>
            <h2>
              All Stores
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
              stores
            </p>
          </div>

          <span className="stores-result-pill">
            {
              filtered.length
            }{" "}
            Results
          </span>

        </div>

        <div className="stores-table-wrap">

          <table className="stores-table">

            <thead>
              <tr>
                <th>
                  Store
                </th>

                <th>
                  Owner
                </th>

                <th>
                  Mobile
                </th>

                <th>
                  City
                </th>

                <th>
                  Category
                </th>

                <th>
                  Orders
                </th>

                <th>
                  Revenue
                </th>

                <th>
                  Rating
                </th>

                <th>
                  Status
                </th>

                <th />
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                (s) => (
                  <tr
                    key={
                      s.rawId
                    }
                  >

                    <td>

                      <div className="store-profile-cell">

                        <span className="store-avatar">
                          🏪
                        </span>

                        <div>

                          <button
                            className="store-name-btn"
                            onClick={() =>
                              setSelectedStore(
                                s
                              )
                            }
                          >
                            {
                              s.name
                            }
                          </button>

                          <small>
                            {
                              s.id
                            }
                          </small>

                        </div>

                      </div>

                    </td>

                    <td>
                      {
                        s.owner
                      }
                    </td>

                    <td>
                      {
                        s.mobile
                      }
                    </td>

                    <td>
                      {
                        s.city
                      }
                    </td>

                    <td>
                      <span className="category-pill">
                        {
                          s.category
                        }
                      </span>
                    </td>

                    <td>
                      <strong>
                        {
                          s.orders
                        }
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {
                          formatMoney(
                            s.revenue
                          )
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        s.rating >
                        0 ? (
                          <span className="store-rating">
                            ★{" "}
                            {
                              s.rating
                            }
                          </span>
                        ) : (
                          <span>
                            —
                          </span>
                        )
                      }
                    </td>

                    <td>
                      <span
                        className={`store-status ${s.status.toLowerCase()}`}
                      >
                        {
                          s.status
                        }
                      </span>
                    </td>

                    <td>

                      <button
                        className="store-view-btn"
                        onClick={() =>
                          setSelectedStore(
                            s
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
                  <td colSpan="10">

                    <div className="stores-empty">

                      <div>
                        🔍
                      </div>

                      <h3>
                        No stores found
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

      {selectedStore && (
        <div
          className="store-modal-backdrop"
          onClick={() =>
            setSelectedStore(
              null
            )
          }
        >

          <div
            className="store-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="store-modal-head">

              <div className="store-modal-user">

                <span className="store-modal-avatar">
                  🏪
                </span>

                <div>

                  <span>
                    Store Profile
                  </span>

                  <h2>
                    {
                      selectedStore.name
                    }
                  </h2>

                  <small>
                    {
                      selectedStore.id
                    }
                  </small>

                </div>

              </div>

              <button
                onClick={() =>
                  setSelectedStore(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="store-modal-status">

              <span
                className={`store-status ${selectedStore.status.toLowerCase()}`}
              >
                {
                  selectedStore.status
                }
              </span>

            </div>

            <div className="store-detail-grid">

              <div>
                <small>
                  Owner
                </small>

                <strong>
                  {
                    selectedStore.owner
                  }
                </strong>
              </div>

              <div>
                <small>
                  Mobile
                </small>

                <strong>
                  {
                    selectedStore.mobile
                  }
                </strong>
              </div>

              <div>
                <small>
                  Email
                </small>

                <strong>
                  {
                    selectedStore.email
                  }
                </strong>
              </div>

              <div>
                <small>
                  City
                </small>

                <strong>
                  {
                    selectedStore.city
                  }
                </strong>
              </div>

              <div>
                <small>
                  Category
                </small>

                <strong>
                  {
                    selectedStore.category
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Orders
                </small>

                <strong>
                  {
                    selectedStore.orders
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Revenue
                </small>

                <strong>
                  {
                    formatMoney(
                      selectedStore.revenue
                    )
                  }
                </strong>
              </div>

              <div>
                <small>
                  Rating
                </small>

                <strong>
                  {
                    selectedStore.rating
                      ? `★ ${selectedStore.rating}`
                      : "Not Rated"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Joined
                </small>

                <strong>
                  {
                    selectedStore.joined
                  }
                </strong>
              </div>

              <div className="store-full-detail">

                <small>
                  Business Address
                </small>

                <strong>
                  {
                    selectedStore.address
                  }
                </strong>

              </div>

            </div>

            <div className="store-modal-actions">

              <button
                className="stores-secondary-btn"
                onClick={() =>
                  setSelectedStore(
                    null
                  )
                }
              >
                Close
              </button>

              {selectedStore.status ===
                "Pending" && (
                <button
                  className="stores-primary-btn"
                  onClick={() =>
                    approve(
                      selectedStore
                    )
                  }
                >
                  ✓ Approve Store
                </button>
              )}

              {selectedStore.status ===
                "Verified" && (
                <button
                  className="stores-primary-btn"
                  onClick={() =>
                    suspend(
                      selectedStore
                    )
                  }
                >
                  Suspend Store
                </button>
              )}

              {selectedStore.status ===
                "Suspended" && (
                <button
                  className="stores-primary-btn"
                  onClick={() =>
                    approve(
                      selectedStore
                    )
                  }
                >
                  Re-Verify Store
                </button>
              )}

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default Stores;