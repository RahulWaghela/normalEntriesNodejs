const mongoose = require('mongoose');
require('dotenv').config();
const temSchema = new mongoose.Schema({
    name: String,
    // data: Number,
    phone: Number,
    email: String,
    createdAt: {
      type: Date,
      default: Date.now, // Set the default value to the current date and time
    },
  })

//  queue data starts
  const formDataSchema = new mongoose.Schema({
    clientSelect: {
      type: String,
      required: true,
    },
    // data:{
    //     type:Number
    // },
    sent: {
      type:Number,
    },
    queue: {
      type:Number,
    },
    selectbox: {
      type: String,
      enum: ['default', 'A_airtel', 'M_airtel', 'BSNL'],
      default: 'default',
    },
    pending:{
        type:Number
    },
    createdAt: {
        type: Date,
        default: Date.now, // Set the default value to the current date and time
      },
  });
//  queue data Ends


// simData schema starts
  const telecomSchema = new mongoose.Schema({
    airtel_A: {
      type: Number, // Change to Number
      required: true,
    },
    airtel_M: {
      type: Number, // Change to Number
      required: true,
    },
    BSNL: {
      type: Number, // Change to Number
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
});
// schema data schema ends



// data schedule starts
const dataSchema = new mongoose.Schema({
  client: String,
  operator: String,
  data: Number,
  date: Date
});
// data schedule Ends
  
  const Telecom = mongoose.model('Telecom', telecomSchema);
  const FormData = new mongoose.model('FormData', formDataSchema);
  const allDetailsofUser = new mongoose.model('allDetailsofUser', temSchema);
  const DataSchedul  = new mongoose.model('DataSchedul', dataSchema);


module.exports= {
  allDetailsofUser,
  FormData,
  Telecom,
  DataSchedul 
}

