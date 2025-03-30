const fundSchema = require('../model/fund'); 
const axios = require('axios');
const time = require("../config/fetchtime");

const savenewFund = async (email, tx_ref, payment_type, bank_name, amount, account_expiration, status, transfer_account, transa_date, transaction_id) => {
  try {
    console.log(transa_date, 'jjjjj');

     console.log(time());
    // Handle 'none' date cases by setting default dates using the time function.
    if (transa_date === 'none') {
      transa_date = await time();
      console.log("No transaction date provided, using default time:");
      console.log( await transa_date, 'gggggg');
    }

    if (account_expiration === 'none') {
      account_expiration = await time();
    }

    console.log("Transaction Date:", transa_date);
    console.log("Account Expiration Date:", account_expiration);

    // Create a new fund document with the provided data.
    const newFund = new fundSchema({
      email,
      tx_ref,
      payment_type,
      bank_name,
      amount,
      account_expiration_show: account_expiration,
      account_expiration,
      time_created: transa_date,
      status,
      transfer_account,
      transaction_id,
    });

    // Save the fund document to the database.
    await newFund.save();

    console.log("Fund successfully saved.");
    return newFund;

  } catch (error) {
    console.error("Error saving the new fund:", error);
    throw error; // Re-throw the error to be handled by the calling function.
  }
};



module.exports = savenewFund;