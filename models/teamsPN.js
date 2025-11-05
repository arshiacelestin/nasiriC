const mongoose = require("mongoose");
require("dotenv").config();

const pnSchema = new mongoose.Schema({
    team_id: {type: mongoose.Schema.Types.ObjectId, required:true},
    team_name: {type: String, required: true},
    pn: {type: Number, required:true, default: process.env.TD},
    last_updated: {type: Date, default: Date.Now}
});

const pn = mongoose.model("pn", pnSchema);
module.exports = pn;