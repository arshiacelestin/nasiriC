const mongoose = require("mongoose");

const model = new mongoose.Schema({
    offerer: {type: mongoose.Schema.Types.ObjectId, required:true},
    reciver: {type: mongoose.Schema.Types.ObjectId, required:true},
    bos: {type: String, required:true},
    what_stock: {type: mongoose.Schema.Types.ObjectId, required:true},
    how_many: {type: Number, required:true},
    payment_method: {type: String, required:true},
    payment_amount: {type: Number, required:true},
    pbs: {type: mongoose.Schema.Types.ObjectId},
    state: {type: Boolean, default:false}
});

const offer = mongoose.model("offer", model);
module.exports = offer;