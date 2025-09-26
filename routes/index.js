import express from "express";
import authProxy from "../proxies/authProxy.js";
import userProxy from "../proxies/userProxy.js";
import paymentProxy from "../proxies/paymentProxy.js";

const router = express.Router();

router.use("/api/auth", authProxy);
router.use("/api/users", ...userProxy);
router.use("/api/payments", ...paymentProxy);

router.get("/health", (req, res) => res.json({ status: "api-gateway ok" }));

export default router;
