import React, { useState } from "react";
import { adminLogin } from "./api";

function Login({ onLogin }) {

    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // LOGIN
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        const cleanMobile =
            mobile.trim();

        if (!cleanMobile) {
            setError(
                "Please enter mobile number"
            );
            return;
        }

        if (!password) {
            setError(
                "Please enter password"
            );
            return;
        }

        if (cleanMobile.length < 10) {
            setError(
                "Please enter a valid mobile number"
            );
            return;
        }

        // -------------------------------------------------
        // LOGIN API
        // -------------------------------------------------

        try {

            setLoading(true);

            const response =
                await adminLogin(
                    cleanMobile,
                    password
                );

            console.log(
                "ADMIN LOGIN SUCCESS:",
                response
            );

            if (onLogin) {
                onLogin(response);
            }

        } catch (err) {

            console.error(
                "ADMIN LOGIN ERROR:",
                err
            );

            setError(
                err?.message ||
                "Login failed. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(135deg, #f5f7fb, #e9eef7)",
                padding: "20px",
                boxSizing: "border-box"
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "430px",
                    background: "#ffffff",
                    borderRadius: "20px",
                    padding: "35px",
                    boxSizing: "border-box",
                    boxShadow:
                        "0 15px 45px rgba(0,0,0,0.12)"
                }}
            >

                {/* =================================================
                    LOGO
                ================================================= */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "25px"
                    }}
                >

                    <img
                        src="/maxigo-admin-logo.png"
                        alt="MaxiGo Admin"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain"
                        }}
                    />

                    <h2
                        style={{
                            margin:
                                "18px 0 5px",
                            fontSize: "26px",
                            color: "#1f2937",
                            fontWeight: "700"
                        }}
                    >
                        Admin Login
                    </h2>

                    <p
                        style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#6b7280"
                        }}
                    >
                        Sign in to MaxiGo Admin Panel
                    </p>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div
                        style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border:
                                "1px solid #fecaca",
                            borderRadius: "10px",
                            padding:
                                "12px 14px",
                            marginBottom: "18px",
                            fontSize: "14px",
                            lineHeight: "1.4"
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    onSubmit={handleSubmit}
                >

                    {/* MOBILE */}

                    <div
                        style={{
                            marginBottom: "18px"
                        }}
                    >

                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#374151"
                            }}
                        >
                            Mobile Number
                        </label>

                        <input
                            type="tel"
                            value={mobile}
                            onChange={(e) =>
                                setMobile(
                                    e.target.value
                                )
                            }
                            placeholder="Enter mobile number"
                            maxLength={10}
                            autoComplete="tel"
                            style={{
                                width: "100%",
                                height: "48px",
                                padding:
                                    "0 14px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius: "10px",
                                outline: "none",
                                fontSize: "15px",
                                boxSizing:
                                    "border-box"
                            }}
                        />

                    </div>

                    {/* PASSWORD */}

                    <div
                        style={{
                            marginBottom: "22px"
                        }}
                    >

                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#374151"
                            }}
                        >
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter password"
                            autoComplete="current-password"
                            style={{
                                width: "100%",
                                height: "48px",
                                padding:
                                    "0 14px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius: "10px",
                                outline: "none",
                                fontSize: "15px",
                                boxSizing:
                                    "border-box"
                            }}
                        />

                    </div>

                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            height: "50px",
                            border: "none",
                            borderRadius: "10px",
                            background:
                                loading
                                    ? "#9ca3af"
                                    : "#111827",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "700",
                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer",
                            transition:
                                "0.2s ease"
                        }}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "22px",
                        fontSize: "12px",
                        color: "#9ca3af"
                    }}
                >
                    MaxiGo Admin Panel
                </div>

            </div>

        </div>
    );
}

export default Login;