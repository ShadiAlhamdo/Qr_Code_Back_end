const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d", // Token expires in 30 days
    });
};

// @desc    Register a new user (manual)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "الرجاء إدخال جميع الحقول المطلوبة" });
    }

    try {
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "المستخدم موجود بالفعل (البريد الإلكتروني أو اسم المستخدم)" });
        }

        const user = await User.create({
            username,
            email,
            password, // Password will be hashed by pre-save middleware in user.model.js
            authMethod: "manual",
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                authMethod: user.authMethod,
                token: generateToken(user._id),
                message: "تم تسجيل المستخدم بنجاح"
            });
        } else {
            res.status(400).json({ message: "بيانات المستخدم غير صالحة" });
        }
    } catch (error) {
        console.error("Error in registerUser:", error);
        // Check for duplicate key errors (though findOne should catch it)
        if (error.code === 11000) {
             return res.status(400).json({ message: "البريد الإلكتروني أو اسم المستخدم موجود بالفعل." });
        }
        res.status(500).json({ message: "خطأ في الخادم أثناء تسجيل المستخدم", error: error.message });
    }
};

// @desc    Authenticate user & get token (manual login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" });
    }

    try {
        const user = await User.findOne({ email, authMethod: "manual" }).select("+password"); // Explicitly select password

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                authMethod: user.authMethod,
                token: generateToken(user._id),
                message: "تم تسجيل الدخول بنجاح"
            });
        } else {
            res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ message: "خطأ في الخادم أثناء تسجيل الدخول", error: error.message });
    }
};

// @desc    Get current user profile (protected route)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is set by the authMiddleware
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            authMethod: req.user.authMethod,
        });
    } else {
        res.status(404).json({ message: "المستخدم غير موجود" }); // Should not happen if authMiddleware is correct
    }
};


// Placeholder for Google OAuth functions
// These will require passport.js or a similar library and Google Cloud Console setup

// @desc    Redirect to Google for authentication
// @route   GET /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
    // This would typically redirect to Google's OAuth consent screen
    // Example: res.redirect(googleOAuthURL);
    res.status(501).json({ message: "مصادقة جوجل لم يتم تنفيذها بعد. تحتاج إلى GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET." });
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleAuthCallback = async (req, res) => {
    // Google will redirect here after user authentication
    // const { code } = req.query; // Authorization code from Google
    // 1. Exchange code for tokens (access_token, id_token)
    // 2. Get user profile from Google using tokens
    // 3. Find or create user in your DB
    // 4. Generate JWT for your app
    // 5. Redirect to frontend with token or user info
    res.status(501).json({ message: "رد نداء مصادقة جوجل لم يتم تنفيذه بعد." });
};


module.exports = {
    registerUser,
    loginUser,
    getMe,
    googleAuth,
    googleAuthCallback,
};
