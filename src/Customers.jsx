import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Customers.css";

import {
  getAdminCustomers,
  getAdminOrders,
  toArray,
  formatDate,
  formatMoney,
} from "./api";

function Customers() {
  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState(
    "All"
  );

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    Promise.all([
      getAdminCustomers(),
      getAdminOrders(),
    ])
      .then(
        ([
          customerData,
          orderData,
        ]) => {
          setCustomers(
            toArray(
              customerData
            )
          );

          setOrders(
            toArray(
              orderData
            )
          );
        }
      )
      .catch((e) =>
        setError(
          e.message ||
          "Unable to load customers."
        )
      )
      .finally(() =>
        setLoading(
          false
        )
      );
  }, []);

  const normalized =
    useMemo(
      () =>
        customers.map(
          (c) => {
            const id =
              c.customerId ??
              c.id;

            const name =
              c.customerName ??
              c.name ??
              c.user?.name ??
              "Unknown Customer";

            const mobile =
              c.customerMobile ??
              c.mobile ??
              c.user?.mobile ??
              "—";

            const email =
              c.customerEmail ??
              c.email ??
              c.user?.email ??
              "—";

            const customerOrders =
              orders.filter(
                (o) =>
                  String(
                    o.customerId
                  ) ===
                  String(id)
              );

            const spent =
              customerOrders.reduce(
                (
                  sum,
                  o
                ) =>
                  sum +
                  Number(
                    o.totalAmount ||
                    0
                  ),
                0
              );

            const last =
              customerOrders
                .map(
                  (o) =>
                    o.placedAt
                )
                .filter(
                  Boolean
                )
                .sort()
                .at(-1);

            const userStatus =
              String(
                c.status ??
                c.userStatus ??
                c.user?.status ??
                "ACTIVE"
              ).toUpperCase();

            return {
              ...c,

              id,

              name,

              mobile,

              email,

              city:
                c.city ??
                "—",

              orders:
                customerOrders.length,

              spent,

              status:
                userStatus ===
                "BLOCKED"
                  ? "Blocked"
                  : "Active",

              joined:
                formatDate(
                  c.createdAt ??
                  c.joinedAt
                ),

              lastOrder:
                formatDate(
                  last
                ),

              address:
                c.address ??
                "—",
            };
          }
        ),
      [
        customers,
        orders,
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
                c.mobile,
                c.email,
                c.city,
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

    blocked:
      normalized.filter(
        (c) =>
          c.status ===
          "Blocked"
      ).length,

    newCustomers:
      normalized.filter(
        (c) =>
          c.joined &&
          c.joined.includes(
            "2026"
          )
      ).length,
  };

  if (loading) {
    return (
      <section className="admin-customers-page">
        <div className="customers-table-card">
          Loading customers...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-customers-page">
        <div className="customers-table-card">
          <strong>
            Customers error
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
    <section className="admin-customers-page">

      <div className="customers-title-row">

        <div>
          <span className="customers-breadcrumb">
            Admin / Customers
          </span>

          <h1>
            Customers
          </h1>

          <p>
            Manage MaxiGo customer accounts, activity and order history.
          </p>
        </div>

        <div className="customers-title-actions">

          <button
            type="button"
            className="customers-secondary-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="customers-primary-btn"
          >
            + Add Customer
          </button>

        </div>

      </div>

      <div className="customers-summary-grid">

        <button
          className={`customers-summary-card ${
            status ===
            "All"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus(
              "All"
            )
          }
        >

          <span className="customer-summary-icon purple">
            👥
          </span>

          <div>
            <small>
              Total Customers
            </small>

            <strong>
              {
                summary.all
              }
            </strong>
          </div>

        </button>

        <button
          className={`customers-summary-card ${
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

          <span className="customer-summary-icon green">
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
          className={`customers-summary-card ${
            status ===
            "Blocked"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus(
              "Blocked"
            )
          }
        >

          <span className="customer-summary-icon red">
            ×
          </span>

          <div>
            <small>
              Blocked
            </small>

            <strong>
              {
                summary.blocked
              }
            </strong>
          </div>

        </button>

        <div className="customers-summary-card static-card">

          <span className="customer-summary-icon blue">
            ✨
          </span>

          <div>
            <small>
              New / Current Year
            </small>

            <strong>
              {
                summary.newCustomers
              }
            </strong>
          </div>

        </div>

      </div>

      <div className="customers-filter-card">

        <div className="customers-search-box">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search customer, mobile, city or email..."
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
                setSearch(
                  ""
                )
              }
            >
              ✕
            </button>
          )}

        </div>

        <select
          className="customers-select"
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
            Blocked
          </option>

        </select>

      </div>

      <div className="customers-table-card">

        <div className="customers-card-head">

          <div>

            <h2>
              All Customers
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
              customers
            </p>

          </div>

          <span className="customers-total-pill">
            {
              filtered.length
            }{" "}
            Results
          </span>

        </div>

        <div className="customers-table-wrap">

          <table className="customers-table">

            <thead>
              <tr>
                <th>
                  Customer
                </th>

                <th>
                  Mobile
                </th>

                <th>
                  City
                </th>

                <th>
                  Orders
                </th>

                <th>
                  Total Spent
                </th>

                <th>
                  Last Order
                </th>

                <th>
                  Status
                </th>

                <th />
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                (c) => (
                  <tr
                    key={
                      c.id
                    }
                  >

                    <td>
                      <div className="customer-profile-cell">

                        <span className="customer-avatar">
                          {
                            c.name.charAt(
                              0
                            )
                          }
                        </span>

                        <div>

                          <button
                            className="customer-name-btn"
                            onClick={() =>
                              setSelectedCustomer(
                                c
                              )
                            }
                          >
                            {
                              c.name
                            }
                          </button>

                          <small>
                            {
                              c.id
                            }
                          </small>

                        </div>

                      </div>
                    </td>

                    <td>
                      {
                        c.mobile
                      }
                    </td>

                    <td>
                      {
                        c.city
                      }
                    </td>

                    <td>
                      <strong>
                        {
                          c.orders
                        }
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {
                          formatMoney(
                            c.spent
                          )
                        }
                      </strong>
                    </td>

                    <td>
                      <div className="customer-last-order">

                        <strong>
                          {
                            c.lastOrder
                          }
                        </strong>

                        <small>
                          {
                            c.joined
                          }
                        </small>

                      </div>
                    </td>

                    <td>
                      <span
                        className={`customer-status ${c.status.toLowerCase()}`}
                      >
                        {
                          c.status
                        }
                      </span>
                    </td>

                    <td>
                      <button
                        className="customer-view-btn"
                        onClick={() =>
                          setSelectedCustomer(
                            c
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
                  <td colSpan="8">

                    <div className="customers-empty">
                      <div>
                        🔍
                      </div>

                      <h3>
                        No customers found
                      </h3>

                      <p>
                        Try another search or status filter.
                      </p>
                    </div>

                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selectedCustomer && (
        <div
          className="customer-modal-backdrop"
          onClick={() =>
            setSelectedCustomer(
              null
            )
          }
        >

          <div
            className="customer-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="customer-modal-head">

              <div className="customer-modal-user">

                <span className="customer-modal-avatar">
                  {
                    selectedCustomer.name.charAt(
                      0
                    )
                  }
                </span>

                <div>
                  <span>
                    Customer Profile
                  </span>

                  <h2>
                    {
                      selectedCustomer.name
                    }
                  </h2>

                  <small>
                    {
                      selectedCustomer.id
                    }
                  </small>
                </div>

              </div>

              <button
                onClick={() =>
                  setSelectedCustomer(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="customer-modal-status">

              <span
                className={`customer-status ${selectedCustomer.status.toLowerCase()}`}
              >
                {
                  selectedCustomer.status
                }
              </span>

            </div>

            <div className="customer-detail-grid">

              <div>
                <small>
                  Mobile
                </small>

                <strong>
                  {
                    selectedCustomer.mobile
                  }
                </strong>
              </div>

              <div>
                <small>
                  Email
                </small>

                <strong>
                  {
                    selectedCustomer.email
                  }
                </strong>
              </div>

              <div>
                <small>
                  City
                </small>

                <strong>
                  {
                    selectedCustomer.city
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Orders
                </small>

                <strong>
                  {
                    selectedCustomer.orders
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Spent
                </small>

                <strong>
                  {
                    formatMoney(
                      selectedCustomer.spent
                    )
                  }
                </strong>
              </div>

              <div>
                <small>
                  Last Order
                </small>

                <strong>
                  {
                    selectedCustomer.lastOrder
                  }
                </strong>
              </div>

              <div>
                <small>
                  Joined
                </small>

                <strong>
                  {
                    selectedCustomer.joined
                  }
                </strong>
              </div>

              <div className="customer-full-detail">
                <small>
                  Address
                </small>

                <strong>
                  {
                    selectedCustomer.address
                  }
                </strong>
              </div>

            </div>

            <div className="customer-modal-actions">

              <button
                className="customers-secondary-btn"
                onClick={() =>
                  setSelectedCustomer(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default Customers;