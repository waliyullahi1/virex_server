const Flutterwave = require('flutterwave-node-v3');
const jwt = require("jsonwebtoken");
const Virexscheme = require("../model/Users");
const savenewFund = require("./fundsave");
const FundSchema = require("../model/fund");
const axios = require('axios')
const User = require("../model/Users");
const AsyncLock = require('async-lock');
const lock = new AsyncLock();



// Format the date to "MM/DD/YYYY HH:mm"
const changedate = (dateTimeString) => {

  const date = new Date(dateTimeString);
  const formattedDate = date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,  // 24-hour format
  });
  return formattedDate;
}



async function fetchTime() {
  const url = "https://timeapi.io/api/Time/current/zone?timeZone=Africa/Lagos";
  const timeout = 5000; // 5 seconds timeout per request
  const maxTime = 180000; // 3 minutes in milliseconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxTime) {
    try {
      const response = await axios.get(url, { timeout });
      const data = response.data;
      ;
      return data.dateTime;
    } catch (error) {
      //console.log("Error fetching time, retrying...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
  }

  //console.log("Failed to fetch time after 3 minutes. Retrying...");
  return fetchTime(); // Restart the function after 3 minutes
}

async function verifyPayment(transactionId) {
  //console.log(transactionId);

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );


    return response.data.data;

  } catch (error) {
    console.error("Error verifying transaction:", error);
  }
}

async function verifyTransactionByTxRef(txRef) {
  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    // console.log("Transaction Search Response:", response.data);

    if (response.data.data.length > 0) {

      const transaction = response.data.data[0]; // Assuming tx_ref is unique
      return transaction
    } else {
      // console.log(response);

      return 'failed'
    }
  } catch (error) {
    console.error("Error verifying transaction by tx_ref:", error);
  }
}

// Call the function with your tx_ref







const Fund_wallet_by_transfer = async (req, res) => {
  try {
    // Check if JWT exists in cookies
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;
    const userFound = await Virexscheme.findOne({ refreshToken }).exec();

    // Check if user is found
    if (!userFound) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate request body
    const { amount, payment_type } = req.body;
    if (!amount || !payment_type) {
      return res.status(400).json({ error: "Amount and payment type are required" });
    }
    const retrieve_transaction = await FundSchema.findOne({ status: "processing", email: userFound.email, amount })
      .sort({ _id: -1 }) // Sort by descending order to get the latest document
      .exec();
    //console.log(retrieve_transaction);

    if (retrieve_transaction) {
      //console.log('one transaction is pending');

      const current_time = await fetchTime()
      //console.log(current_time, 'cuurent time');
     // console.log(retrieve_transaction.account_expiration, 'expiretime');
      //console.log(retrieve_transaction && new Date(retrieve_transaction.account_expiration) < new Date(current_time));

      if (
        retrieve_transaction &&
        retrieve_transaction.account_expiration &&
        new Date(retrieve_transaction.account_expiration) > new Date(current_time)
      ) {
        //console.log('Transaction has not expired.');

        const transaction_details = retrieve_transaction;
        return res.json({ transaction_details });
      } else {
        //console.log("Transaction has expired or transaction details are missing.");
      }


    }
    // Generate a unique transaction reference
    const tx_ref = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    //console.log(tx_ref, 'first');
    const public = 'FLWPUBK-3441a7d6bfb8753d177f53a0c7136302-X'
    const security = 'FLWSECK-969940db0e57860879904ee02371a897-1964fd68895vt-X'
    //Initialize Flutterwave
    const flw = new Flutterwave(public, security);

    // Transaction details
    const details = {
      tx_ref,
      amount,
      currency: 'NGN',
      email: userFound.email,
      fullname: userFound.full_name,
      phone_number: userFound.phone,

    };

    // Process bank transfer
    const response = await flw.Charge.bank_transfer(details);
    //console.log(await response.meta);

    // Ensure response contains authorization details
    if (!response.meta || !response.meta.authorization) {
      return res.status(500).json({ error: "Transaction authorization failed" });
    }

    const transac_dts = response.meta.authorization;

    // Save transaction details
    //console.log(tx_ref, 'second');
    const savefound = await savenewFund(
      userFound.email,
      tx_ref,
      payment_type,
      transac_dts.transfer_bank,
      amount,
      transac_dts.account_expiration,
      "processing", // Explicitly passing status
      transac_dts.transfer_account,
      'none',
      'none'
    );

    const transaction_details = savefound
    // Return response
    res.json({ transaction_details });
  } catch (error) {
    //console.error("Transaction Error:", error);
    res.status(500).json({ error: "Transaction failed" });
  }
};


const fund_wallet_by_card = async (req, res) => {
  try {
    // Check if JWT exists in cookies
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;
    const userFound = await Virexscheme.findOne({ refreshToken }).exec();

    // Check if user is found
    if (!userFound) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate request body
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "transaction id is require" });
    }


    // Initialize Flutterwave
    //console.log(id);

    const transaction_id = await verifyPayment(id);
    //console.log(transaction_id);

    if (!transaction_id) return res.status(401).json({ message: 'no transaction fund' })
    //console.log(transaction_id.data.status, 'vcdxcc')
    if (transaction_id.data.status === "successful") {
      const transaction_details = transaction_id.data
      const converttime = changedate(transaction_details.created_at)


      const savefound = await savenewFund(
        userFound.email,
        transaction_details.tx_ref,
        transaction_details.payment_type,
        'none',
        transaction_details.amount,
        'none',
        transaction_details.status, // Explicitly passing status
        'none',
        converttime,
        transaction_details.id
      );


      userFound.walletBalance += transaction_details.amount_settled;

      await userFound.save();


      res.json({ message: 'success' });
    }



    // Return response
    return
  } catch (error) {
    //console.error("Transaction Error:", error);
    res.status(500).json({ error: "Transaction failed" });
  }
};

const webhook = async (req, res) => {
  lock.acquire('transaction-lock', async (done) => {
    try {


      const event = req.body;
      //console.log(event);


      const verify = await verifyPayment(event.id);
      //console.log(verify);

      if (verify.status === "successful") {
        //console.log("Payment successful:", verify.status, verify.data.tx_ref);

        ; // Use event.tx_ref, assuming correct key


        const transaction = await FundSchema.findOne({ tx_ref: event.txRef }).exec();
       //console.log(transaction);
        if (transaction) {
          if (transaction.status === "successful") {
            console.log("Transaction already processed");
            return;
          }

          // Update transaction status
          transaction.status = event.status;
          transaction.transaction_id = event.id

          await transaction.save(); // Ensure the save completes
          //console.log(transaction, 'ffffff');

          // Find user
          const user = await User.findOne({ email: transaction.email }).exec();

          if (!user) {
           // console.log("User not found");
            return;
          }

          // Update wallet balance
          user.walletBalance += verify.amount_settled;
          await user.save(); // Save updated user balance

          //console.log("Updated user balance:", user.walletBalance);
        } else {
          //console.log("Transaction not found"); // Improved error message
          return;
        }
      } else {
        //console.log(verify.status);
        if (verify.status === "failed" || verify.status === "timeout" || verify.status === "cancelled") {

          const transaction = await FundSchema.findOne({ tx_ref: event.txRef }).exec();
          transaction.status = verify.status;
          transaction.transaction_id = event.id
          await transaction.save();
          res.sendStatus(200); // Acknowledge failure event
          return;
        }
      }





    } finally {
      done(); // Release the lock
    }
  }, (err) => {
    if (err) {
      //console.error("Lock error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });



  // Acknowledge receipt
}



const valid_transaction = async (req, res) => {
  lock.acquire('transaction-lock', async (done) => {
    try {
      const cookies = req.cookies;
      if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized: No token provided" });
      //console.log("i see something");
      const current_time = await fetchTime()
      const refreshToken = cookies.jwt;
      const userFound = await Virexscheme.findOne({ refreshToken }).exec();
      if (!userFound) return res.status(401).json({ message: "User not found" });
      const { tx_ref } = req.body;


      if (!tx_ref) return res.status(400).json({ message: "Transaction reference is required" });

      const transact_found = await FundSchema.findOne({ tx_ref })
      if (transact_found) {
        if (transact_found.status === "Expired") {
          //console.log('expired');

          await transact_found.deleteOne();;
          return res.status(200).json({ message: "Expired" });
        }
        if (transact_found.status === 'successful' || transact_found.status === "failed" || transact_found.status === "timeout" || transact_found.status === "cancelled") {
          //console.log("transaction already process");

          return res.status(200).json({ message: transact_found.status });
        } else {

          if (transact_found.account_expiration && new Date(transact_found.account_expiration) < new Date(current_time)) {
            //console.log("i see something6");
            const valid_transaction_id = await verifyTransactionByTxRef(transact_found.tx_ref);

            if (!valid_transaction_id.status) {
              await transact_found.deleteOne();
              return res.status(200).json({ message: "Expired" });
            }


            // Check if the transaction was successful
            if (valid_transaction_id && valid_transaction_id.status === "successful") {

              // Update transaction record
              transact_found.status = valid_transaction_id.status;
              transact_found.transaction_id = valid_transaction_id.id;
              await transact_found.save(); // Save transaction status update

              // Find user based on email linked to the transaction
              const user = await User.findOne({ email: transact_found.email }).exec();
              if (!user) {
                //console.log("User not found");
                return res.status(404).json({ message: "User not found" });
              }

              // Update the user's wallet balance based on transaction amount
              user.walletBalance += valid_transaction_id.amount_settled;
              await user.save(); // Save updated user balance

              return res.status(200).json({ message: valid_transaction_id.status });

            } else {
              // Handle failed, pending, or other transaction statuses
              if (valid_transaction_id && (valid_transaction_id.status === "failed" || valid_transaction_id.status === "pending")) {
                transact_found.status = valid_transaction_id.status;  // Update to failed/pending
                await transact_found.save();
                return res.status(200).json({ message: valid_transaction_id.status });
              } else {
                const valid_transaction_id = await verifyTransactionByTxRef(transact_found.tx_ref);
                if (!valid_transaction_id.status) return res.status(200).json({ message: "Expired" });
                return res.status(400).json({ message: "Invalid transaction or status not recognized" });
              }
            }

          } else {
            const valid_transaction_id = await verifyTransactionByTxRef(transact_found.tx_ref);

            if (!valid_transaction_id.status) return res.status(200).json({ message: "Transaction still under process" })

            if (valid_transaction_id && valid_transaction_id.status === "successful") {

              if (transact_found.status === "successful") {
                //console.log("Transaction already processed successfully. Skipping duplicate processing.");
                return res.status(200).json({ message: "Transaction already processed" });
              }

              // Update transaction record
              transact_found.status = valid_transaction_id.status;
              transact_found.transaction_id = valid_transaction_id.id;
              await transact_found.save(); // Save transaction status update

              // Find user based on email linked to the transaction
              const user = await User.findOne({ email: transact_found.email }).exec();
              if (!user) {
                //console.log("User not found");
                return res.status(404).json({ message: "User not found" });
              }
             // console.log(valid_transaction_id.amount_settled);
              //console.log(user.walletBalance);
              // Update the user's wallet balance based on transaction amount
              user.walletBalance += valid_transaction_id.amount_settled;
              await user.save(); // Save updated user balance
              //console.log(user.walletBalance);

              return res.status(200).json({ message: valid_transaction_id.status });

            } else {

              // Handle failed, pending, or other transaction statuses
              if (valid_transaction_id && (valid_transaction_id.status === "failed" || valid_transaction_id.status === "pending")) {
                transact_found.status = valid_transaction_id.status;
                //console.log("i see something12"); // Update to failed/pending
                await transact_found.save();
                return res.status(200).json({ message: valid_transaction_id.status });
              }
            }
          }
        }

      } else {

        return res.status(401).json({ message: 'No record found for this transaction' })
      }

    } finally {
      done(); // Release the lock
    }
  }, (err) => {
    if (err) {
      //console.error("Lock error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};
// const valii_transaction = async (req, res) => {
//   try {
//     if (isLocked) {
//       return res.status(429).json({ message: "Transaction is already in process. Please wait." });
//     }

//     isLocked = true;



//     let isLocked = false;

//     const cookies = req.cookies;
//     if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized: No token provided" });
//     //console.log("i see something");
//     const current_time = await fetchTime()
//     const refreshToken = cookies.jwt;
//     const userFound = await Virexscheme.findOne({ refreshToken }).exec();
//     if (!userFound) return res.status(401).json({ message: "User not found" });
//     const { tx_ref } = req.body;


//     if (!tx_ref) return res.status(400).json({ message: "Transaction reference is required" });

//     const transact_found = await FundSchema.findOne({ tx_ref })
//     if (transact_found) {
//       if (transact_found.status === "Expired") {
//         console.log('expired');

//         await transact_found.deleteOne();;
//         return res.status(200).json({ message: "Expired" });
//       }
//       if (transact_found.status === 'successful' || transact_found.status === "failed" || transact_found.status === "timeout" || transact_found.status === "cancelled") {
//        // console.log("transaction already process");

//         return res.status(200).json({ message: transact_found.status });
//       } else {

//         if (transact_found.account_expiration && new Date(transact_found.account_expiration) < new Date(current_time)) {
//           console.log("i see something6");
//           const valid_transaction_id = await verifyTransactionByTxRef(transact_found.tx_ref);

//           if (!valid_transaction_id.status) {
//             await transact_found.deleteOne();
//             return res.status(200).json({ message: "Expired" });
//           }


//           // Check if the transaction was successful
//           if (valid_transaction_id && valid_transaction_id.status === "successful") {

//             // Update transaction record
//             transact_found.status = valid_transaction_id.status;
//             transact_found.transaction_id = valid_transaction_id.id;
//             await transact_found.save(); // Save transaction status update

//             // Find user based on email linked to the transaction
//             const user = await User.findOne({ email: transact_found.email }).exec();
//             if (!user) {
//               //console.log("User not found");
//               return res.status(404).json({ message: "User not found" });
//             }

//             // Update the user's wallet balance based on transaction amount
//             user.walletBalance += valid_transaction_id.amount_settled;
//             await user.save(); // Save updated user balance

//             return res.status(200).json({ message: valid_transaction_id.status });

//           } else {
//             // Handle failed, pending, or other transaction statuses
//             if (valid_transaction_id && (valid_transaction_id.status === "failed" || valid_transaction_id.status === "pending")) {
//               transact_found.status = valid_transaction_id.status;  // Update to failed/pending
//               await transact_found.save();
//               return res.status(200).json({ message: valid_transaction_id.status });
//             } else {
//               const valid_transaction_id = await verifyTransactionByTxRef(transact_found.tx_ref);
//               if (!valid_transaction_id.status) return res.status(200).json({ message: "Expired" });
//               return res.status(400).json({ message: "Invalid transaction or status not recognized" });
//             }
//           }

//         } else {
//           const valid_transaction_id = await verifyTransactionByTxRef(transact_found.tx_ref);

//           if (!valid_transaction_id.status) return res.status(200).json({ message: "Transaction still under process" })

//           if (valid_transaction_id && valid_transaction_id.status === "successful") {

//             if (transact_found.status === "successful") {
//              // console.log("Transaction already processed successfully. Skipping duplicate processing.");
//               return res.status(200).json({ message: "Transaction already processed" });
//             }

//             // Update transaction record
//             transact_found.status = valid_transaction_id.status;
//             transact_found.transaction_id = valid_transaction_id.id;
//             await transact_found.save(); // Save transaction status update

//             // Find user based on email linked to the transaction
//             const user = await User.findOne({ email: transact_found.email }).exec();
//             if (!user) {
//              //console.log("User not found");
//               return res.status(404).json({ message: "User not found" });
//             }
//             //console.log(valid_transaction_id.amount_settled);
//             //console.log(user.walletBalance);
//             // Update the user's wallet balance based on transaction amount
//             user.walletBalance += valid_transaction_id.amount_settled;
//             await user.save(); // Save updated user balance
//             //console.log(user.walletBalance);

//             return res.status(200).json({ message: valid_transaction_id.status });

//           } else {

//             // Handle failed, pending, or other transaction statuses
//             if (valid_transaction_id && (valid_transaction_id.status === "failed" || valid_transaction_id.status === "pending")) {
//               transact_found.status = valid_transaction_id.status;
//               //console.log("i see something12"); // Update to failed/pending
//               await transact_found.save();
//               return res.status(200).json({ message: valid_transaction_id.status });
//             }
//           }
//         }
//       }

//     } else {

//       return res.status(401).json({ message: 'No record found for this transaction' })
//     }



//   } finally {
//     // Release the lock after processing
//     isLocked = false;
//   }


// }


module.exports = { Fund_wallet_by_transfer, webhook, valid_transaction, fund_wallet_by_card } 