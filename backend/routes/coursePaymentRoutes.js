
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Student from "../models/Student.js";
import studentAuth from "../middleware/studentAuth.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const addDays = (date, days) => {
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};

const isValidSignature = (orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const received = Buffer.from(signature, "utf8");
  const generated = Buffer.from(generatedSignature, "utf8");

  return (
    received.length === generated.length &&
    crypto.timingSafeEqual(received, generated)
  );
};

// ==========================================
// CREATE COURSE PAYMENT ORDER
// ==========================================

router.post("/create-order", studentAuth, async (req, res) => {
  try {
    const { courseId, language = "Hindi" } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!["Hindi", "English"].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course language",
      });
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway is not configured",
      });
    }

    const [student, course] = await Promise.all([
      Student.findById(req.studentId).select("_id"),
      Course.findOne({
        _id: courseId,
        isPublished: true,
      }),
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!course.supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Selected language is not available",
      });
    }

    const amount = Number(course.price);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "This course is not available for online purchase",
      });
    }

    const now = new Date();

    const existingEnrollment = await CourseEnrollment.findOne({
      student: student._id,
      course: course._id,
      status: "active",
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    }).select("_id expiresAt");

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        alreadyEnrolled: true,
        message: "You already have active access to this course",
        expiresAt: existingEnrollment.expiresAt,
      });
    }

    const receipt = `c_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt,
      notes: {
        studentId: String(student._id),
        courseId: String(course._id),
        language,
      },
    });

    const enrollment = await CourseEnrollment.create({
      student: student._id,
      course: course._id,
      language,
      amountPaid: amount,
      currency: "INR",
      status: "pending",
      razorpayOrderId: order.id,
    });

    return res.status(201).json({
      success: true,
      message: "Course payment order created",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      enrollmentId: enrollment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
      course: {
        id: course._id,
        title: course.title,
        price: amount,
      },
      language,
    });
  } catch (error) {
    console.error("Create course payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create course payment order",
    });
  }
});

// ==========================================
// VERIFY COURSE PAYMENT
// ==========================================

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

  if (
    !process.env.RAZORPAY_KEY_SECRET ||
    !process.env.RAZORPAY_KEY_ID
  ) {
    return res.status(500).json({
      success: false,
      message: "Payment gateway is not configured",
    });
  }

  try {
    const enrollment = await CourseEnrollment.findOne({
      razorpayOrderId: razorpay_order_id,
      student: req.studentId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Course payment order not found",
      });
    }

    // Idempotency: do not activate the same payment twice.
    if (enrollment.status === "active") {
      if (enrollment.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          message: "Payment does not match this order",
        });
      }

      return res.json({
        success: true,
        message: "Payment was already verified",
        enrollment: {
          course: enrollment.course,
          status: enrollment.status,
          startsAt: enrollment.startsAt,
          expiresAt: enrollment.expiresAt,
        },
      });
    }

    if (enrollment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This payment order cannot be verified",
      });
    }

    if (
      !isValidSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Confirm payment directly with Razorpay.
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    const expectedAmount = Math.round(enrollment.amountPaid * 100);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.amount !== expectedAmount ||
      payment.currency !== enrollment.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not successfully captured",
      });
    }

    // Activate enrollment and record payment atomically.
    const session = await mongoose.startSession();

    let activatedEnrollment = null;

    try {
      await session.withTransaction(async () => {
        const currentEnrollment = await CourseEnrollment.findOne({
          _id: enrollment._id,
          student: req.studentId,
        }).session(session);

        if (!currentEnrollment) {
          throw new Error("Enrollment record not found");
        }

        if (currentEnrollment.status === "active") {
          if (
            currentEnrollment.razorpayPaymentId !==
            razorpay_payment_id
          ) {
            throw new Error("Payment already processed with another ID");
          }

          activatedEnrollment = currentEnrollment;
          return;
        }

        if (currentEnrollment.status !== "pending") {
          throw new Error("Payment order is not pending");
        }

        const now = new Date();

        const course = await Course.findById(
          currentEnrollment.course
        ).session(session);

        if (!course) {
          throw new Error("Course not found");
        }

        // Extend from the latest active enrollment if one exists.
        const existingActive = await CourseEnrollment.findOne({
          student: req.studentId,
          course: currentEnrollment.course,
          status: "active",
          expiresAt: { $gt: now },
        })
          .sort({ expiresAt: -1 })
          .session(session);

        const startsAt =
          existingActive &&
          existingActive.expiresAt > now
            ? new Date(existingActive.expiresAt)
            : now;

        const durationDays = Number(course.durationDays);

        if (
          !Number.isInteger(durationDays) ||
          durationDays < 1
        ) {
          throw new Error("Invalid course duration");
        }

        currentEnrollment.status = "active";
        currentEnrollment.razorpayPaymentId =
          razorpay_payment_id;
        currentEnrollment.razorpaySignature =
          razorpay_signature;
        currentEnrollment.purchasedAt = now;
        currentEnrollment.startsAt = startsAt;
        currentEnrollment.expiresAt = addDays(
          startsAt,
          durationDays
        );

        await currentEnrollment.save({ session });

        activatedEnrollment = currentEnrollment;
      });
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
      message: "Course payment verified and access activated",
      enrollment: {
        course: activatedEnrollment.course,
        status: activatedEnrollment.status,
        purchasedAt: activatedEnrollment.purchasedAt,
        startsAt: activatedEnrollment.startsAt,
        expiresAt: activatedEnrollment.expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify course payment error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Payment verification failed. If money was deducted, contact support before retrying.",
    });
  }
});

export default router;
