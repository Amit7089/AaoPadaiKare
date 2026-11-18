
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

import Student from "../models/Student.js";
import MembershipPayment from "../models/MembershipPayment.js";
import studentAuth from "../middleware/studentAuth.js";
import membershipPlans from "../config/membershipPlans.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const addMembershipDuration = (date, plan) => {
  const expiry = new Date(date);

  if (plan === "monthly") {
    expiry.setMonth(expiry.getMonth() + 1);
  } else {
    expiry.setFullYear(expiry.getFullYear() + 1);
  }

  return expiry;
};

// CREATE RAZORPAY ORDER
router.post("/create-order", studentAuth, async (req, res) => {
  try {
    const classNo = Number(req.body.classNo);
    const plan = req.body.plan;

    if (!Number.isInteger(classNo) || classNo < 6 || classNo > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid class number",
      });
    }

    if (!["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership plan",
      });
    }

    const amount = membershipPlans[classNo]?.[plan];

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    const student = await Student.findById(req.studentId).select("_id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway is not configured",
      });
    }

    // Create a separate Razorpay order for every purchase.
    // Do not modify Student.memberships here.
    const receipt = `m_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt,
      notes: {
        studentId: String(student._id),
        classNo: String(classNo),
        plan,
      },
    });

    // Save the order separately from the student's active membership.
    await MembershipPayment.create({
      studentId: student._id,
      classNo,
      plan,
      amount: amount * 100,
      currency: "INR",
      orderId: order.id,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
      classNo,
      plan,
    });
  } catch (error) {
    console.error("Create membership order error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create payment order",
    });
  }
});

// VERIFY PAYMENT AND ACTIVATE MEMBERSHIP
router.post("/verify-payment", studentAuth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      success: false,
      message: "Payment details are incomplete",
    });
  }

  try {
    const paymentRecord = await MembershipPayment.findOne({
      orderId: razorpay_order_id,
      studentId: req.studentId,
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    // Idempotency: repeated verification must not extend membership again.
    if (paymentRecord.status === "paid") {
      if (paymentRecord.paymentId !== razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          message: "Payment does not match this order",
        });
      }

      const existingStudent = await Student.findById(req.studentId);
      const existingMembership = existingStudent?.memberships.find(
        (item) => Number(item.classNo) === paymentRecord.classNo
      );

      return res.json({
        success: true,
        message: "Payment was already verified",
        membership: existingMembership
          ? {
              classNo: existingMembership.classNo,
              plan: existingMembership.plan,
              status: existingMembership.status,
              purchasedAt: existingMembership.purchasedAt,
              expiresAt: existingMembership.expiresAt,
            }
          : null,
      });
    }

    if (paymentRecord.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This payment order cannot be verified",
      });
    }

    // Verify Razorpay signature using the server-side secret.
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");

    if (
      receivedBuffer.length !== generatedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, generatedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Confirm payment directly with Razorpay.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.amount !== paymentRecord.amount ||
      payment.currency !== paymentRecord.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not successfully captured",
      });
    }

    // Activate membership and mark payment paid atomically.
    // MongoDB transactions require a replica set (MongoDB Atlas supports this).
    const session = await mongoose.startSession();

    let activatedMembership = null;

    try {
      await session.withTransaction(async () => {
        const currentPayment = await MembershipPayment.findOne({
          orderId: razorpay_order_id,
          studentId: req.studentId,
        }).session(session);

        if (!currentPayment) {
          throw new Error("Payment record not found");
        }

        // Protect against simultaneous or repeated verification.
        if (currentPayment.status === "paid") {
          if (currentPayment.paymentId !== razorpay_payment_id) {
            throw new Error("Payment already processed with another ID");
          }

          const currentStudent = await Student.findById(req.studentId)
            .session(session);

          const currentMembership = currentStudent?.memberships.find(
            (item) => Number(item.classNo) === currentPayment.classNo
          );

          activatedMembership = currentMembership
            ? {
                classNo: currentMembership.classNo,
                plan: currentMembership.plan,
                status: currentMembership.status,
                purchasedAt: currentMembership.purchasedAt,
                expiresAt: currentMembership.expiresAt,
              }
            : null;

          return;
        }

        if (currentPayment.status !== "pending") {
          throw new Error("Payment order is not pending");
        }

        const student = await Student.findById(req.studentId).session(session);

        if (!student) {
          throw new Error("Student not found");
        }

        const now = new Date();

        let membership = student.memberships.find(
          (item) => Number(item.classNo) === currentPayment.classNo
        );

        if (!membership) {
          student.memberships.push({
            classNo: currentPayment.classNo,
            plan: currentPayment.plan,
            status: "active",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            purchasedAt: now,
            expiresAt: addMembershipDuration(now, currentPayment.plan),
          });

          membership = student.memberships[student.memberships.length - 1];
        } else {
          // Extend from the existing expiry only if it is still active.
          const currentExpiry =
            membership.status === "active" &&
            membership.expiresAt &&
            new Date(membership.expiresAt) > now
              ? new Date(membership.expiresAt)
              : now;

          membership.plan = currentPayment.plan;
          membership.status = "active";
          membership.paymentId = razorpay_payment_id;
          membership.orderId = razorpay_order_id;
          membership.purchasedAt = now;
          membership.expiresAt = addMembershipDuration(
            currentExpiry,
            currentPayment.plan
          );
        }

        await student.save({ session });

        currentPayment.status = "paid";
        currentPayment.paymentId = razorpay_payment_id;
        currentPayment.paidAt = now;

        await currentPayment.save({ session });

        activatedMembership = {
          classNo: membership.classNo,
          plan: membership.plan,
          status: membership.status,
          purchasedAt: membership.purchasedAt,
          expiresAt: membership.expiresAt,
        };
      });
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
      message: `Class ${paymentRecord.classNo} Premium activated`,
      membership: activatedMembership,
    });
  } catch (error) {
    console.error("Verify membership payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed. If money was deducted, contact support before retrying.",
    });
  }
});

export default router;
