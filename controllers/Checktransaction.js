const axios = require('axios')
const User = require("../model/Users");
const jwt = require("jsonwebtoken");
const handletransaction = require('./transaction')
const { format, parseISO } = require('date-fns')
const Transaction = require('../model/Transactions')
const notices = require('./emailSms')


const transactionTrack = async (traansactionctionId) => {
    const traansactionction = traansactionctionId;

    var requestOptions = {
        method: 'GET',
        redirect: 'follow',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(process.env.AIRTIMEANDDATA_CODE).toString('base64')
        },
    };

    try {
        const response = await fetch("https://isquaredata.com/api/transactions/", requestOptions);
        const result = await response.json();

        const exactlytraction = result.results.find(app => app.reference === traansactionction);
       
        return exactlytraction
    } catch (error) {
       
    }
}


const checktracsaction = async (useremail) => {
 
    const foundUser = await User.findOne({ email:useremail }).exec();
    const email = foundUser.email;
    if (!foundUser) return res.sendStatus(403);

    const transactions = await Transaction.find({ user: email, status: 'pending' }).sort({ arrangedate: -1 });
    const deletetransaction = await Transaction.find({ user: email });
   
    if (deletetransaction.length > 30) {
        // If there are more than 30 transactions, delete the last one
        const lastTransaction = deletetransaction[0];
       
        const dekklete =  await Transaction.deleteOne({ _id: lastTransaction._id });
        
        // Remove the last transaction from the array
        deletetransaction.pop();
    }
    
    for (const element of transactions) {
        
        const transaction = await transactionTrack(element.refid);
        if (!transaction) {
           
            await Transaction.deleteOne({ refid: element.refid });
            continue;
        }
        // check if transaction is success or fail 
        if (transaction.status === 'success') {
           
            const findransaction = await Transaction.findOne({ refid: element.refid })
            findransaction.status = transaction.status


            const newtransaction = findransaction.save()
           


        } else if (transaction.status === 'failed') {

            const findransaction = await Transaction.findOne({ refid: element.refid })
            findransaction.status = transaction.status
            findransaction.amount += foundUser.walletBalance


            findransaction.description = `  ${findransaction.description} ( money has refunded)`

            const newfound = await foundUser.save()
            const newtransaction = await findransaction.save()
         
        }

    }
  
   



}

module.exports = checktracsaction