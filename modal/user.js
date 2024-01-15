const mongoose = require("mongoose");
const userSchema= new mongoose.Schema({
    firstName:{
        type : String,
    },
    lastName:{
        type : String,
    },
    userName:{
    type : String,
require: [true, "please enter email"]
}, password:{
    type : String,
require: true
},
phone:{
    type : Number,
},
  token: {
    type: String,
  },

})

const User = mongoose.model('User', userSchema);

module.exports = User;