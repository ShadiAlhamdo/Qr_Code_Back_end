const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "اسم المستخدم مطلوب"],
        unique: true,
        trim: true,
        minlength: [4, "يجب أن يكون اسم المستخدم 4 أحرف على الأقل"],
        maxlength: [25, "يجب ألا يتجاوز اسم المستخدم 25 حرفًا"]
    },
    email: {
        type: String,
        required: [true, "البريد الإلكتروني مطلوب"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "يرجى إدخال بريد إلكتروني صالح"]
    },
    password: {
        type: String,
        required: function() { return this.authMethod === "manual"; },
        minlength: [6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل"],
        select: false // Do not return password by default
    },
    authMethod: {
        type: String,
        enum: ["manual", "google"],
        required: true,
        default: "manual"
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to hash password before saving (for manual registration)
UserSchema.pre("save", async function(next) {
    if (!this.isModified("password") || this.authMethod !== "manual") {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
UserSchema.methods.comparePassword = async function(enteredPassword) {
    if (this.authMethod !== "manual" || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);

