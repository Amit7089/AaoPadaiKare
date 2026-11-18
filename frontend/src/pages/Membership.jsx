
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Star,
} from "lucide-react";
import { api, getStudentToken } from "../services/api";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const features = [
  "Premium video lectures",
  "Handwritten PDF notes",
  "Chapter-wise study material",
  "YouTube video lectures",
  "Complete syllabus coverage",
  "Exam preparation resources",
];

const getGroup = (classNo) => {
  if (classNo <= 8) {
    return {
      name: "Foundation",
      description: "Build strong fundamentals",
      icon: BookOpen,
    };
  }

  if (classNo <= 10) {
    return {
      name: "Board Preparation",
      description: "Prepare confidently for exams",
      icon: GraduationCap,
    };
  }

  return {
    name: "Senior Secondary",
    description: "Move closer to your goals",
    icon: GraduationCap,
  };
};

export default function Membership() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [billing, setBilling] = useState("yearly");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLoggedIn = Boolean(getStudentToken());

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const planResponse = await api.getMembershipPlans();
      setPlans(planResponse.plans || []);

      if (getStudentToken()) {
        const membershipResponse = await api.getMyMemberships();
        setMemberships(membershipResponse.memberships || []);
      } else {
        setMemberships([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load membership plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getActiveMembership = (classNo) =>
    memberships.find(
      (item) =>
        Number(item.classNo) === Number(classNo) &&
        item.status === "active" &&
        item.isActive === true
    );

  const handlePurchase = async (classNo) => {
    if (!getStudentToken()) {
      navigate("/login", {
        state: {
          from: "/membership",
          message: "Please login to purchase Premium membership.",
        },
      });
      return;
    }

    if (getActiveMembership(classNo)) {
      setError(`Class ${classNo} Premium is already active.`);
      return;
    }

    const selectedPlan = plans.find(
      (item) => Number(item.classNo) === Number(classNo)
    );

    if (!selectedPlan || !selectedPlan[billing]) {
      setError("Selected plan is not available.");
      return;
    }

    try {
      setPaymentLoading(`${classNo}-${billing}`);
      setError("");
      setSuccess("");

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const orderResponse = await api.createMembershipOrder({
        classNo: Number(classNo),
        plan: billing,
      });

      if (!orderResponse.success || !orderResponse.order?.id) {
        throw new Error("Payment order could not be created.");
      }

      const options = {
        key: orderResponse.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: "Aao Padai Kare",
        description: `Class ${classNo} ${billing} Premium`,
        order_id: orderResponse.order.id,
        theme: { color: "#3949ab" },

        modal: {
          ondismiss: () => setPaymentLoading(null),
        },

        handler: async (response) => {
          try {
            const verification = await api.verifyMembershipPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification.success) {
              throw new Error("Payment verification failed.");
            }

            setSuccess(
              `Class ${classNo} Premium activated successfully!`
            );

            await loadData();
          } catch (err) {
            setError(err.message || "Payment verification failed.");
          } finally {
            setPaymentLoading(null);
          }
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );
        setPaymentLoading(null);
      });

      checkout.open();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setPaymentLoading(null);
    }
  };

  const activeCount = memberships.filter(
    (item) => item.status === "active" && item.isActive === true
  ).length;

  return (
    <div className="membership-page">
      <style>{`
        .membership-page {
          --mp-primary: #3949ab;
          --mp-dark: #172554;
          --mp-text: #172033;
          --mp-muted: #718096;
          --mp-border: #e6eaf0;
          min-height: 100vh;
          background: #f7f8fc;
          color: var(--mp-text);
          font-family: inherit;
        }

        .membership-page * {
          box-sizing: border-box;
        }

        .mp-container {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .mp-hero {
          background: #fff;
          border-bottom: 1px solid var(--mp-border);
          padding: 58px 0 62px;
        }

        .mp-hero-inner {
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          align-items: center;
          gap: 50px;
        }

        .mp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--mp-primary);
          background: #eef0ff;
          padding: 9px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .mp-hero h1 {
          margin: 22px 0 14px;
          color: #172554;
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1.12;
          letter-spacing: -1.7px;
          font-weight: 850;
        }

        .mp-hero h1 span {
          color: var(--mp-primary);
        }

        .mp-hero p {
          max-width: 570px;
          color: #68758b;
          font-size: 16px;
          line-height: 1.8;
          margin: 0;
        }

        .mp-hero-points {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 25px;
        }

        .mp-hero-point {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: #536078;
          font-weight: 600;
        }

        .mp-hero-point svg {
          color: #15966a;
        }

        .mp-hero-card {
          background: #f5f6ff;
          border: 1px solid #e4e7ff;
          border-radius: 20px;
          padding: 26px;
        }

        .mp-hero-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mp-hero-card-top strong {
          font-size: 17px;
          color: #202b55;
        }

        .mp-crown {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #fff;
          background: var(--mp-primary);
        }

        .mp-class-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 22px;
        }

        .mp-class-box {
          background: #fff;
          border: 1px solid #e4e7f1;
          border-radius: 11px;
          text-align: center;
          padding: 13px 5px;
          color: #35416a;
          font-size: 14px;
          font-weight: 800;
        }

        .mp-class-box small {
          display: block;
          font-size: 9px;
          color: #8a94a8;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .mp-hero-note {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 19px;
          background: #fff;
          border: 1px solid #e6eaf0;
          border-radius: 12px;
          padding: 13px;
          color: #536078;
          font-size: 12px;
          line-height: 1.5;
        }

        .mp-hero-note svg {
          flex-shrink: 0;
          color: #15966a;
        }

        .mp-main {
          padding: 65px 0 75px;
        }

        .mp-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .mp-heading span {
          color: var(--mp-primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .mp-heading h2 {
          font-size: 32px;
          line-height: 1.2;
          margin: 10px 0;
          font-weight: 850;
          color: #172554;
        }

        .mp-heading p {
          margin: 0;
          color: var(--mp-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .mp-billing {
          display: flex;
          justify-content: center;
          margin: 26px 0 36px;
        }

        .mp-billing-inner {
          display: inline-flex;
          gap: 5px;
          background: #fff;
          border: 1px solid var(--mp-border);
          border-radius: 12px;
          padding: 5px;
        }

        .mp-billing button {
          border: 0;
          border-radius: 8px;
          padding: 12px 23px;
          background: transparent;
          color: #69758b;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .mp-billing button.active {
          background: var(--mp-primary);
          color: #fff;
        }

        .mp-save {
          margin-left: 6px;
          font-size: 9px;
          color: #16845e;
          background: #dff7eb;
          padding: 4px 6px;
          border-radius: 20px;
        }

        .mp-alert {
          max-width: 700px;
          margin: 0 auto 22px;
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .mp-error {
          color: #b42318;
          background: #fff0ee;
          border: 1px solid #ffd4ce;
        }

        .mp-success {
          color: #08744e;
          background: #e9f9f1;
          border: 1px solid #c5eedb;
        }

        .mp-alert button {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-weight: 800;
          color: inherit;
        }

        .mp-plan-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          align-items: stretch;
        }

        .mp-plan-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid var(--mp-border);
          border-radius: 17px;
          overflow: hidden;
          min-width: 0;
          box-shadow: 0 3px 12px rgba(24, 39, 75, .035);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .mp-plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 13px 30px rgba(24, 39, 75, .09);
        }

        .mp-plan-top {
          padding: 22px 22px 20px;
          background: #f0f3ff;
          border-bottom: 1px solid #e5eaff;
        }

        .mp-plan-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #4353a4;
          font-size: 12px;
          font-weight: 800;
        }

        .mp-plan-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          background: #fff;
          border: 1px solid #e2e7ff;
          border-radius: 11px;
          color: var(--mp-primary);
        }

        .mp-plan-top h3 {
          margin: 16px 0 5px;
          font-size: 24px;
          color: #172554;
          font-weight: 850;
        }

        .mp-plan-top p {
          margin: 0;
          color: #69758b;
          font-size: 12px;
        }

        .mp-plan-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 23px;
        }

        .mp-price-row {
          display: flex;
          align-items: baseline;
          gap: 7px;
        }

        .mp-price {
          font-size: 36px;
          font-weight: 850;
          letter-spacing: -1.2px;
          color: #172554;
        }

        .mp-duration {
          font-size: 12px;
          color: #7b8799;
        }

        .mp-billed {
          font-size: 11px;
          color: #929bad;
          margin-top: 3px;
        }

        .mp-includes {
          border-top: 1px solid #edf0f5;
          margin-top: 21px;
          padding-top: 19px;
        }

        .mp-includes h4 {
          margin: 0 0 16px;
          color: #293650;
          font-size: 13px;
          font-weight: 800;
        }

        .mp-feature-list {
          display: grid;
          gap: 13px;
        }

        .mp-feature {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #596579;
          font-size: 12px;
          line-height: 1.5;
        }

        .mp-feature svg {
          flex-shrink: 0;
          color: #15966a;
          margin-top: 1px;
        }

        .mp-buy-area {
          margin-top: auto;
          padding-top: 24px;
        }

        .mp-buy-button {
          width: 100%;
          min-height: 48px;
          border: 0;
          border-radius: 10px;
          background: var(--mp-primary);
          color: #fff;
          font-size: 13px;
          font-weight: 850;
          letter-spacing: .4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: background .2s ease;
        }

        .mp-buy-button:hover {
          background: #283593;
        }

        .mp-buy-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .mp-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 13px;
          color: #98a1b1;
          font-size: 10px;
        }

        .mp-active-box {
          padding: 13px;
          border: 1px solid #b9e9d2;
          border-radius: 10px;
          background: #edfaf3;
          color: #08744e;
          font-size: 12px;
        }

        .mp-active-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 850;
        }

        .mp-active-box p {
          margin: 7px 0 0;
        }

        .mp-loading {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--mp-primary);
        }

        .mp-empty {
          padding: 35px;
          text-align: center;
          background: #fff;
          border: 1px solid var(--mp-border);
          border-radius: 14px;
          color: var(--mp-muted);
        }

        .mp-empty button {
          border: 0;
          border-radius: 8px;
          background: var(--mp-primary);
          color: white;
          padding: 11px 18px;
          margin-top: 15px;
          cursor: pointer;
        }

        .mp-memberships {
          margin-top: 70px;
        }

        .mp-membership-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .mp-membership-heading h2 {
          margin: 0;
          color: #172554;
          font-size: 25px;
          font-weight: 850;
        }

        .mp-membership-heading p {
          color: var(--mp-muted);
          font-size: 13px;
          margin: 7px 0 0;
        }

        .mp-count {
          background: #fff;
          border: 1px solid var(--mp-border);
          border-radius: 9px;
          padding: 11px 15px;
          font-size: 12px;
          font-weight: 800;
          color: #46516b;
        }

        .mp-my-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
        }

        .mp-my-card {
          background: #fff;
          border: 1px solid var(--mp-border);
          border-radius: 12px;
          padding: 18px;
        }

        .mp-my-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .mp-my-card h3 {
          font-size: 15px;
          margin: 0;
          color: #172554;
        }

        .mp-status {
          font-size: 10px;
          font-weight: 850;
          padding: 5px 9px;
          border-radius: 20px;
        }

        .mp-status.active {
          background: #e1f7eb;
          color: #08744e;
        }

        .mp-status.expired {
          background: #fff0ee;
          color: #b42318;
        }

        .mp-my-card p {
          font-size: 12px;
          color: var(--mp-muted);
          margin: 8px 0 0;
        }

        .mp-cta {
          margin-top: 65px;
          border-radius: 17px;
          background: #172554;
          padding: 37px 25px;
          text-align: center;
          color: #fff;
        }

        .mp-cta h2 {
          margin: 0;
          font-size: 25px;
          font-weight: 850;
        }

        .mp-cta p {
          max-width: 570px;
          margin: 12px auto 0;
          font-size: 13px;
          line-height: 1.8;
          color: #dbe3ff;
        }

        .mp-cta a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 21px;
          background: #fff;
          color: #172554;
          padding: 12px 20px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 850;
          text-decoration: none;
        }

        .mp-trust {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 24px;
          margin-top: 25px;
          color: #8792a5;
          font-size: 11px;
        }

        .mp-trust span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 900px) {
          .mp-hero-inner {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .mp-hero-card {
            max-width: 550px;
          }

          .mp-plan-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .mp-my-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .mp-container {
            width: min(100% - 28px, 500px);
          }

          .mp-hero {
            padding: 42px 0;
          }

          .mp-hero h1 {
            font-size: 35px;
          }

          .mp-hero p {
            font-size: 14px;
          }

          .mp-hero-points {
            gap: 12px;
          }

          .mp-hero-point {
            font-size: 11px;
          }

          .mp-hero-card {
            padding: 18px;
          }

          .mp-main {
            padding-top: 45px;
          }

          .mp-heading h2 {
            font-size: 27px;
          }

          .mp-plan-grid,
          .mp-my-grid {
            grid-template-columns: 1fr;
          }

          .mp-plan-card {
            max-width: 430px;
            width: 100%;
            margin: 0 auto;
          }

          .mp-billing button {
            padding: 11px 15px;
            font-size: 12px;
          }

          .mp-membership-heading h2 {
            font-size: 22px;
          }

          .mp-cta {
            padding: 30px 18px;
          }

          .mp-cta h2 {
            font-size: 22px;
          }

          .mp-trust {
            gap: 13px;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="mp-hero">
        <div className="mp-container mp-hero-inner">

          <div>
            <div className="mp-eyebrow">
              <Crown size={15} />
              AAO PADAI KARE PREMIUM
            </div>

            <h1>
              Learn More.
              <br />
              <span>Achieve More.</span>
            </h1>

            <p>
              Unlock premium video lectures, handwritten notes and
              chapter-wise study material. Choose your class and
              make your learning journey better.
            </p>

            <div className="mp-hero-points">
              <div className="mp-hero-point">
                <CheckCircle2 size={16} />
                First 3 lectures free
              </div>
              <div className="mp-hero-point">
                <CheckCircle2 size={16} />
                Class-wise access
              </div>
              <div className="mp-hero-point">
                <CheckCircle2 size={16} />
                Secure payments
              </div>
            </div>
          </div>

          <div className="mp-hero-card">
            <div className="mp-hero-card-top">
              <strong>Your Learning Journey</strong>
              <div className="mp-crown">
                <Crown size={24} />
              </div>
            </div>

            <div className="mp-class-grid">
              {[6, 7, 8, 9, 10, 11, 12].map((item) => (
                <div className="mp-class-box" key={item}>
                  <small>MP BOARD</small>
                  Class {item}
                </div>
              ))}
            </div>

            <div className="mp-hero-note">
              <CheckCircle2 size={22} />
              <div>
                <strong>Study smarter with Premium</strong>
                <br />
                Notes, lectures and learning resources in one place.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PLANS */}
      <main className="mp-container mp-main">

        <div className="mp-heading">
          <span>Our Membership</span>
          <h2>Choose Your Class</h2>
          <p>
            Select a plan according to your class and learning needs.
          </p>
        </div>

        <div className="mp-billing">
          <div className="mp-billing-inner">
            <button
              type="button"
              className={billing === "monthly" ? "active" : ""}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>

            <button
              type="button"
              className={billing === "yearly" ? "active" : ""}
              onClick={() => setBilling("yearly")}
            >
              Yearly
              <span className="mp-save">SAVE MORE</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mp-alert mp-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mp-alert mp-success">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {loading ? (
          <div className="mp-loading">
            <LoaderCircle size={38} className="animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="mp-empty">
            <BookOpen size={35} />
            <p>Membership plans are currently unavailable.</p>
            <button type="button" onClick={loadData}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="mp-plan-grid">
            {plans.map((plan) => {
              const group = getGroup(Number(plan.classNo));
              const GroupIcon = group.icon;
              const active = getActiveMembership(plan.classNo);
              const amount = plan[billing];
              const processing =
                paymentLoading === `${plan.classNo}-${billing}`;

              return (
                <article className="mp-plan-card" key={plan.classNo}>

                  <div className="mp-plan-top">
                    <div className="mp-plan-label">
                      <span>{group.name}</span>
                      <div className="mp-plan-icon">
                        <GroupIcon size={21} />
                      </div>
                    </div>

                    <h3>Class {plan.classNo}</h3>
                    <p>{group.description}</p>
                  </div>

                  <div className="mp-plan-body">

                    <div className="mp-price-row">
                      <span className="mp-price">₹{amount}</span>
                      <span className="mp-duration">
                        / {billing === "monthly" ? "month" : "year"}
                      </span>
                    </div>

                    <div className="mp-billed">
                      {billing === "monthly"
                        ? "Monthly Premium membership"
                        : "Yearly Premium membership"}
                    </div>

                    <div className="mp-includes">
                      <h4>What's Included</h4>

                      <div className="mp-feature-list">
                        {features.map((feature) => (
                          <div className="mp-feature" key={feature}>
                            <Check size={16} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mp-buy-area">
                      {active ? (
                        <div className="mp-active-box">
                          <div className="mp-active-title">
                            <CheckCircle2 size={17} />
                            Active Membership
                          </div>
                          <p className="capitalize">
                            {active.plan} plan
                          </p>
                          <p>
                            Valid till {formatDate(active.expiresAt)}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="mp-buy-button"
                          onClick={() => handlePurchase(plan.classNo)}
                          disabled={Boolean(paymentLoading)}
                        >
                          {processing ? (
                            <>
                              <LoaderCircle
                                size={17}
                                className="animate-spin"
                              />
                              Processing Payment
                            </>
                          ) : (
                            <>
                              BUY NOW
                              <ArrowRight size={17} />
                            </>
                          )}
                        </button>
                      )}

                      <div className="mp-secure">
                        <LockKeyhole size={12} />
                        Secure payment powered by Razorpay
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* MY MEMBERSHIPS */}
        {isLoggedIn && !loading && (
          <section className="mp-memberships">

            <div className="mp-membership-heading">
              <div>
                <h2>My Memberships</h2>
                <p>View your active plans and expiry details.</p>
              </div>

              <div className="mp-count">
                <Crown
                  size={15}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    color: "#d69e22",
                  }}
                />
                {activeCount} Active Plans
              </div>
            </div>

            {memberships.length === 0 ? (
              <div className="mp-empty">
                <LockKeyhole size={30} />
                <p>You have not purchased a membership yet.</p>
              </div>
            ) : (
              <div className="mp-my-grid">
                {memberships.map((membership) => {
                  const active =
                    membership.status === "active" &&
                    membership.isActive === true;

                  return (
                    <div
                      className="mp-my-card"
                      key={
                        membership._id ||
                        `${membership.classNo}-${membership.plan}`
                      }
                    >
                      <div className="mp-my-card-top">
                        <h3>Class {membership.classNo}</h3>
                        <span
                          className={`mp-status ${
                            active ? "active" : "expired"
                          }`}
                        >
                          {active ? "ACTIVE" : "EXPIRED"}
                        </span>
                      </div>

                      <p className="capitalize">
                        {membership.plan} Premium
                      </p>

                      <p>
                        Purchased: {formatDate(membership.purchasedAt)}
                      </p>

                      <p>
                        Expiry: {formatDate(membership.expiresAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

          </section>
        )}

        {/* BOTTOM SECTION */}
        <section className="mp-cta">
          <h2>Make Your Learning Better</h2>
          <p>
            Choose your class membership and get access to premium
            learning resources with Aao Padai Kare.
          </p>
          <a href="#plans">
            Explore Plans <ArrowRight size={16} />
          </a>
        </section>

        <div className="mp-trust">
          <span>
            <ShieldCheck size={14} />
            Secure Checkout
          </span>
          <span>
            <Clock size={14} />
            Membership Expiry Tracking
          </span>
          <span>
            <Star size={14} />
            Premium Learning
          </span>
        </div>

      </main>
    </div>
  );
}
