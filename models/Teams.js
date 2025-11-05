const mongoose = require("mongoose");
require("dotenv").config()


const TeamSchema = new mongoose.Schema({
    net_worth: {type: Number, required: true, default:process.env.TD},
    name: {type: String, required:true},
    color: {type: String, required: true},
    users_id: [String],
    createdAt: {type: Date, default: Date.now}
});

const Team = mongoose.model("Team", TeamSchema);

module.exports = Team;