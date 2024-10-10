// models/Detection.js
import mongoose from 'mongoose';

const DetectionSchema = new mongoose.Schema({
    fileName: String,
    detectedObjects: [
        {
            className: String,
            score: Number,
        },
    ],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Detection || mongoose.model('Detection', DetectionSchema);
