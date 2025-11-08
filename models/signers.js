const mongoose = require("mongoose");

const model = new mongoose.Schema({
    team_name: {type: String, required: true},
    first_mate: {type: String, required:true},
    first_phone: {type: String, required:true},
    second_mate: {type: String, required:true},
    second_phone: {type: String, required:true},
    third_mate: {type: String, required:true},
    third_phone: {type: String, required:true},
    school: {type: String, required:true},
    clas: {type: String, required:true},
    color: {type: String, required:true},
    pic: {type: String, required:true},
    createdAt: {type: Date, default: Date.now}
});

const signers = mongoose.model("signers", model);
module.exports = signers;