const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    stock_id: {type: mongoose.Schema.Types.ObjectId, required:true, ref: "Stock"},
    stock_name: {type: String, required:true},
    stock_price: {type: Number, required:true},
    number: {type: Number, required:true},
    user_id: {type: mongoose.Schema.Types.ObjectId,required:true},
    team_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    operation: {type: String, required:true},
    createdAt: {type: Date, default: Date.now}
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;