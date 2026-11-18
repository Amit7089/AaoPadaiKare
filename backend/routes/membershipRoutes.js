
import express from "express";
import Student from "../models/Student.js";
import studentAuth from "../middleware/studentAuth.js";
import membershipPlans from "../config/membershipPlans.js";

const router = express.Router();

function isMembershipActive(membership, now = new Date()) {
  if (!membership || membership.status !== "active" || !membership.expiresAt) {
    return false;
  }

  const expiry = new Date(membership.expiresAt);

  return Number.isFinite(expiry.getTime()) && expiry > now;
}

function getActiveMembership(memberships = [], classNo, now = new Date()) {
  return memberships.find(
    (item) =>
      Number(item.classNo) === Number(classNo) &&
      isMembershipActive(item, now)
  );
}

// GET ALL MEMBERSHIP PLANS
router.get("/plans", (req, res) => {
  const plans = Object.entries(membershipPlans).map(
    ([classNo, prices]) => ({
      classNo: Number(classNo),
      monthly: prices.monthly,
      yearly: prices.yearly,
      currency: "INR",
    })
  );

  return res.json({
    success: true,
    plans,
  });
});

// GET LOGGED-IN STUDENT MEMBERSHIPS
router.get("/my-memberships", studentAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.studentId).select(
      "memberships classNo"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const now = new Date();

    const memberships = (student.memberships || []).map((membership) => {
      const active = isMembershipActive(membership, now);

      return {
        ...membership.toObject(),
        status: active ? "active" : "expired",
        isActive: active,
      };
    });

    const activeClassNumbers = [
      ...new Set(
        memberships
          .filter((membership) => membership.isActive)
          .map((membership) => Number(membership.classNo))
      ),
    ];

    return res.json({
      success: true,
      registeredClass: student.classNo,
      memberships,
      activeClassNumbers,
      activeMembershipCount: activeClassNumbers.length,
    });
  } catch (error) {
    console.error("Get memberships error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load memberships",
    });
  }
});

// CHECK PREMIUM ACCESS FOR A PARTICULAR CLASS
router.get("/check/:classNo", studentAuth, async (req, res) => {
  try {
    const classNo = Number(req.params.classNo);

    if (!Number.isInteger(classNo) || classNo < 6 || classNo > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid class number",
      });
    }

    const student = await Student.findById(req.studentId).select(
      "memberships"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const membership = getActiveMembership(
      student.memberships || [],
      classNo
    );

    return res.json({
      success: true,
      classNo,
      isPremium: Boolean(membership),
      membership: membership || null,
    });
  } catch (error) {
    console.error("Membership check error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not check membership",
    });
  }
});

export default router;
