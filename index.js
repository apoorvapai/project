const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

const port = process.env.PORT || 3000;

app.use(express.static('pages'));

app.set('view engine', 'ejs');


const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

mongoose.connect(
  `mongodb+srv://${username}:${password}@cluster0.6wjr9un.mongodb.net/registrationformdb`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    required: true,
  },
  staffNumber: String,
  department: String,
  internalPhone: String,
  issue: String,
  status: {
    type: String,
    default: "yet to be resolved",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Complaint = mongoose.model("Complaint", complaintSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

const registrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
  });

  const adminSchema = new mongoose.Schema({
    name: String,
    password: String,
  });
  
  const Registration = mongoose.model("Registration", registrationSchema);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const admin = mongoose.model("admin", adminSchema);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/index.html");
});

// Registration Route
app.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // Check for existing user
      const existingUser = await Registration.findOne({ email: email });
      if (!existingUser) {
        const registrationData = new Registration({
          name,
          email,
          password,
        });
        await registrationData.save();
        res.redirect("/regsuccess");
      } else {
        console.log("User already exists");
        res.redirect("/error");
      }
    } catch (error) {
    console.log(error);
    res.redirect("/error");
  }
});

// Sign In Route
app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user by email and password
      const user = await Registration.findOne({ email: email, password: password });
      if (user) {
        res.redirect("/dashboard"); // Redirect to dashboard or any other page upon successful login
      } else {
        console.log("Invalid credentials");
        res.redirect("/login-error");
      }
    } catch (error) {
    console.log(error);
    res.redirect("/error");
  }
});

app.post("/adminlogin", async (req, res) => {
    try {
      const { name, password } = req.body;
  
      // Find user by email and password
      const user = await admin.findOne({ name: name, password: password });
      if (user) {
        res.redirect("/admindashboard"); // Redirect to dashboard or any other page upon successful login
      } else {
        console.log("Invalid credentials");
        res.redirect("/login-error");
      }
    } catch (error) {
    console.log(error);
    res.redirect("/error");
  }
});

// Add Complaint Route
app.post("/addcomplaint", async (req, res) => {
  try {
    const { staffNumber, department, internalPhone, issue } = req.body;

    // Generate unique complaint ID
    const complaintId = generateUniqueId();

    // Create new complaint with default status
    const newComplaint = new Complaint({
      complaintId,
      staffNumber,
      department,
      internalPhone,
      issue,
    });

    // Save the complaint to the database
    await newComplaint.save();
    res.redirect("/complaint-success");
  } catch (error) {
    console.log(error);
    res.redirect("/error");
  }
});

// Route for Dashboard
app.get("/dashboard", (req, res) => {
  // You can render a dashboard HTML page or redirect to another route
  res.sendFile(__dirname + "/pages/dashboard.html");
});

app.get("/admindashboard", async (req, res) => {
    try {
      // Fetch all complaints from the database
      const complaints = await Complaint.find();
      // Render the dashboard page with complaints data
      res.render("dashboard", { complaints });
    } catch (error) {
      console.log(error);
      res.redirect("/error");
    }
  });

  app.get("/view-complaints", async (req, res) => {
    try {
      // Fetch all complaints from the database
      const complaints = await Complaint.find();
      // Render the view-complaints page with complaints data
      res.render("view-complaints", { complaints });
    } catch (error) {
      console.log(error);
      res.redirect("/error");
    }
  });

  // Define route for updating complaint status
// Define route for updating complaint status
app.post("/edit-status/:complaintId", async (req, res) => {
    const { complaintId } = req.params;
    const { status } = req.body;
  
    try {
      // Validate if the complaintId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(complaintId)) {
        return res.status(400).send("Invalid complaint ID");
      }
  
      // Find the complaint by ID and update its status
      const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        { status: status },
        { new: true } // Return the updated complaint
      );
  
      if (!updatedComplaint) {
        // If complaint with provided ID is not found
        return res.status(404).send("Complaint not found");
      }
  
      // Redirect back to the dashboard after updating status
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).send("Error updating status");
    }
  });
  
  

app.get("/success", (req, res) => {
  res.sendFile(__dirname + "/pages/success.html");
});

app.get("/regsuccess", (req, res) => {
    res.sendFile(__dirname + "/pages/signin.html");
  });

app.get("/error", (req, res) => {
  res.sendFile(__dirname + "/pages/error.html");
});

app.get("/login-error", (req, res) => {
  res.sendFile(__dirname + "/pages/login-error.html");
});

app.get("/complaint-success", (req, res) => {
  res.sendFile(__dirname + "/pages/complaint-success.html");
});

// Route to serve the login page
app.get("/admin-login", (req, res) => {
    res.sendFile(__dirname + "/pages/admin-login.html");
  });  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Function to generate unique ID for complaint
function generateUniqueId() {
  // Generate a random number between 10000 and 99999
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  // Get current timestamp
  const timestamp = Date.now();
  // Concatenate the timestamp and random number to create a unique numerical ID
  const uniqueId = timestamp.toString() + randomNumber.toString();
  return uniqueId;
}
