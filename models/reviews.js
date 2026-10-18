const mongoose = require("mongoose");

const reviewsSchema=mongoose.Schema({
    rating:{
        type:Number,
        min:1,
        max:5,
    },
    comments:String,
    createdAt: {
        type:Date,
        default: Date.now,
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    }
});

const Reviews=mongoose.model("Reviews",reviewsSchema);
module.exports=Reviews;