const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    "username": {type: String, required: true},
    "password": {type: String, required: true},
    "team_id": {type: mongoose.Schema.Types.ObjectId, required: true},
    "status": {type: String, required:true},
    "visible": {type:Boolean, default:true}
});

const User = mongoose.model("User", UserSchema);

module.exports = User;