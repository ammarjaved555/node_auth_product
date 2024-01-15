require("dotenv").config()
const connectDb = require("./db/connect");
const User =require("./modal/user")
// const UserJson =  require("./user.json")
const start= async( userName ,password)=>{
    try {
        await connectDb(process.env.MONGODB_URI)
      return  await User.create({ userName, password})
        
    } catch (error) {
        console.log(error)
    }
}
module.exports = start