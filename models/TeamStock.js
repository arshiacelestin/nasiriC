const mongoose = require("mongoose");

const ts = new mongoose.Schema({
    team_id: {type: mongoose.Schema.Types.ObjectId, required:true},
    stock_id: {type: mongoose.Schema.Types.ObjectId, required:true},
    quantity: {type: Number, required:true}
});

const TeamStock = mongoose.model("TeamStock", ts);
module.exports = TeamStock;