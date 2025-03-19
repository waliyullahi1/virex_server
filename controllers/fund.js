const Flutterwave = require('flutterwave-node-v3');
const { logEvent } = require('../middleware/logEvent');

const Fund_wallet_by_transfer = async (req, res)=>{
    
    const flw = new Flutterwave(
        process.env.FLW_PUBLIC_KEY,
        process.env.FLW_SECRET_KEY
    );
    
    const details = {
        tx_ref: 'UNIQUE_TRANSACTION_REFERENCE',
        amount: '1500',
        currency: 'NGN',
        email: 'developers@flutterwavego.com',
        fullname: 'Flutterwave Developers',
        phone_number: '+2349012345678',
    };
    
    try{
        const response = await flw.Charge.bank_transfer(details);
        console.log(response);
        
    }catch (error){
        console.log(error);
    }
   
   
}

const webhook = async (req, res) => {
    const event = req.body;
    console.log(event);
    
    if (event.event === 'charge.completed' && event.data.status === 'successful') {
        console.log('Payment successful:', event.data);
        // Perform actions like updating user balance, sending confirmation
    }

    res.sendStatus(200); // Acknowledge receipt
}



module.exports= {Fund_wallet_by_transfer, webhook} 