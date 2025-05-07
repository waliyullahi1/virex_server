const mongoose = require('mongoose');
const fetchTime = require("../config/fetchtime");

const userSchema = new mongoose.Schema({
  first_Name: {
    type: String,
    required: true
  },
  last_Name: {
    type: String,
    required: true
  },
  middle_Name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone_Number: {
    type: String
  },
  password: {
    type: String // optional if using OAuth
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['Candidate', 'Employer', 'Admin'],
    default: 'Candidate' // Correctly placed default outside the enum object
  },
  status: { // status field to handle verification
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: null 
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);
