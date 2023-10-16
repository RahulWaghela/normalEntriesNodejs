const mongoose=require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.DB,{
      useNewUrlParser: true,
      useUnifiedTopology: true
}).then((err)=>{
      if(err) err
      console.log("Connected succesfully with atlas..");
});
