// const mongoose = require('mongoose');

// const connectDB = async () => {
//     try {
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log('mongoDB connected');

//         } catch (err){
//             console.error(err.message);
//             process.exit(1);
//         }
// };
// module.exports = connectDB;


const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("mongoDB connected");
  } catch (err) {
    console.error("FULL MONGODB ERROR:");
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;