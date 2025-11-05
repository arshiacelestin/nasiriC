const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
    name: {type: String, required:true},
    price: {type: Number, required:true},
    quantity: {type:Number, required:true},
    priceHistory: {
        type: [Number],
    }
});

const Stock = mongoose.model("Stock", StockSchema);
module.exports = Stock;