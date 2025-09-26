import dotenv from "dotenv";
dotenv.config();

export default {
    port: process.env.PORT || 4000,
    jwtSecret: process.env.JWT_SECRET,
    services: {
        auth: process.env.AUTH_SERVICE_URL || "http://auth-service:5004",
        user: process.env.USER_SERVICE_URL || "http://user-service:5001",
        payment: process.env.PAYMENT_SERVICE_URL || "http://payment-service:5002"
    }
};
