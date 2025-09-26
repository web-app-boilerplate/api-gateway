import express from "express";
import authProxy from "../proxies/authProxy.js";
import userProxy from "../proxies/userProxy.js";
import paymentProxy from "../proxies/paymentProxy.js";
import creditProxy from "../proxies/creditProxy.js";

const router = express.Router();

router.use("/api/auth", authProxy);
router.use("/api/users", ...userProxy);
router.use("/api/payments", ...paymentProxy);
router.use("/api/credit", ...creditProxy);

router.get("/health", (req, res) => res.json({ status: "api-gateway ok" }));

export default router;
