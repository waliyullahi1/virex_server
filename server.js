require("dotenv").config();
const express = require("express");
const app = express();
const punycode = require('punycode/')
const PORT = process.env.PORT || 3500;
const path = require("path");
const { logger } = require("./middleware/logEvent");
const cors = require("cors");
const errorHandle = require("./middleware/erroHandle");
// const corsOptions = require("./config/corsOptions");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const credentials = require("./middleware/credentials");


//connect to mongoose
connectDB();

app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
//  app.use(credentials);

//Cross Origin Resource sharing

const corsOptions = {

  origin: ['http://localhost:5173','http://localhost:3001','https://www.abaniseedu.com', 'http://localhost:3000'],
  credentials: true,
  // optionsSuccessStatus:40

};
app.use(cors(corsOptions));


//Build-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

//buld-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

// serve static  public
app.use("/", express.static(path.join(__dirname, "/public")));

//routes
app.use("/", require("./route/root"));

app.use("/register", require("./route/api/register"));
app.use("/login", require("./route/api/login"));
app.use("/logout", require("./route/api/logout"));
app.use("/refresh", require("./route/refreshToken"));
app.use("/dashbord", require("./route/dashbord"));
app.use("/transaction", require("./route/transaction"));
app.use("/resetpassword", require("./route/resetpassword"));
app.use("/veryfyJWT", require("./middleware/verifyJWT"));
app.use("/valid", require("./controllers/verify"));
// app.use("/dd", require("./controllers/test"));
app.use("/getRates", require("./route/sms"));





// app.use(verifyJWT);


app.get(
  "/red(.html)?",
  (req, res, next) => {
    console.log("Allah help me");
    next();
  },
  (req, res) => {
    res.send("it is okay");
  }
);
//handle error
app.use(errorHandle);

mongoose.connection.once("open", () => {
  console.log("connected to mangoosedb");

  app.listen(PORT, () => console.log(`serves run on Port ${PORT}`));
});
