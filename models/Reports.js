const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    report: {type: String, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    admin_id: {type: mongoose.Schema.Types.ObjectId, required:true},
    answer: {type: String, default: ""},
    createdAt: {type: Date, default: Date.now}
});


const Report = mongoose.model("Report", ReportSchema);
module.exports = Report;