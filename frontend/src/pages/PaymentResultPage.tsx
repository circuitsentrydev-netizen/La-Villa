
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../app/store";
import { API_BASE_URL } from "../config/api";

type PaymentState =
  | "verifying"
  | "paid"
  | "pending"
  | "failed"
  | "error";

interface PaymentVerificationResponse {
  message?: string;
  error?: string;
  status?: string;
  paymentStatus?: string;
  payment_status?: string;
  payment?: {
    status?: string;
  };
  reservation?: {
    reservation_code?: string;
    status?: string;
    payment_status?: string;
  };
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    "";

  const [paymentState, setPaymentState] =
    useState<PaymentState>("verifying");

  const [message, setMessage] = useState(
    "Checking your payment with Paystack..."
  );

  const [reservationCode, setReservationCode] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const verifyPayment = async () => {
      setReservationCode("");

      if (!reference.trim()) {
        setPaymentState("error");
        setMessage(
          "No payment reference was supplied. We cannot verify this payment."
        );
        return;
      }

      const activeToken =
        token ||
        localStorage.getItem("lavilla_token") ||
        localStorage.getItem("token");

      if (!isAuthenticated || !activeToken) {
        setPaymentState("error");
        setMessage(
          "Please sign in again to verify your payment. Your payment status has not been confirmed on this page."
        );
        return;
      }

      setPaymentState("verifying");
      setMessage("Checking your payment with Paystack...");

      try {
        const response = await fetch(
          `${API_BASE_URL}/reservations/verify-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${activeToken}`,
            },
            body: JSON.stringify({ reference }),
          }
        );

        const data =
          (await response.json().catch(() => ({}))) as
            PaymentVerificationResponse;

        if (!active) return;

        if (response.status === 401) {
          setPaymentState("error");
          setMessage(
            "Your session has expired. Please sign in again before checking your payment."
          );
          return;
        }

        const serverPaymentStatus = String(
          data.paymentStatus ??
            data.payment_status ??
            data.payment?.status ??
            data.reservation?.payment_status ??
            ""
        ).toLowerCase();

        if (response.ok && serverPaymentStatus === "paid") {
          setPaymentState("paid");
          setMessage(
            data.message ??
              "Your payment has been verified successfully. Your reservation is confirmed."
          );

          setReservationCode(
            data.reservation?.reservation_code ?? ""
          );

          return;
        }

        if (
          serverPaymentStatus === "pending" ||
          serverPaymentStatus === "processing" ||
          serverPaymentStatus === "ongoing"
        ) {
          setPaymentState("pending");
          setMessage(
            data.message ??
              "Your payment is still being processed. Please check again shortly."
          );
          return;
        }

        if (
          serverPaymentStatus === "failed" ||
          serverPaymentStatus === "abandoned" ||
          serverPaymentStatus === "cancelled"
        ) {
          setPaymentState("failed");
          setMessage(
            data.message ??
              "The payment has not been completed. Your reservation is not confirmed."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              data.error ??
              "The server could not verify this payment."
          );
        }

        // An HTTP success alone does not prove payment was successful.
        setPaymentState("error");
        setMessage(
          "The server did not return a confirmed payment status. Your reservation has not been marked as paid by this page."
        );
      } catch (err) {
        if (!active) return;

        setPaymentState("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Unable to verify your payment right now."
        );
      }
    };

    void verifyPayment();

    return () => {
      active = false;
    };
  }, [reference, token, isAuthenticated, attempt]);

  const retryVerification = () => {
    setAttempt((current) => current + 1);
  };

  const isPositive = paymentState === "paid";
  const isPending = paymentState === "pending";
  const isFailed = paymentState === "failed";
  const isVerifying = paymentState === "verifying";

  const statusColor = isPositive
    ? "#166534"
    : isFailed
      ? "#b91c1c"
      : "#92400e";

  const statusTitle = isPositive
    ? "Payment successful"
    : isPending
      ? "Payment pending"
      : isFailed
        ? "Payment not completed"
        : isVerifying
          ? "Verifying payment"
          : "Unable to confirm payment";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        boxSizing: "border-box",
        background: "#FAF9F6",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 620,
          padding: "36px 28px",
          boxSizing: "border-box",
          borderRadius: 12,
          background: "#fff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 28px rgba(0, 0, 0, 0.05)",
          textAlign: "center",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#1B4D3E",
            textDecoration: "none",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          La Villa
        </Link>

        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            margin: "28px auto 18px",
            borderRadius: "50%",
            background: isPositive
              ? "#dcfce7"
              : isFailed
                ? "#fee2e2"
                : "#fef3c7",
            color: statusColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          {isVerifying
            ? "…"
            : isPositive
              ? "✓"
              : isFailed
                ? "!"
                : "?"}
        </div>

        <h1
          style={{
            color: "#1B4D3E",
            marginBottom: 12,
          }}
        >
          {statusTitle}
        </h1>

        <p
          role="status"
          aria-live="polite"
          style={{
            color: "#475569",
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          {message}
        </p>

        {reservationCode && isPositive && (
          <div
            style={{
              margin: "20px 0",
              padding: 16,
              background: "#FAF9F6",
              borderRadius: 8,
            }}
          >
            <p style={{ margin: "0 0 6px", color: "#64748b" }}>
              Reservation reference
            </p>

            <strong style={{ color: "#1B4D3E" }}>
              {reservationCode}
            </strong>
          </div>
        )}

        {reference && (
          <p
            style={{
              color: "#64748b",
              fontSize: 13,
              overflowWrap: "anywhere",
            }}
          >
            Payment reference: {reference}
          </p>
        )}

        {isVerifying && (
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Please keep this page open while we check the result.
          </p>
        )}

        {(isPending || paymentState === "error" || isFailed) && (
          <button
            type="button"
            onClick={retryVerification}
            style={{
              marginTop: 12,
              padding: "12px 18px",
              border: "1px solid #1B4D3E",
              borderRadius: 7,
              background: "#fff",
              color: "#1B4D3E",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Check payment again
          </button>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 28,
          }}
        >
          <Link
            to="/discover"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 7,
              background: "#1B4D3E",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {isPositive
              ? "Explore accommodations"
              : "Browse accommodations"}
          </Link>

          <Link
            to="/"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              border: "1px solid #cbd5e1",
              borderRadius: 7,
              color: "#475569",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
