import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema({

  input: {
    type: String,
    required: true
  },

  output: {
    type: String,
    required: true
  },

  explanation: {
    type: String,
    default: ""
  }

},{ _id:false });



const testCaseSchema = new mongoose.Schema({

  args: {
    type: String,
    required: true
  },

  expected: {
    type: String,
    required: true
  },

  functionName: {
    type: String,
    required: true
  }

},{ _id:false });



const questionSchema = new mongoose.Schema({

  title:{
    type:String,
    required:true
  },

  difficulty:{
    type:String,
    enum:["easy","medium","hard"],
    default:"easy"
  },

  description:{
    type:String,
    required:true
  },

  constraints:{
    type:String,
    default:""
  },

  functionName:{
    type:String,
    required:true
  },

  examples:{
    type:[exampleSchema],
    default:[]
  },

  starterCode:{

    javascript:{
      type:String,
      default:""
    },

    python:{
      type:String,
      default:""
    },

    java:{
      type:String,
      default:""
    },

    cpp:{
      type:String,
      default:""
    }

  },

  testCases:{
    type:[testCaseSchema],
    default:[]
  }

},{
  timestamps:true
});


export default mongoose.model("Question",questionSchema);