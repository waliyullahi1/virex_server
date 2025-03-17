const Virexscheme = require("../model/Users");
const bcrypt = require('bcryptjs');




const handleNewUsers = async (req, res) => {
  const { full_name, password, email, phone } = req.body;
  if (!full_name || !password || !email || !phone )
    return res
      .status(400)
      .json({ message: "An error as occur" });
  

  //check of duplicate username, phome, email, from db
  const duplicate = await Virexscheme.findOne({ email: email }).exec();
  const duplicatePhone = await Virexscheme.findOne({ phone: phone }).exec();
  
  if (duplicate) return res.status(409).json({ message: "email has already been used" });
  if (duplicatePhone) return res.status(409).json({ message: "Phone has already been used" });
 

  try {
    //encrypt  the password
    const hashedPwd = await bcrypt.hash(password, 10);
    
   
    const result = await Virexscheme.create({
      full_name,
      email,
      phone,
      password: hashedPwd,
    }); 

    console.log(result)
    

    
    res.status(201).json({ success : `your account created sucessful ` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { handleNewUsers };