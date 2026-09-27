import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Payments.css";

import {
  getAdminPayments,
  createAdminRefund,
  toArray,
  formatMoney,
  formatDateTime,
} from "./api";

const money = (
  value
) =>
  formatMoney(
    value
  );

function Payments() {

  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "ALL"
  );

  const [
    methodFilter,
    setMethodFilter,
  ] = useState(
    "ALL"
  );

  const [
    selectedPayment,
    setSelectedPayment,
  ] = useState(
    null
  );

  const [
    toast,
    setToast,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    refundLoading,
    setRefundLoading,
  ] = useState(
    false
  );

  const load =
    async () => {

      setLoading(
        true
      );

      setError("");

      try {

        const data =
          await getAdminPayments();

        setPayments(
          toArray(
            data
          )
        );

      } catch (e) {

        setError(
          e.message ||
          "Unable to load payments."
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

  const normalized =
    useMemo(
      () =>
        payments.map(
          (p) => {

            const dt =
              formatDateTime(
                p.createdAt
              );

            return {
              ...p,

              viewId:
                `PAY-${String(
                  p.id
                ).padStart(
                  4,
                  "0"
                )}`,

              orderView:
                p.orderNumber
                  ? p.orderNumber
                  : `#${p.orderId ?? "—"}`,

              customer:
                p.customerName ||
                "—",

              customerMobile:
                p.customerMobile ||
                "—",

              store:
                p.storeName ||
                "—",

              method:
                String(
                  p.paymentMethod ||
                  "—"
                ).toUpperCase(),

              amount:
                Number(
                  p.amount ||
                  0
                ),

              commission: 0,

              netAmount:
                Number(
                  p.amount ||
                  0
                ),

              status:
                String(
                  p.paymentStatus ||
                  "PENDING"
                ).toUpperCase(),

              date:
                dt.date,

              time:
                dt.time,

              transactionId:
                p.transactionId ||
                "—",
            };
          }
        ),
      [payments]
    );

  const stats =
    useMemo(
      () => {

        const filterStatus =
          (
            value
          ) =>
            normalized.filter(
              (p) =>
                p.status ===
                value
            );

        return {

          total:
            normalized.reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.amount,
              0
            ),

          successful:
            filterStatus(
              "SUCCESS"
            ).reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.amount,
              0
            ),

          pending:
            filterStatus(
              "PENDING"
            ).reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.amount,
              0
            ),

          refunded:
            filterStatus(
              "REFUNDED"
            ).reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.amount,
              0
            ),

          failed:
            filterStatus(
              "FAILED"
            ).reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.amount,
              0
            ),

          successfulCount:
            filterStatus(
              "SUCCESS"
            ).length,
        };
      },
      [normalized]
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
                p.viewId,
                p.orderView,
                p.customer,
                p.store,
                p.transactionId,
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
              statusFilter ===
                "ALL" ||
              p.status ===
                statusFilter
            ) &&
            (
              methodFilter ===
                "ALL" ||
              p.method ===
                methodFilter
            )
        );
      },
      [
        normalized,
        search,
        statusFilter,
        methodFilter,
      ]
    );

  const showToast =
    (message) => {

      setToast(
        message
      );

      window.clearTimeout(
        window.__maxigoPaymentToast
      );

      window.__maxigoPaymentToast =
        window.setTimeout(
          () =>
            setToast(""),
          2200
        );
    };

  const refundPayment =
    async (payment) => {

      const amount =
        window.prompt(
          "Refund amount",
          String(
            payment.amount
          )
        );

      if (
        amount === null
      ) {
        return;
      }

      const reason =
        window.prompt(
          "Refund reason"
        ) ||
        "Admin refund request";

      try {

        setRefundLoading(
          true
        );

        await createAdminRefund({
          paymentId:
            payment.id,

          refundAmount:
            Number(
              amount
            ),

          reason,
        });

        showToast(
          "Refund request created successfully."
        );

      } catch (e) {

        showToast(
          e.message ||
          "Refund request failed."
        );

      } finally {

        setRefundLoading(
          false
        );
      }
    };

  const exportPayments =
    () => {

      const headers = [
        "Payment ID",
        "Order ID",
        "Customer",
        "Store",
        "Method",
        "Amount",
        "Status",
        "Date",
        "Time",
        "Transaction ID",
      ];

      const rows =
        filtered.map(
          (p) => [
            p.viewId,
            p.orderView,
            p.customer,
            p.store,
            p.method,
            p.amount,
            p.status,
            p.date,
            p.time,
            p.transactionId,
          ]
        );

      const csv =
        [
          headers,
          ...rows,
        ]
          .map(
            (row) =>
              row
                .map(
                  (value) =>
                    `"${String(
                      value
                    ).replaceAll(
                      '"',
                      '""'
                    )}"`
                )
                .join(",")
          )
          .join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        "maxigo-payments.csv";

      link.click();

      URL.revokeObjectURL(
        url
      );

      showToast(
        "Payments CSV exported."
      );
    };

  if (loading) {
    return (
      <div className="admin-payments-page">

        <div className="payment-table-card">

          <div className="payment-table-title">

            <h2>
              Loading payments...
            </h2>

          </div>

        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-payments-page">

        <div className="payment-table-card">

          <div className="payment-table-title">

            <h2>
              Payments error
            </h2>

            <p>
              {
                error
              }
            </p>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="admin-payments-page">

      <div className="payments-header">

        <div>

          <h1>
            Payments
          </h1>

          <p>
            Monitor customer payments, gateway transactions, refunds and payment status.
          </p>

        </div>

        <button
          className="payments-export-btn"
          onClick={
            exportPayments
          }
        >
          ⇩ Export CSV
        </button>

      </div>

      <div className="payment-stat-grid">

        <div className="payment-stat-card">

          <div className="payment-stat-icon total">
            ₹
          </div>

          <div>

            <span>
              Total Payment Value
            </span>

            <strong>
              {
                money(
                  stats.total
                )
              }
            </strong>

            <small>
              {
                normalized.length
              }{" "}
              transactions
            </small>

          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon success">
            ✓
          </div>

          <div>

            <span>
              Successful
            </span>

            <strong>
              {
                money(
                  stats.successful
                )
              }
            </strong>

            <small>
              {
                stats.successfulCount
              }{" "}
              successful payments
            </small>

          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon pending">
            ◷
          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {
                money(
                  stats.pending
                )
              }
            </strong>

            <small>
              Awaiting confirmation
            </small>

          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon refund">
            ↩
          </div>

          <div>

            <span>
              Refunded
            </span>

            <strong>
              {
                money(
                  stats.refunded
                )
              }
            </strong>

            <small>
              Refunded transactions
            </small>

          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon failed">
            !
          </div>

          <div>

            <span>
              Failed
            </span>

            <strong>
              {
                money(
                  stats.failed
                )
              }
            </strong>

            <small>
              Failed transactions
            </small>

          </div>

        </div>

      </div>

      <div className="payment-toolbar">

        <div className="payment-search-wrap">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search payment, order, customer, store..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <select
          value={
            statusFilter
          }
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >
          <option value="ALL">
            All Status
          </option>

          <option value="SUCCESS">
            Success
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="REFUNDED">
            Refunded
          </option>

          <option value="FAILED">
            Failed
          </option>
        </select>

        <select
          value={
            methodFilter
          }
          onChange={(e) =>
            setMethodFilter(
              e.target.value
            )
          }
        >
          <option value="ALL">
            All Methods
          </option>

          <option value="UPI">
            UPI
          </option>

          <option value="CARD">
            Card
          </option>

          <option value="COD">
            COD
          </option>

          <option value="WALLET">
            Wallet
          </option>
        </select>

      </div>

      <div className="payment-table-card">

        <div className="payment-table-title">

          <h2>
            Payment Transactions
          </h2>

          <p>
            {
              filtered.length
            }{" "}
            transaction(s) found
          </p>

        </div>

        <div className="payment-table-scroll">

          <table>

            <thead>
              <tr>
                <th>
                  Payment
                </th>

                <th>
                  Order
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Store
                </th>

                <th>
                  Method
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date & Time
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                (p) => (
                  <tr
                    key={
                      p.id
                    }
                  >

                    <td>

                      <div className="payment-id-cell">

                        <strong>
                          {
                            p.viewId
                          }
                        </strong>

                        <small>
                          {
                            p.transactionId
                          }
                        </small>

                      </div>

                    </td>

                    <td className="strong-cell">
                      {
                        p.orderView
                      }
                    </td>

                    <td>
                      {
                        p.customer
                      }
                    </td>

                    <td>
                      {
                        p.store
                      }
                    </td>

                    <td>
                      <span className="payment-method">
                        {
                          p.method
                        }
                      </span>
                    </td>

                    <td className="amount-cell">
                      {
                        money(
                          p.amount
                        )
                      }
                    </td>

                    <td>

                      <span
                        className={`payment-status ${p.status.toLowerCase()}`}
                      >
                        {
                          p.status
                        }
                      </span>

                    </td>

                    <td>

                      <div className="payment-date">

                        <strong>
                          {
                            p.date
                          }
                        </strong>

                        <small>
                          {
                            p.time
                          }
                        </small>

                      </div>

                    </td>

                    <td>

                      <button
                        className="payment-view-btn"
                        onClick={() =>
                          setSelectedPayment(
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
                  <td
                    colSpan="9"
                    className="payment-empty"
                  >
                    No payment transactions found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selectedPayment && (
        <div
          className="payment-modal-backdrop"
          onClick={() =>
            setSelectedPayment(
              null
            )
          }
        >

          <div
            className="payment-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="payment-modal-header">

              <div>

                <span className="modal-kicker">
                  Payment Details
                </span>

                <h2>
                  {
                    selectedPayment.viewId
                  }
                </h2>

                <p>
                  {
                    selectedPayment.transactionId
                  }
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedPayment(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="payment-detail-grid">

              <div>
                <span>
                  Order ID
                </span>

                <strong>
                  {
                    selectedPayment.orderView
                  }
                </strong>
              </div>

              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {
                    selectedPayment.customer
                  }
                </strong>
              </div>

              <div>
                <span>
                  Mobile
                </span>

                <strong>
                  {
                    selectedPayment.customerMobile
                  }
                </strong>
              </div>

              <div>
                <span>
                  Store
                </span>

                <strong>
                  {
                    selectedPayment.store
                  }
                </strong>
              </div>

              <div>
                <span>
                  Payment Method
                </span>

                <strong>
                  {
                    selectedPayment.method
                  }
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong>
                  {
                    selectedPayment.status
                  }
                </strong>
              </div>

              <div>
                <span>
                  Order Amount
                </span>

                <strong>
                  {
                    money(
                      selectedPayment.amount
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Gateway
                </span>

                <strong>
                  {
                    selectedPayment.gateway ||
                    "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Commission
                </span>

                <strong>
                  {
                    money(
                      selectedPayment.commission
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Paid At
                </span>

                <strong>
                  {
                    formatDateTime(
                      selectedPayment.paidAt
                    ).date
                  }{" "}
                  {
                    formatDateTime(
                      selectedPayment.paidAt
                    ).time
                  }
                </strong>
              </div>

            </div>

            <div className="payment-modal-actions">

              <button
                className="secondary-btn"
                onClick={() =>
                  setSelectedPayment(
                    null
                  )
                }
              >
                Close
              </button>

              {selectedPayment.status ===
                "SUCCESS" && (
                <button
                  className="danger-btn"
                  disabled={
                    refundLoading
                  }
                  onClick={() =>
                    refundPayment(
                      selectedPayment
                    )
                  }
                >
                  {
                    refundLoading
                      ? "Creating..."
                      : "Refund Request"
                  }
                </button>
              )}

            </div>

          </div>

        </div>
      )}

      {toast && (
        <div className="payment-toast">
          {
            toast
          }
        </div>
      )}

    </div>
  );
}

export default Payments;