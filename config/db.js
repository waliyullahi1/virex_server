const mongoose = require('mongoose')

const connectdb = async () =>{
    try{
        await mongoose.connect(process.env.DATA_BASE, {
        });
    } catch  (err) {
        console.error(err);
    }
}

module.exports = connectdb
