const express = require("express");
const router = express.Router();
const savenewFund = require("../controllers/fundsave");
const FundSchema = require("../model/fund");
const axios = require('axios');
const Transaction = require('../model/Transactions');
const Virexscheme = require("../model/Users");

const AsyncLock = require('async-lock');  
const { is } = require("date-fns/locale");
const lock = new AsyncLock();              


router.get("/", async (req, res) => {

  lock.acquire('transaction-lock', async (done) => {
    
    try {
      try {
        const response = await axios.get('https://api.flutterwave.com/v3/transactions', {
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
          }
        });

        const transactions = response.data.data;
        console.log('Total transactions to process', transactions);
      
        // for (const txn of transactions) {
        //   const is_Transaction_exist = await FundSchema.findOne({tx_ref: txn.tx_ref});
        //   if(is_Transaction_exist) {
        //     console.log(is_Transaction_exist, 'is alredy exist');
        //     return res.status(200).json({ message: 'Transactions processed successfully' });
            
        //   }
        //   try {
        //     console.log('Processing transaction:', txn.id);

        //     const existing = await Transaction.findOne({ tx_ref: txn.tx_ref });
        //     if (existing) {
        //       console.log(`Transaction ${txn.id} already exists, skipping.`);
        //       return res.status(200).json({ message: 'Transactions processed successfully' });
        //     }

        //     const date = new Date(txn.created_at);
        //     const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        //     const userFound = await Virexscheme.findOne({ email: txn.customer.email }).exec();
        //     if (!userFound) {
        //       console.log(`User with email ${txn.customer.email} not found, skipping.`);
        //       return res.status(200);
        //     }

        //     // Save new fund
        //     await savenewFund(
        //       txn.customer.email,
        //       txn.tx_ref,
        //       txn.payment_type,
        //       'none',
        //       txn.amount,
        //       'none',
        //       txn.status,
        //       "none",
        //       formattedDate,
        //       txn.id,
        //     );

        //     if (txn.status === "successful") {
        //       userFound.walletBalance += txn.amount_settled;
        //       await userFound.save();
        //       console.log(`Wallet updated for ${txn.customer.email}`);
        //     }

        //     console.log(`Transaction ${txn.id} processed successfully.`);

        //   } catch (innerError) {
        //     console.error(`Error processing transaction ${txn.id}:`, innerError.message);
        //     // continue to next transaction
        //   }
        // }

        console.log('All transactions fetched and processed!');
        return res.status(200).json({ message: transactions });

      } catch (error) {
        console.error('Error fetching transactions:', error.response ? error.response.data : error.message);
        return res.status(500).json({ error: 'Error fetching transactions' });
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
});

module.exports = router;