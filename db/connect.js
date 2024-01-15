const mongoose = require("mongoose");


const connectDb = async (uri) => {
    console.log("do again")
    try {
        await mongoose.connect(uri);
        console.log("CONNECTED TO DATABASE SUCCESSFULLY");
    } catch (error) {
        console.error('COULD NOT CONNECT TO DATABASE:', error.message);
    }
};



module.exports = connectDb;