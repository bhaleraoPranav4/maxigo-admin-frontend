import React, {
  useEffect,
  useState,
} from "react";

import "./Offers.css";

import {
  getAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  deleteAdminOffer,
  updateAdminOfferActive,
  toArray,
} from "./api";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  discount: 50,
  discountText: "UP TO",
  buttonText: "Shop Now",
  buttonLink: "/",
  imageUrl: "",
  backgroundColor: "#7c3aed",
  active: true,
  startDate: "",
  endDate: "",
};

function Offers() {
  const [offers, setOffers] = useState([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAdminOffers();

      setOffers(toArray(data));
    } catch (err) {
      setError(
        err.message ||
        "Unable to load offers."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function editOffer(offer) {
    setEditingId(offer.id);

    setForm({
      title: offer.title || "",
      subtitle: offer.subtitle || "",
      discount:
        offer.discount ?? 50,
      discountText:
        offer.discountText || "UP TO",
      buttonText:
        offer.buttonText || "Shop Now",
      buttonLink:
        offer.buttonLink || "/",
      imageUrl:
        offer.imageUrl || "",
      backgroundColor:
        offer.backgroundColor ||
        "#7c3aed",
      active:
        offer.active !== false,
      startDate:
        offer.startDate
          ? String(
              offer.startDate
            ).slice(0, 16)
          : "",
      endDate:
        offer.endDate
          ? String(
              offer.endDate
            ).slice(0, 16)
          : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Offer title is required.");
      return;
    }

    if (
      form.discount === "" ||
      Number(form.discount) < 0 ||
      Number(form.discount) > 100
    ) {
      setError(
        "Discount must be between 0 and 100."
      );
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      new Date(form.endDate) <
        new Date(form.startDate)
    ) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle:
        form.subtitle.trim(),
      discount:
        Number(form.discount),
      discountText:
        form.discountText.trim() ||
        "UP TO",
      buttonText:
        form.buttonText.trim() ||
        "Shop Now",
      buttonLink:
        form.buttonLink.trim() || "/",
      imageUrl:
        form.imageUrl.trim() || null,
      backgroundColor:
        form.backgroundColor ||
        "#7c3aed",
      active: Boolean(form.active),
      startDate:
        form.startDate
          ? form.startDate
          : null,
      endDate:
        form.endDate
          ? form.endDate
          : null,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateAdminOffer(
          editingId,
          payload
        );

        setSuccess(
          "Offer updated successfully."
        );
      } else {
        await createAdminOffer(
          payload
        );

        setSuccess(
          "Offer created successfully."
        );
      }

      resetForm();

      await loadOffers();

    } catch (err) {
      setError(
        err.message ||
        "Unable to save offer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this offer?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteAdminOffer(id);

      setSuccess(
        "Offer deleted successfully."
      );

      if (editingId === id) {
        resetForm();
      }

      await loadOffers();

    } catch (err) {
      setError(
        err.message ||
        "Unable to delete offer."
      );
    }
  }

  async function handleToggle(
    offer
  ) {
    try {
      setError("");
      setSuccess("");

      await updateAdminOfferActive(
        offer.id,
        !offer.active
      );

      setSuccess(
        !offer.active
          ? "Offer activated."
          : "Offer deactivated."
      );

      await loadOffers();

    } catch (err) {
      setError(
        err.message ||
        "Unable to update offer status."
      );
    }
  }

  return (
    <div className="offers-page">

      <div className="offers-header">

        <div>
          <h1>Offers & Banners</h1>

          <p>
            Manage customer home page
            offers and promotional banners.
          </p>
        </div>

        <button
          className="offer-new-btn"
          type="button"
          onClick={resetForm}
        >
          + New Offer
        </button>

      </div>

      {error && (
        <div className="offer-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="offer-alert success">
          {success}
        </div>
      )}

      <div className="offers-grid">

        {/* FORM */}

        <section className="offer-form-card">

          <div className="card-heading">
            <div>
              <h2>
                {editingId
                  ? "Edit Offer"
                  : "Create Offer"}
              </h2>

              <p>
                Set the banner content
                visible to customers.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="offer-form"
          >

            <div className="form-group full">
              <label>
                Offer Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Fresh Essentials Delivered in Minutes!"
              />
            </div>

            <div className="form-group full">
              <label>
                Subtitle
              </label>

              <input
                type="text"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="Fruits, Vegetables, Groceries & More"
              />
            </div>

            <div className="form-row">

              <div className="form-group">
                <label>
                  Discount %
                </label>

                <input
                  type="number"
                  name="discount"
                  min="0"
                  max="100"
                  value={form.discount}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Discount Label
                </label>

                <input
                  type="text"
                  name="discountText"
                  value={
                    form.discountText
                  }
                  onChange={handleChange}
                  placeholder="UP TO"
                />
              </div>

            </div>

            <div className="form-row">

              <div className="form-group">
                <label>
                  Button Text
                </label>

                <input
                  type="text"
                  name="buttonText"
                  value={form.buttonText}
                  onChange={handleChange}
                  placeholder="Shop Now"
                />
              </div>

              <div className="form-group">
                <label>
                  Button Link
                </label>

                <input
                  type="text"
                  name="buttonLink"
                  value={form.buttonLink}
                  onChange={handleChange}
                  placeholder="/"
                />
              </div>

            </div>

            <div className="form-group full">
              <label>
                Image URL
              </label>

              <input
                type="text"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/banner.jpg"
              />

              <small>
                Optional. Keep empty if
                customer banner uses CSS design.
              </small>
            </div>

            <div className="form-row">

              <div className="form-group">
                <label>
                  Background Color
                </label>

                <div className="color-input-wrap">

                  <input
                    type="color"
                    name="backgroundColor"
                    value={
                      form.backgroundColor ||
                      "#7c3aed"
                    }
                    onChange={handleChange}
                  />

                  <input
                    type="text"
                    name="backgroundColor"
                    value={
                      form.backgroundColor
                    }
                    onChange={handleChange}
                  />

                </div>
              </div>

              <div className="form-group">
                <label>
                  Status
                </label>

                <label className="switch-row">

                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                  />

                  <span>
                    {form.active
                      ? "Active"
                      : "Inactive"}
                  </span>

                </label>
              </div>

            </div>

            <div className="form-row">

              <div className="form-group">
                <label>
                  Start Date
                </label>

                <input
                  type="datetime-local"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  End Date
                </label>

                <input
                  type="datetime-local"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Clear
              </button>

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Offer"
                  : "Create Offer"}
              </button>

            </div>

          </form>

        </section>


        {/* PREVIEW */}

        <section className="offer-preview-card">

          <div className="card-heading">
            <div>
              <h2>
                Live Preview
              </h2>

              <p>
                Preview how the offer can
                appear in Customer App.
              </p>
            </div>
          </div>

          <div
            className="offer-preview-banner"
            style={{
              background:
                form.backgroundColor ||
                "#7c3aed",
            }}
          >

            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt=""
                className="preview-image"
              />
            )}

            <div className="preview-content">

              <div className="preview-discount">

                <span>
                  {form.discountText ||
                    "UP TO"}
                </span>

                <strong>
                  {form.discount || 0}%
                </strong>

                <span>
                  OFF
                </span>

              </div>

              <div className="preview-text">

                <small>
                  MAXIGO SPECIAL
                </small>

                <h3>
                  {form.title ||
                    "Your Offer Title"}
                </h3>

                <p>
                  {form.subtitle ||
                    "Your offer subtitle"}
                </p>

                <button
                  type="button"
                >
                  {form.buttonText ||
                    "Shop Now"}{" "}
                  →
                </button>

              </div>

            </div>

          </div>

        </section>

      </div>


      {/* OFFER LIST */}

      <section className="offer-list-card">

        <div className="card-heading list-heading">

          <div>
            <h2>
              All Offers
            </h2>

            <p>
              {offers.length} offer
              {offers.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={loadOffers}
          >
            ↻ Refresh
          </button>

        </div>

        {loading ? (
          <div className="offer-loading">
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="offer-empty">
            No offers found.
          </div>
        ) : (
          <div className="offers-table-wrap">

            <table className="offers-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Offer</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {offers.map((offer) => (

                  <tr key={offer.id}>

                    <td>
                      #{offer.id}
                    </td>

                    <td>

                      <div className="offer-table-info">

                        <div
                          className="offer-mini-color"
                          style={{
                            background:
                              offer.backgroundColor ||
                              "#7c3aed",
                          }}
                        />

                        <div>

                          <strong>
                            {offer.title}
                          </strong>

                          <span>
                            {offer.subtitle ||
                              "—"}
                          </span>

                        </div>

                      </div>

                    </td>

                    <td>

                      <strong>
                        {offer.discount}%
                      </strong>

                    </td>

                    <td>

                      <button
                        type="button"
                        className={`status-toggle ${
                          offer.active
                            ? "active"
                            : "inactive"
                        }`}
                        onClick={() =>
                          handleToggle(
                            offer
                          )
                        }
                      >
                        {offer.active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </button>

                    </td>

                    <td>

                      <div className="date-cell">

                        <span>
                          {offer.startDate
                            ? new Date(
                                offer.startDate
                              ).toLocaleString(
                                "en-IN"
                              )
                            : "No start"}
                        </span>

                        <span>
                          {offer.endDate
                            ? new Date(
                                offer.endDate
                              ).toLocaleString(
                                "en-IN"
                              )
                            : "No expiry"}
                        </span>

                      </div>

                    </td>

                    <td>

                      <div className="table-actions">

                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() =>
                            editOffer(
                              offer
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(
                              offer.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default Offers;