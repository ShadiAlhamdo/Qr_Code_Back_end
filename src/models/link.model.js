const mongoose = require("mongoose");

const LinkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Refers to the User collection
        required: true
    },
    originalUrl: {
        type: String,
        required: [true, "الرابط الأصلي مطلوب"],
        trim: true
    },
    // Since Cloudinary is not used, we won't store permanent QR code URLs here.
    // QR codes will be generated on-the-fly for download.
    // We might store temporary filenames if files are saved to server before download,
    // but for now, let's assume direct streaming or temporary in-memory generation.
    qrCodePngFilename: { // Example if we decide to store temp filename for user's history
        type: String,
        trim: true
    },
    qrCodePdfFilename: { // Example if we decide to store temp filename for user's history
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Link", LinkSchema);

