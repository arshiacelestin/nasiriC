const mongoose = require("mongoose");

const NSchema = new mongoose.Schema({
    topic: {type: String, required:true},
    text: {type: String, required:true},
    publisher_name: {type: String, required:true},
    uploader_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    uploader_name: {type: String, required: true},
    createdAt: {type: Date, default: Date.now}
});

const Notification = mongoose.model("Notification", NSchema);

module.exports = Notification;