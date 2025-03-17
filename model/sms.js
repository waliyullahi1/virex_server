const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SmsSchema = new Schema({
  email: {
    type: String,
    required: true
    },
  
    Activation_Code:{
    type: String,
  },
 
  transactiondate: {
    type: String,
    required: true
  },


  Phone_Number:{
    type: String,
    required: true
  },

  Country:{
    type: String,
    required: true
  },

  App:{
    type: String,
    required: true
  },
  Amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
   default: "No Used"
  },
  token:  String,
  
  new_bal: {
    type: Number
  },
  status: { 
    type: String, 
    enum: ["active", "expired"], 
    default: "active" 
  },
});

module.exports = mongoose.model('sms', SmsSchema );