const mongoose = require("mongoose");
const Scheme = mongoose.Schema;

const Virexscheme = new Scheme({
  full_name: {
    type: String,
    require: true,
  },

  email: {
    type: String,
    require: true,
  },

  roles: {
    User: {
      type: String,
      default: 2001,
    },
    Editor: Number,
    Admin: Number,
  },
  password: {
    type: String,
    require: true,
  },


  phone: {
    type: String,
    require: true,
  },

  walletBalance: {
    type: Number,
    default: 0, 
  },
 
  refreshToken: {
    type: String,
    default: undefined,
    
  },
});

module.exports = mongoose.model("virex", Virexscheme);

