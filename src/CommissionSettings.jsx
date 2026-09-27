import React, {
  useEffect,
  useState,
} from "react";

import "./CommissionSettings.css";

import {
  getCurrentCommission,
  getCommissionHistory,
  updateCommission,
} from "./api";

function CommissionSettings() {

  const [
    current,
    setCurrent,
  ] = useState(null);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    value,
    setValue,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const load =
    async () => {

      setLoading(
        true
      );

      setError("");

      try {

        const [
          currentData,
          historyData,
        ] =
          await Promise.all([
            getCurrentCommission(),
            getCommissionHistory(),
          ]);

        setCurrent(
          currentData ||
          null
        );

        setValue(
          currentData?.commissionPercent !=
            null
            ? String(
                currentData.commissionPercent
              )
            : "10"
        );

        setHistory(
          Array.isArray(
            historyData
          )
            ? historyData
            : []
        );

      } catch (e) {

        setError(
          e?.message ||
          "Unable to load commission settings."
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

  const handleSave =
    async (
      e
    ) => {

      e.preventDefault();

      setError("");
      setMessage("");

      const percent =
        Number(
          value
        );

      if (
        !Number.isFinite(
          percent
        )
      ) {
        setError(
          "Please enter a valid commission percentage."
        );
        return;
      }

      if (
        percent <
          0 ||
        percent >
          100
      ) {
        setError(
          "Commission must be between 0% and 100%."
        );
        return;
      }

      setSaving(
        true
      );

      try {

        const updated =
          await updateCommission(
            percent
          );

        setCurrent(
          updated
        );

        setValue(
          String(
            updated?.commissionPercent ??
            percent
          )
        );

        setMessage(
          "Commission updated successfully."
        );

        await load();

      } catch (e) {

        setError(
          e?.message ||
          "Unable to update commission."
        );

      } finally {

        setSaving(
          false
        );
      }
    };

  if (loading) {

    return (
      <div className="commission-page">

        <div className="commission-card">

          <h2>
            Loading commission settings...
          </h2>

        </div>

      </div>
    );
  }

  return (
    <div className="commission-page">

      <div className="commission-header">

        <div>

          <span className="commission-breadcrumb">
            Admin / Settings
          </span>

          <h1>
            Commission Settings
          </h1>

          <p>
            Manage the active MaxiGo platform commission percentage.
          </p>

        </div>

      </div>

      {error && (
        <div className="commission-message error">
          {
            error
          }
        </div>
      )}

      {message && (
        <div className="commission-message success">
          {
            message
          }
        </div>
      )}

      <div className="commission-grid">

        <div className="commission-card commission-main-card">

          <div className="commission-card-heading">

            <div>

              <h2>
                Current Commission
              </h2>

              <p>
                This percentage is used for new store settlements.
              </p>

            </div>

            <span className="commission-active-badge">

              {
                current?.isActive
                  ? "ACTIVE"
                  : "INACTIVE"
              }

            </span>

          </div>

          <form
            onSubmit={
              handleSave
            }
          >

            <label htmlFor="commissionPercent">
              Commission Percentage
            </label>

            <div className="commission-input-wrap">

              <input
                id="commissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={value}
                onChange={(e) =>
                  setValue(
                    e.target.value
                  )
                }
              />

              <span>
                %
              </span>

            </div>

            <div className="commission-preview">

              <div>

                <span>
                  Example Order Value
                </span>

                <strong>
                  ₹1,000
                </strong>

              </div>

              <div>

                <span>
                  MaxiGo Commission
                </span>

                <strong>

                  ₹
                  {(
                    (
                      Number(
                        value
                      ) ||
                      0
                    ) *
                    10
                  ).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits:
                        2,
                    }
                  )}

                </strong>

              </div>

              <div>

                <span>
                  Store Amount
                </span>

                <strong>

                  ₹
                  {(
                    1000 -
                    (
                      (
                        Number(
                          value
                        ) ||
                        0
                      ) *
                      10
                    )
                  ).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits:
                        2,
                    }
                  )}

                </strong>

              </div>

            </div>

            <button
              type="submit"
              className="commission-save-btn"
              disabled={
                saving
              }
            >

              {
                saving
                  ? "Saving..."
                  : "Save Commission"
              }

            </button>

          </form>

        </div>

        <div className="commission-card">

          <div className="commission-card-heading">

            <div>

              <h2>
                Current Setting
              </h2>

              <p>
                Latest active configuration.
              </p>

            </div>

          </div>

          <div className="commission-current-box">

            <span>
              Active Rate
            </span>

            <strong>
              {
                current?.commissionPercent ??
                0
              }%
            </strong>

            <small>
              Updated{" "}
              {
                current?.updatedAt ||
                current?.createdAt ||
                "—"
              }
            </small>

          </div>

          <div className="commission-info-row">

            <span>
              Setting ID
            </span>

            <strong>
              {
                current?.id ??
                "—"
              }
            </strong>

          </div>

          <div className="commission-info-row">

            <span>
              Status
            </span>

            <strong>
              {
                current?.isActive
                  ? "Active"
                  : "Inactive"
              }
            </strong>

          </div>

        </div>

      </div>

      <div className="commission-card commission-history-card">

        <div className="commission-card-heading">

          <div>

            <h2>
              Commission History
            </h2>

            <p>
              Previous commission configurations are retained for reference.
            </p>

          </div>

        </div>

        <div className="commission-history-scroll">

          <table className="commission-history-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Commission %
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created
                </th>

                <th>
                  Updated
                </th>

              </tr>

            </thead>

            <tbody>

              {history.length >
              0 ? (
                history.map(
                  (
                    item
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                    >

                      <td>
                        {
                          item.id
                        }
                      </td>

                      <td>

                        <strong>
                          {
                            item.commissionPercent
                          }%
                        </strong>

                      </td>

                      <td>

                        <span
                          className={`commission-status ${
                            item.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >

                          {
                            item.isActive
                              ? "ACTIVE"
                              : "INACTIVE"
                          }

                        </span>

                      </td>

                      <td>
                        {
                          item.createdAt ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          item.updatedAt ||
                          "—"
                        }
                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>

                  <td
                    colSpan="5"
                    className="commission-empty"
                  >
                    No commission history found.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default CommissionSettings;