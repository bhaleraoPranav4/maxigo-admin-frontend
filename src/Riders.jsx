import { useEffect, useMemo, useState } from "react";
import "./Riders.css";

import {
  getAdminRiders,
  updateRiderVerification,
} from "./api";

function Riders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedRider, setSelectedRider] = useState(null);

  const [riders, setRiders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingVerification, setUpdatingVerification] =
    useState(false);

  // =========================================================
  // LOAD RIDERS FROM BACKEND
  // =========================================================

  const loadRiders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminRiders();

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const normalized = list.map((rider) => {
        const availabilityStatus = String(
          rider?.availabilityStatus ||
            rider?.status ||
            "OFFLINE"
        ).toUpperCase();

        const verificationStatus = String(
          rider?.verificationStatus ||
            "PENDING"
        ).toUpperCase();

        let displayStatus = "Offline";

        if (verificationStatus === "REJECTED") {
          displayStatus = "Blocked";
        } else if (verificationStatus === "PENDING") {
          displayStatus = "Pending";
        } else if (availabilityStatus === "ONLINE") {
          displayStatus = "Online";
        } else {
          displayStatus = "Offline";
        }

        return {
          id:
            rider?.riderCode ||
            `R${rider?.id ?? ""}`,

          riderId: rider?.id,

          userId: rider?.userId,

          name:
            rider?.name ||
            "Rider",

          mobile:
            rider?.mobile ||
            "",

          email:
            rider?.email ||
            "",

          city:
            rider?.city ||
            rider?.address ||
            "—",

          vehicle:
            rider?.vehicleType ||
            "—",

          vehicleNumber:
            rider?.vehicleNumber ||
            "—",

          licenseNumber:
            rider?.licenseNumber ||
            "",

          availabilityStatus,

          verificationStatus,

          status: displayStatus,

          latitude:
            rider?.latitude ?? null,

          longitude:
            rider?.longitude ?? null,

          orders:
            Number(rider?.orders || 0),

          earnings:
            Number(rider?.earnings || 0),

          rating:
            Number(rider?.rating || 0),

          joined:
            rider?.createdAt
              ? new Date(
                  rider.createdAt
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )
              : "—",

          deliveries:
            Number(
              rider?.deliveries ||
                rider?.completedDeliveries ||
                0
            ),
        };
      });

      setRiders(normalized);

      // Keep currently opened rider updated
      if (selectedRider) {
        const freshSelected =
          normalized.find(
            (item) =>
              String(item.riderId) ===
              String(selectedRider.riderId)
          );

        if (freshSelected) {
          setSelectedRider(freshSelected);
        }
      }
    } catch (err) {
      console.error(
        "Admin riders loading error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load riders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = {
    all: riders.length,

    online: riders.filter(
      (r) =>
        r.status === "Online"
    ).length,

    offline: riders.filter(
      (r) =>
        r.status === "Offline"
    ).length,

    pending: riders.filter(
      (r) =>
        r.verificationStatus ===
        "PENDING"
    ).length,

    blocked: riders.filter(
      (r) =>
        r.verificationStatus ===
        "REJECTED"
    ).length,
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filteredRiders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return riders.filter((rider) => {
      const matchesSearch =
        !query ||
        String(rider.id)
          .toLowerCase()
          .includes(query) ||
        String(rider.name)
          .toLowerCase()
          .includes(query) ||
        String(rider.mobile)
          .toLowerCase()
          .includes(query) ||
        String(rider.city)
          .toLowerCase()
          .includes(query) ||
        String(rider.vehicleNumber)
          .toLowerCase()
          .includes(query);

      let matchesStatus = true;

      if (status === "All") {
        matchesStatus = true;
      }

      if (status === "Online") {
        matchesStatus =
          rider.status === "Online";
      }

      if (status === "Offline") {
        matchesStatus =
          rider.status === "Offline";
      }

      if (status === "Pending") {
        matchesStatus =
          rider.verificationStatus ===
          "PENDING";
      }

      if (status === "Blocked") {
        matchesStatus =
          rider.verificationStatus ===
          "REJECTED";
      }

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [riders, search, status]);

  // =========================================================
  // UPDATE VERIFICATION
  // =========================================================

  const handleVerification = async (
    rider,
    verificationStatus
  ) => {
    if (!rider?.riderId) {
      alert(
        "Rider ID not found."
      );
      return;
    }

    let message =
      `Are you sure you want to set ${rider.name} as ${verificationStatus}?`;

    if (
      verificationStatus ===
      "VERIFIED"
    ) {
      message =
        `Verify rider "${rider.name}"?`;
    }

    if (
      verificationStatus ===
      "REJECTED"
    ) {
      message =
        `Reject rider "${rider.name}"?`;
    }

    if (
      verificationStatus ===
      "PENDING"
    ) {
      message =
        `Move rider "${rider.name}" back to Pending?`;
    }

    const confirmed =
      window.confirm(message);

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingVerification(true);

      const response =
        await updateRiderVerification(
          rider.riderId,
          verificationStatus
        );

      console.log(
        "RIDER VERIFICATION UPDATED:",
        response
      );

      // Refresh backend data
      await loadRiders();

      // Update currently opened rider
      if (selectedRider) {
        const freshResponse =
          await getAdminRiders();

        const list =
          Array.isArray(
            freshResponse
          )
            ? freshResponse
            : Array.isArray(
                freshResponse?.data
              )
            ? freshResponse.data
            : [];

        const fresh =
          list.find(
            (item) =>
              String(item?.id) ===
              String(
                rider.riderId
              )
          );

        if (fresh) {
          const freshAvailability =
            String(
              fresh?.availabilityStatus ||
                fresh?.status ||
                "OFFLINE"
            ).toUpperCase();

          const freshVerification =
            String(
              fresh?.verificationStatus ||
                "PENDING"
            ).toUpperCase();

          let freshStatus =
            "Offline";

          if (
            freshVerification ===
            "REJECTED"
          ) {
            freshStatus =
              "Blocked";
          } else if (
            freshVerification ===
            "PENDING"
          ) {
            freshStatus =
              "Pending";
          } else if (
            freshAvailability ===
            "ONLINE"
          ) {
            freshStatus =
              "Online";
          } else {
            freshStatus =
              "Offline";
          }

          setSelectedRider({
            ...rider,

            name:
              fresh?.name ||
              rider.name,

            mobile:
              fresh?.mobile ||
              rider.mobile,

            email:
              fresh?.email ||
              rider.email,

            city:
              fresh?.city ||
              fresh?.address ||
              rider.city,

            vehicle:
              fresh?.vehicleType ||
              rider.vehicle,

            vehicleNumber:
              fresh?.vehicleNumber ||
              rider.vehicleNumber,

            licenseNumber:
              fresh?.licenseNumber ||
              "",

            availabilityStatus:
              freshAvailability,

            verificationStatus:
              freshVerification,

            status:
              freshStatus,

            latitude:
              fresh?.latitude ??
              null,

            longitude:
              fresh?.longitude ??
              null,

            orders:
              Number(
                fresh?.orders || 0
              ),

            earnings:
              Number(
                fresh?.earnings || 0
              ),

            rating:
              Number(
                fresh?.rating || 0
              ),
          });
        }
      }

      alert(
        `Rider verification updated to ${verificationStatus}.`
      );
    } catch (err) {
      console.error(
        "Verification update error:",
        err
      );

      alert(
        err?.message ||
          "Failed to update rider verification."
      );
    } finally {
      setUpdatingVerification(false);
    }
  };

  // =========================================================
  // LIVE LOCATION
  // =========================================================

  const openLiveLocation = (
    rider
  ) => {
    if (
      rider?.latitude == null ||
      rider?.longitude == null
    ) {
      alert(
        "Rider location is not available."
      );
      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1&query=${rider.latitude},${rider.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section className="admin-riders-page">
        <div className="riders-table-card">
          <div className="riders-card-head">
            <div>
              <h2>
                Riders
              </h2>

              <p>
                Loading riders...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <section className="admin-riders-page">
        <div className="riders-table-card">
          <div className="riders-card-head">
            <div>
              <h2>
                Riders
              </h2>

              <p>
                {error}
              </p>
            </div>

            <button
              type="button"
              className="riders-primary-btn"
              onClick={loadRiders}
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <section className="admin-riders-page">

      {/* =====================================================
          TITLE
      ===================================================== */}

      <div className="riders-title-row">

        <div>

          <span className="riders-breadcrumb">
            Admin / Riders
          </span>

          <h1>
            Riders
          </h1>

          <p>
            Manage rider accounts, availability,
            verification and performance.
          </p>

        </div>

        <div className="riders-title-actions">

          <button
            type="button"
            className="riders-secondary-btn"
            onClick={loadRiders}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="riders-secondary-btn"
          >
            ⬇ Export
          </button>

          <button
            type="button"
            className="riders-primary-btn"
          >
            + Add Rider
          </button>

        </div>

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="riders-summary-grid">

        {/* TOTAL */}
        <button
          type="button"
          className={`riders-summary-card ${
            status === "All"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("All")
          }
        >
          <span className="rider-summary-icon purple">
            🛵
          </span>

          <div>
            <small>
              Total Riders
            </small>

            <strong>
              {summary.all}
            </strong>
          </div>
        </button>

        {/* ONLINE */}
        <button
          type="button"
          className={`riders-summary-card ${
            status === "Online"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Online")
          }
        >
          <span className="rider-summary-icon green">
            ●
          </span>

          <div>
            <small>
              Online
            </small>

            <strong>
              {summary.online}
            </strong>
          </div>
        </button>

        {/* OFFLINE */}
        <button
          type="button"
          className={`riders-summary-card ${
            status === "Offline"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Offline")
          }
        >
          <span className="rider-summary-icon gray">
            ○
          </span>

          <div>
            <small>
              Offline
            </small>

            <strong>
              {summary.offline}
            </strong>
          </div>
        </button>

        {/* PENDING */}
        <button
          type="button"
          className={`riders-summary-card ${
            status === "Pending"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Pending")
          }
        >
          <span className="rider-summary-icon orange">
            !
          </span>

          <div>
            <small>
              Pending Verification
            </small>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </button>

        {/* BLOCKED */}
        <button
          type="button"
          className={`riders-summary-card ${
            status === "Blocked"
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setStatus("Blocked")
          }
        >
          <span className="rider-summary-icon red">
            ×
          </span>

          <div>
            <small>
              Blocked
            </small>

            <strong>
              {summary.blocked}
            </strong>
          </div>
        </button>

      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="riders-filter-card">

        <div className="riders-search-box">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search rider, mobile, city or vehicle number..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

        </div>

        <select
          className="riders-select"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="All">
            All
          </option>

          <option value="Online">
            Online
          </option>

          <option value="Offline">
            Offline
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Blocked">
            Blocked
          </option>
        </select>

        <select
          className="riders-select"
          defaultValue="all"
        >
          <option value="all">
            All Cities
          </option>

          <option value="Pune">
            Pune
          </option>

          <option value="Ahilya Nagar">
            Ahilya Nagar
          </option>

          <option value="Nashik">
            Nashik
          </option>

          <option value="Mumbai">
            Mumbai
          </option>
        </select>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="riders-table-card">

        <div className="riders-card-head">

          <div>

            <h2>
              All Riders
            </h2>

            <p>
              Showing{" "}
              {filteredRiders.length}{" "}
              of{" "}
              {riders.length}{" "}
              riders
            </p>

          </div>

          <span className="riders-result-pill">
            {filteredRiders.length} Results
          </span>

        </div>

        <div className="riders-table-wrap">

          <table className="riders-table">

            <thead>

              <tr>

                <th>
                  Rider
                </th>

                <th>
                  Mobile
                </th>

                <th>
                  Vehicle
                </th>

                <th>
                  City
                </th>

                <th>
                  Orders
                </th>

                <th>
                  Earnings
                </th>

                <th>
                  Rating
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

              {filteredRiders.map(
                (rider) => (

                  <tr
                    key={
                      rider.riderId ||
                      rider.id
                    }
                  >

                    {/* RIDER */}
                    <td>

                      <div className="rider-profile-cell">

                        <span className="rider-avatar">
                          {rider.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "R"}
                        </span>

                        <div>

                          <button
                            type="button"
                            className="rider-name-btn"
                            onClick={() =>
                              setSelectedRider(
                                rider
                              )
                            }
                          >
                            {rider.name}
                          </button>

                          <small>
                            {rider.id}
                          </small>

                        </div>

                      </div>

                    </td>

                    {/* MOBILE */}
                    <td>
                      {rider.mobile}
                    </td>

                    {/* VEHICLE */}
                    <td>

                      <div className="vehicle-cell">

                        <strong>
                          {rider.vehicle}
                        </strong>

                        <small>
                          {rider.vehicleNumber}
                        </small>

                      </div>

                    </td>

                    {/* CITY */}
                    <td>
                      {rider.city}
                    </td>

                    {/* ORDERS */}
                    <td>
                      <strong>
                        {rider.orders}
                      </strong>
                    </td>

                    {/* EARNINGS */}
                    <td>
                      <strong>
                        ₹
                        {rider.earnings.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* RATING */}
                    <td>

                      {rider.rating > 0 ? (

                        <span className="rating-pill">
                          ★{" "}
                          {rider.rating}
                        </span>

                      ) : (

                        <span className="rating-na">
                          N/A
                        </span>

                      )}

                    </td>

                    {/* STATUS */}
                    <td>

                      <span
                        className={`rider-status ${
                          rider.status.toLowerCase()
                        }`}
                      >
                        {rider.status}
                      </span>

                    </td>

                    {/* ACTIONS */}
                    <td>

                      <div className="rider-action-buttons">

                        {/* VIEW */}
                        <button
                          type="button"
                          className="rider-view-btn"
                          onClick={() =>
                            setSelectedRider(
                              rider
                            )
                          }
                        >
                          View
                        </button>

                        {/* VERIFY ONLY FOR PENDING */}
                        {rider.verificationStatus ===
                          "PENDING" && (

                          <button
                            type="button"
                            className="rider-verify-btn"
                            disabled={
                              updatingVerification
                            }
                            onClick={() =>
                              handleVerification(
                                rider,
                                "VERIFIED"
                              )
                            }
                          >
                            ✓ Verify
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )
              )}

              {/* NO DATA */}
              {filteredRiders.length ===
                0 && (

                <tr>

                  <td colSpan="9">

                    <div className="riders-empty">

                      <div>
                        🔍
                      </div>

                      <h3>
                        No riders found
                      </h3>

                      <p>
                        Try another search or
                        status filter.
                      </p>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          RIDER MODAL
      ===================================================== */}

      {selectedRider && (

        <div
          className="rider-modal-backdrop"
          onClick={() =>
            setSelectedRider(null)
          }
        >

          <div
            className="rider-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="rider-modal-head">

              <div className="rider-modal-user">

                <span className="rider-modal-avatar">
                  {selectedRider.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "R"}
                </span>

                <div>

                  <span>
                    Rider Profile
                  </span>

                  <h2>
                    {selectedRider.name}
                  </h2>

                  <small>
                    {selectedRider.id}
                  </small>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRider(
                    null
                  )
                }
                aria-label="Close"
              >
                ✕
              </button>

            </div>

            {/* =================================================
                STATUS
            ================================================= */}

            <div className="rider-modal-status">

              <span
                className={`rider-status ${
                  selectedRider.status.toLowerCase()
                }`}
              >
                {selectedRider.status}
              </span>

            </div>

            {/* =================================================
                DETAILS
            ================================================= */}

            <div className="rider-detail-grid">

              <div>
                <small>
                  Mobile
                </small>

                <strong>
                  {selectedRider.mobile ||
                    "—"}
                </strong>
              </div>

              <div>
                <small>
                  Email
                </small>

                <strong>
                  {selectedRider.email ||
                    "—"}
                </strong>
              </div>

              <div>
                <small>
                  City
                </small>

                <strong>
                  {selectedRider.city ||
                    "—"}
                </strong>
              </div>

              <div>
                <small>
                  Vehicle
                </small>

                <strong>
                  {selectedRider.vehicle}{" "}
                  •{" "}
                  {
                    selectedRider.vehicleNumber
                  }
                </strong>
              </div>

              <div>
                <small>
                  License Number
                </small>

                <strong>
                  {selectedRider.licenseNumber ||
                    "Not Added"}
                </strong>
              </div>

              <div>
                <small>
                  Verification
                </small>

                <strong>
                  {
                    selectedRider.verificationStatus
                  }
                </strong>
              </div>

              <div>
                <small>
                  Availability
                </small>

                <strong>
                  {
                    selectedRider.availabilityStatus
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Orders
                </small>

                <strong>
                  {selectedRider.orders}
                </strong>
              </div>

              <div>
                <small>
                  Completed Deliveries
                </small>

                <strong>
                  {
                    selectedRider.deliveries
                  }
                </strong>
              </div>

              <div>
                <small>
                  Total Earnings
                </small>

                <strong>
                  ₹
                  {selectedRider.earnings.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Rating
                </small>

                <strong>
                  {selectedRider.rating
                    ? `★ ${selectedRider.rating}`
                    : "Not Rated"}
                </strong>
              </div>

              <div className="rider-full-detail">

                <small>
                  Joined
                </small>

                <strong>
                  {
                    selectedRider.joined
                  }
                </strong>

              </div>

            </div>

            {/* =================================================
                VERIFICATION BUTTONS
            ================================================= */}

            <div
              className="rider-verification-actions"
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "20px",
              }}
            >

              {/* VERIFY */}
              <button
                type="button"
                className="riders-primary-btn"
                disabled={
                  updatingVerification ||
                  selectedRider.verificationStatus ===
                    "VERIFIED"
                }
                onClick={() =>
                  handleVerification(
                    selectedRider,
                    "VERIFIED"
                  )
                }
              >
                ✓ Verify Rider
              </button>

              {/* REJECT */}
              <button
                type="button"
                className="riders-secondary-btn"
                disabled={
                  updatingVerification ||
                  selectedRider.verificationStatus ===
                    "REJECTED"
                }
                onClick={() =>
                  handleVerification(
                    selectedRider,
                    "REJECTED"
                  )
                }
              >
                ✕ Reject Rider
              </button>

              {/* PENDING */}
              <button
                type="button"
                className="riders-secondary-btn"
                disabled={
                  updatingVerification ||
                  selectedRider.verificationStatus ===
                    "PENDING"
                }
                onClick={() =>
                  handleVerification(
                    selectedRider,
                    "PENDING"
                  )
                }
              >
                ↻ Set Pending
              </button>

            </div>

            {/* =================================================
                MODAL ACTIONS
            ================================================= */}

            <div className="rider-modal-actions">

              <button
                type="button"
                className="riders-secondary-btn"
                onClick={() =>
                  setSelectedRider(
                    null
                  )
                }
              >
                Close
              </button>

              {/* LIVE LOCATION */}
              {selectedRider.status ===
                "Online" && (

                <button
                  type="button"
                  className="riders-primary-btn"
                  onClick={() =>
                    openLiveLocation(
                      selectedRider
                    )
                  }
                >
                  🗺️ View Live Location
                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </section>
  );
}

export default Riders;