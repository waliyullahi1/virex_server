const Transaction = require('../model/Transactions'); 
const axios = require('axios')



const handletransaction = (userid, referenceid, amounts, types, recipients, descriptions, statuses, transactionDate, value) =>{
const newTransaction = new Transaction({
  user: userid,
  amount: amounts,
  description: descriptions,
  refid:referenceid,
  recipient:recipients,
  type:types,
  value:value,
  status:statuses,
  transactionDate:transactionDate
});

newTransaction.save()
 


}


module.exports = handletransaction;
