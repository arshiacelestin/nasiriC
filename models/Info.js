const mongoose = require("mongoose");

const info = mongoose.Schema({
    user_id: {type: mongoose.Schema.Types.ObjectId},
    text: {type: [String], default: "none"},
    createdAt: {type: Date, default: Date.now}
});

const Info = mongoose.model("info", info);

module.exports = Info;