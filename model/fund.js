const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FoundSchema = new Schema({
  email: {
    type: String,
    required: true
    },
  tx_ref: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  payment_type:{
    type: String,
    required: true
  },

  amount:{
    type: Number,
    required: true
  },

  status:{
    type: String,
    required: true
  },

  currency:{
    type: String,
    required: true
  },
 trans_account_number: {
    type: String,
    default: undefined,
    
  },

});

module.exports = mongoose.model('Found', FoundSchema );