const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const carSchema={
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    make:{
        type:String
    },
    model:{
        type:String
    },
    year:{
        type:Number
    },
    type:{
        type:String
    },
    priceperhour:{
        type:Number
    },
    priceperweek:{
        type:Number
    },
    location:{
        type:String,
        default:""
    },
    date:{
        type:Date,
        default:Date.now
    },
    image:{
        type:String,
    }
}
module.exports=mongoose.model('Car',carSchema);