import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Patyout.css";

import {
  getAdminPayouts,
  getAdminSettlements,
  updateAdminPayoutStatus,
  updateAdminSettlementStatus,
  toArray,
  formatMoney,
  formatDateTime,
} from "./api";

function Patyout() {

  const [
    payouts,
    setPayouts,
  ] = useState([]);

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "ALL"
  );

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
    cityFilter,
    setCityFilter,
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
    selectedPayout,
    setSelectedPayout,
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

  const load =
    async () => {

      setLoading(
        true
      );

      setError("");

      try {

        const [
          payoutData,
          settlementData,
        ] =
          await Promise.all([
            getAdminPayouts(),
            getAdminSettlements(),
          ]);

        const riderPayouts =
          toArray(
            payoutData
          ).map(
            (p) => ({
              ...p,

              recordType:
                "PAYOUT",

              id:
                `PAY-${p.id}`,

              rawId:
                p.id,

              type:
                String(
                  p.beneficiaryType ||
                  "RIDER"
                ).toUpperCase(),

              beneficiary:
                p.beneficiaryName ||
                "—",

              mobile:
                p.mobile ||
                "—",

              city:
                p.city ||
                "—",

              settlementPeriod:
                formatDateTime(
                  p.requestedAt
                ).date,

              orders:
                1,

              gross:
                Number(
                  p.amount ||
                  0
                ),

              commission:
                0,

              deductions:
                0,

              refundAdjustment:
                0,

              tax:
                0,

              net:
                Number(
                  p.amount ||
                  0
                ),

              method:
                String(
                  p.paymentMethod ||
                  "—"
                ).toUpperCase(),

              bankName:
                p.bankName ||
                "",

              accountLast4:
                p.accountLast4 ||
                "",

              ifsc:
                p.ifsc ||
                "",

              upi:
                p.upiId ||
                "",

              status:
                String(
                  p.payoutStatus ||
                  "PENDING"
                ).toUpperCase(),

              settlementDate:
                formatDateTime(
                  p.paidAt ||
                  p.processedAt ||
                  p.requestedAt
                ).date,

              reference:
                p.referenceNumber ||
                "—",

              failureReason:
                p.failureReason ||
                "",
            })
          );

        const storeSettlements =
          toArray(
            settlementData
          ).map(
            (s) => ({
              ...s,

              recordType:
                "SETTLEMENT",

              id:
                `STL-${s.id}`,

              rawId:
                s.id,

              type:
                "STORE",

              beneficiary:
                s.storeName ||
                "—",

              mobile:
                "—",

              city:
                "—",

              settlementPeriod:
                formatDateTime(
                  s.createdAt
                ).date,

              orders:
                1,

              gross:
                Number(
                  s.grossOrderValue ||
                  0
                ),

              commission:
                Number(
                  s.maxigoCommission ||
                  0
                ),

              deductions:
                Number(
                  s.maxigoCommission ||
                  0
                ) +
                Number(
                  s.otherDeductions ||
                  0
                ) +
                Number(
                  s.refundAdjustment ||
                  0
                ),

              refundAdjustment:
                Number(
                  s.refundAdjustment ||
                  0
                ),

              tax:
                Number(
                  s.tax ||
                  0
                ),

              net:
                Number(
                  s.netSettlement ||
                  0
                ),

              method:
                "BANK",

              bankName:
                "",

              accountLast4:
                "",

              ifsc:
                "",

              upi:
                "",

              status:
                String(
                  s.settlementStatus ||
                  "PENDING"
                ).toUpperCase(),

              settlementDate:
                formatDateTime(
                  s.settlementDate ||
                  s.createdAt
                ).date,

              reference:
                s.orderNumber
                  ? `Order ${s.orderNumber}`
                  : "—",

              failureReason:
                "",
            })
          );

        setPayouts(
          [
            ...riderPayouts,
            ...storeSettlements,
          ]
        );

      } catch (e) {

        setError(
          e.message ||
          "Unable to load payouts."
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

  const cities =
    useMemo(
      () => [
        "ALL",
        ...new Set(
          payouts
            .map(
              (p) =>
                p.city
            )
            .filter(
              (c) =>
                c &&
                c !== "—"
            )
        ),
      ],
      [payouts]
    );

  const visible =
    useMemo(
      () => {

        const q =
          search
            .trim()
            .toLowerCase();

        return payouts.filter(
          (p) =>
            (
              activeTab ===
                "ALL" ||
              p.type ===
                activeTab
            ) &&
            (
              !q ||
              [
                p.id,
                p.beneficiary,
                p.mobile,
                p.city,
                p.reference,
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
              cityFilter ===
                "ALL" ||
              p.city ===
                cityFilter
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
        payouts,
        activeTab,
        search,
        statusFilter,
        cityFilter,
        methodFilter,
      ]
    );

  const totals =
    useMemo(
      () => ({
        riderCount:
          payouts.filter(
            (p) =>
              p.type ===
              "RIDER"
          ).length,

        storeCount:
          payouts.filter(
            (p) =>
              p.type ===
              "STORE"
          ).length,

        riderAmount:
          payouts
            .filter(
              (p) =>
                p.type ===
                "RIDER"
            )
            .reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.net,
              0
            ),

        storeAmount:
          payouts
            .filter(
              (p) =>
                p.type ===
                "STORE"
            )
            .reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.net,
              0
            ),

        pendingAmount:
          payouts
            .filter(
              (p) =>
                p.status ===
                "PENDING"
            )
            .reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.net,
              0
            ),

        paidAmount:
          payouts
            .filter(
              (p) =>
                p.status ===
                  "PAID" ||
                p.status ===
                  "SUCCESS"
            )
            .reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.net,
              0
            ),

        failedAmount:
          payouts
            .filter(
              (p) =>
                p.status ===
                "FAILED"
            )
            .reduce(
              (
                sum,
                p
              ) =>
                sum +
                p.net,
              0
            ),
      }),
      [payouts]
    );

  const showToast =
    (message) => {

      setToast(
        message
      );

      window.clearTimeout(
        window.__maxigoPayoutToast
      );

      window.__maxigoPayoutToast =
        window.setTimeout(
          () =>
            setToast(""),
          2200
        );
    };

  const changeStatus =
    async (
      record,
      status
    ) => {

      try {

        let result;

        if (
          record.recordType ===
          "PAYOUT"
        ) {

          result =
            await updateAdminPayoutStatus(
              record.rawId,
              status,
              status ===
                "PAID"
                ? `UTR${Date.now()
                    .toString()
                    .slice(
                      -8
                    )}`
                : undefined
            );

        } else {

          result =
            await updateAdminSettlementStatus(
              record.rawId,
              status
            );
        }

        setPayouts(
          (current) =>
            current.map(
              (p) =>
                p.id ===
                record.id
                  ? {
                      ...p,

                      status:
                        String(
                          result?.payoutStatus ||
                          result?.settlementStatus ||
                          status
                        ).toUpperCase(),

                      reference:
                        result?.referenceNumber ||
                        p.reference,

                      settlementDate:
                        formatDateTime(
                          result?.paidAt ||
                          result?.settlementDate ||
                          new Date()
                        ).date,
                    }
                  : p
            )
        );

        setSelectedPayout(
          (current) =>
            current &&
            current.id ===
              record.id
              ? {
                  ...current,
                  status,
                }
              : current
        );

        showToast(
          `Status updated to ${status}.`
        );

      } catch (e) {

        showToast(
          e.message ||
          "Unable to update status."
        );
      }
    };

  if (loading) {
    return (
      <div className="admin-payout-page">

        <div className="payout-table-card">

          <div className="payout-table-header">

            <h2>
              Loading payouts...
            </h2>

          </div>

        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-payout-page">

        <div className="payout-table-card">

          <div className="payout-table-header">

            <h2>
              Payouts error
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
    <div className="admin-payout-page">

      <div className="payout-page-header">

        <span className="payout-breadcrumb">
          Admin / Finance / Payouts
        </span>

        <h1>
          Payouts & Settlements
        </h1>

        <p>
          Rider payouts आणि Store settlements स्वतंत्रपणे manage करा.
        </p>

      </div>

      <div className="payout-summary-grid">

        <div className="payout-summary-card purple">
          <span>
            Total Rider Payout
          </span>

          <strong>
            {
              formatMoney(
                totals.riderAmount
              )
            }
          </strong>

          <small>
            {
              totals.riderCount
            }{" "}
            rider records
          </small>
        </div>

        <div className="payout-summary-card blue">
          <span>
            Total Store Settlement
          </span>

          <strong>
            {
              formatMoney(
                totals.storeAmount
              )
            }
          </strong>

          <small>
            {
              totals.storeCount
            }{" "}
            store records
          </small>
        </div>

        <div className="payout-summary-card orange">
          <span>
            Pending
          </span>

          <strong>
            {
              formatMoney(
                totals.pendingAmount
              )
            }
          </strong>

          <small>
            Waiting for processing
          </small>
        </div>

        <div className="payout-summary-card green">
          <span>
            Paid
          </span>

          <strong>
            {
              formatMoney(
                totals.paidAmount
              )
            }
          </strong>

          <small>
            Completed payouts
          </small>
        </div>

        <div className="payout-summary-card red">
          <span>
            Failed
          </span>

          <strong>
            {
              formatMoney(
                totals.failedAmount
              )
            }
          </strong>

          <small>
            Needs retry
          </small>
        </div>

      </div>

      <div className="payout-tabs">

        <button
          className={
            activeTab ===
            "ALL"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "ALL"
            )
          }
        >
          All Payouts
        </button>

        <button
          className={
            activeTab ===
            "RIDER"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "RIDER"
            )
          }
        >
          🛵 Rider Payouts{" "}
          <span>
            {
              totals.riderCount
            }
          </span>
        </button>

        <button
          className={
            activeTab ===
            "STORE"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "STORE"
            )
          }
        >
          🏪 Store Settlements{" "}
          <span>
            {
              totals.storeCount
            }
          </span>
        </button>

      </div>

      <div className="payout-filters">

        <div className="payout-search">

          <span>
            ⌕
          </span>

          <input
            placeholder="Search payout, order, rider or store..."
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

          <option value="PENDING">
            Pending
          </option>

          <option value="PROCESSING">
            Processing
          </option>

          <option value="PAID">
            Paid
          </option>

          <option value="SUCCESS">
            Success
          </option>

          <option value="FAILED">
            Failed
          </option>
        </select>

        <select
          value={
            cityFilter
          }
          onChange={(e) =>
            setCityFilter(
              e.target.value
            )
          }
        >

          <option value="ALL">
            All Cities
          </option>

          {cities
            .filter(
              (c) =>
                c !==
                "ALL"
            )
            .map(
              (c) => (
                <option
                  key={c}
                >
                  {
                    c
                  }
                </option>
              )
            )}

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

          <option value="BANK">
            Bank
          </option>

          <option value="UPI">
            UPI
          </option>

          <option value="COD">
            COD
          </option>

        </select>

      </div>

      <div className="payout-table-card">

        <div className="payout-table-header">

          <div>

            <h2>
              {
                activeTab ===
                "RIDER"
                  ? "Rider Payouts"
                  : activeTab ===
                    "STORE"
                    ? "Store Settlements"
                    : "All Payouts"
              }
            </h2>

            <p>
              {
                visible.length
              }{" "}
              records found
            </p>

          </div>

          <div className="payout-header-flow">

            <span>
              Customer Payment
            </span>

            <b>
              →
            </b>

            <span>
              Settlement
            </span>

          </div>

        </div>

        <div className="payout-table-scroll">

          <table>

            <thead>
              <tr>

                <th>
                  Payout ID
                </th>

                <th>
                  Beneficiary
                </th>

                <th>
                  Order
                </th>

                <th>
                  Period
                </th>

                <th>
                  Orders
                </th>

                <th>
                  Gross
                </th>

                <th>
                  Deduction
                </th>

                <th>
                  Net Payout
                </th>

                <th>
                  Method
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {visible.map(
                (p) => (
                  <tr
                    key={p.id}
                  >

                    <td>

                      <div className="payout-id">

                        <strong>
                          {
                            p.id
                          }
                        </strong>

                        <small>
                          {
                            p.reference
                          }
                        </small>

                      </div>

                    </td>

                    <td>

                      <div className="beneficiary">

                        <strong>
                          {
                            p.beneficiary
                          }
                        </strong>

                        <small>
                          {
                            p.mobile
                          }{" "}
                          ·{" "}
                          {
                            p.city
                          }
                        </small>

                      </div>

                    </td>

                    <td className="order-id">
                      {
                        p.orderNumber ||
                        p.orderId ||
                        "—"
                      }
                    </td>

                    <td>
                      {
                        p.settlementPeriod
                      }
                    </td>

                    <td className="center-number">
                      {
                        p.orders
                      }
                    </td>

                    <td>
                      {
                        formatMoney(
                          p.gross
                        )
                      }
                    </td>

                    <td className="deduction">
                      -
                      {
                        formatMoney(
                          p.deductions
                        )
                      }
                    </td>

                    <td className="net">
                      {
                        formatMoney(
                          p.net
                        )
                      }
                    </td>

                    <td>
                      <span className="method">
                        {
                          p.method
                        }
                      </span>
                    </td>

                    <td>

                      <span
                        className={`status ${p.status.toLowerCase()}`}
                      >
                        {
                          p.status
                        }
                      </span>

                    </td>

                    <td>

                      <button
                        className="view-detail-btn"
                        onClick={() =>
                          setSelectedPayout(
                            p
                          )
                        }
                      >
                        View Details
                      </button>

                    </td>

                  </tr>
                )
              )}

              {!visible.length && (
                <tr>
                  <td
                    colSpan="11"
                    className="payout-empty"
                  >
                    No payout records found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selectedPayout && (
        <div
          className="payout-modal-backdrop"
          onClick={() =>
            setSelectedPayout(
              null
            )
          }
        >

          <div
            className="payout-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="detail-modal-header">

              <div>

                <span className="detail-kicker">
                  {
                    selectedPayout.type ===
                    "RIDER"
                      ? "Rider Payout"
                      : "Store Settlement"
                  }
                </span>

                <h2>
                  {
                    selectedPayout.beneficiary
                  }
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedPayout(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="detail-section">

              <h3>
                Settlement Summary
              </h3>

              <div className="detail-grid">

                <div>
                  <span>
                    Gross
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedPayout.gross
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    MaxiGo Commission
                  </span>

                  <strong className="negative">
                    -
                    {
                      formatMoney(
                        selectedPayout.commission
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Refund Adjustment
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedPayout.refundAdjustment
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Tax / TDS
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedPayout.tax
                      )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Other Deductions
                  </span>

                  <strong className="negative">
                    -
                    {
                      formatMoney(
                        Math.max(
                          0,
                          selectedPayout.deductions -
                          selectedPayout.commission
                        )
                      )
                    }
                  </strong>
                </div>

                <div className="final-amount">

                  <span>
                    Final Settlement
                  </span>

                  <strong>
                    {
                      formatMoney(
                        selectedPayout.net
                      )
                    }
                  </strong>

                </div>

              </div>

            </div>

            <div className="detail-section">

              <h3>
                Payment Details
              </h3>

              <div className="detail-grid">

                <div>
                  <span>
                    Payment Method
                  </span>

                  <strong>
                    {
                      selectedPayout.method
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      selectedPayout.status
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Settlement Date
                  </span>

                  <strong>
                    {
                      selectedPayout.settlementDate
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Reference
                  </span>

                  <strong>
                    {
                      selectedPayout.reference
                    }
                  </strong>
                </div>

                {selectedPayout.method ===
                  "BANK" && (
                  <>
                    <div>
                      <span>
                        Bank
                      </span>

                      <strong>
                        {
                          selectedPayout.bankName ||
                          "—"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Account
                      </span>

                      <strong>
                        {
                          selectedPayout.accountLast4
                            ? `**** ${selectedPayout.accountLast4}`
                            : "—"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        IFSC
                      </span>

                      <strong>
                        {
                          selectedPayout.ifsc ||
                          "—"
                        }
                      </strong>
                    </div>
                  </>
                )}

              </div>

            </div>

            {selectedPayout.failureReason && (
              <div className="failure-box">

                <strong>
                  Payout Failed
                </strong>

                <span>
                  {
                    selectedPayout.failureReason
                  }
                </span>

              </div>
            )}

            <div className="modal-actions">

              <button
                className="secondary-btn"
                onClick={() =>
                  setSelectedPayout(
                    null
                  )
                }
              >
                Close
              </button>

              {selectedPayout.status ===
                "PENDING" && (
                <button
                  className="primary-btn"
                  onClick={() =>
                    changeStatus(
                      selectedPayout,
                      "PROCESSING"
                    )
                  }
                >
                  Process
                </button>
              )}

              {selectedPayout.status ===
                "PROCESSING" && (
                <button
                  className="primary-btn"
                  onClick={() =>
                    changeStatus(
                      selectedPayout,
                      "PAID"
                    )
                  }
                >
                  Mark Paid
                </button>
              )}

              {selectedPayout.status ===
                "FAILED" && (
                <button
                  className="primary-btn"
                  onClick={() =>
                    changeStatus(
                      selectedPayout,
                      "PROCESSING"
                    )
                  }
                >
                  Retry
                </button>
              )}

            </div>

          </div>

        </div>
      )}

      {toast && (
        <div className="payout-toast">
          {
            toast
          }
        </div>
      )}

    </div>
  );
}

export default Patyout;