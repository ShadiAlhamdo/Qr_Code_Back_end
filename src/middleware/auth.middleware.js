const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (select everything except password)
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "غير مصرح به، المستخدم غير موجود" });
            }

            next();
        } catch (error) {
            console.error("Error in auth middleware:", error);
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({ message: "غير مصرح به، الرمز المميز غير صالح" });
            }
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "غير مصرح به، انتهت صلاحية الرمز المميز" });
            }
            return res.status(401).json({ message: "غير مصرح به، خطأ في الرمز المميز" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "غير مصرح به، لا يوجد رمز مميز" });
    }
};

module.exports = { protect };

