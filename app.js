import dotenv from 'dotenv';
import express from 'express';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import ejs from 'ejs';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';
import bodyParser from 'body-parser';
import { Strategy as FacebookStrategy } from 'passport-facebook';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;  // Allows you to use an environment variable or default to 3000
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SESSION_SECRET,  // Access the secret from the .env file
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.set("useCreateIndex",true);


const todoSchema = new mongoose.Schema({
    task:String,
})

const listSchema = new mongoose.Schema({
    listTitle: String,
    content: [todoSchema],
});

const userSchema = new mongoose.Schema({
    username: String, // Add this line
    lists: [listSchema],
    googleId:String,
    facebookId: String,
  });
  




/*    const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    //googleId:String,
    lists: [listSchema],
});   */



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user,done){
    done(null,user.id); 
});
passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});


//------------------------------------------------------------------------------------Google Strategy-----------------------------------------------------------------------------------------//

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"https://977b-182-189-1-53.ngrok-free.app/auth/google/callback",
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      console.log(profile);
      // Find the user by googleId
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // User doesn't exist, create a new user
        user = new User({
          googleId: profile.id,
          username: profile.displayName,
          lists: [], // Initialize lists if necessary
        });
        await user.save();
      }
      // If user exists but username is not set, update it
      else if (!user.username) {
        user.username = profile.displayName;
        await user.save();
      }
      return cb(null, user);
    } catch (err) {
      console.error(err);
      return cb(err);
    }
  }));


  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
  );
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/lists');    // render to whatever route/page/file you wanna render to after successfully authenticating
    });
  

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

  
//--------------------------------------------------------------------------------------Facebook Strategy---------------------------------------------------------------------------------//
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID, // You'll set this in your .env file
    clientSecret: process.env.FACEBOOK_APP_SECRET, // You'll set this in your .env file
    callbackURL: "https://977b-182-189-1-53.ngrok-free.app/auth/facebook/callback",
    profileFields: ['id', 'displayName'] // Request the necessary profile fields
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      console.log(profile);
      // Find the user by facebookId
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        // User doesn't exist, create a new user
        user = new User({
          facebookId: profile.id,
          username: profile.displayName,
          lists: [], // Initialize lists if necessary
        });
        await user.save();
      } else if (!user.username) {
        // If user exists but username is not set, update it
        user.username = profile.displayName;
        await user.save();
      }
      return cb(null, user);
    } catch (err) {
      console.error(err);
      return cb(err);
    }
  }
));



// Route to initiate Facebook authentication
app.get('/auth/facebook',
    passport.authenticate('facebook'));
  
  // Callback route for Facebook to redirect to
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect to lists.
      res.redirect('/lists');   // render to whatever route/page/file you wanna render to after successfully authenticating
    });
  
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//



/*  passport.use(new GoogleStrategy({
clientID: process.env.CLIENT_ID,
clientSecret: process.env.CLIENT_SECRET,
callbackURL:"http://localhost:3000/auth/google/callback",
userProfileUrl:"http://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken,refreshToken,profile,cb){
    console.log(profile);
    User.findOrCreate({googleId: profile.id}, function(err,user){
       if(err) return cb(err,user);
         // If the user is new, save their display name
    if (!user.username) {
        user.username = profile.displayName;
        user.save(function(err) {
          return cb(err, user);
        });
      } else {
        return cb(null, user);
      }


    });
}));

*/






// Route to render the starter page

app.get("/", (req,res) => {
    res.render("starter")
});


app.get("/register",(req,res) =>{
    res.render("register");
})

app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/register", function(req, res) {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        req.login(user, function(err) {
          if (err) {
            console.log(err);
            res.redirect("/login"); // you must have a app.get("/login" , ) route to redirect to. 
          } else {
            res.redirect("/lists"); // whatever route/psge/file you want the user to see after registering.
          }
        });
      }
    });
  });
  
  app.post("/login", passport.authenticate("local", {
    successRedirect: "/lists",
    failureRedirect: "/login"   // whatever route/psge/file you want the user to see after registering.
  }));
  




/*

app.post("/register", (req,res) =>{
    User.register({username:req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/lists");
            })
        }
    })
}); 

*/




/*

app.post("/login", (req,res) =>{
const user = new User({
    username:req.body.username,
    password: req.body.password
});
req.login(user, function(err){
    if(err){
        console.log(err);
        return nextTick(err);
    }
    passport.authenticate("local")(req,res, function(){
        res.redirect("/lists");
    })
})
});      

*/


app.get("/lists", async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundUser = await User.findById(req.user.id);  // Use async/await
            if (foundUser) {
                res.render("list", { Lists: foundUser.lists, Name: foundUser.username });
            }
        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect("/login");
    }
});


// Del-list Route
app.post("/del-list", async (req, res) => {
    if (req.isAuthenticated()) {
      const listID = req.body.listID;
  
      try {
        await User.findByIdAndUpdate(req.user.id, { $pull: { lists: { _id: listID } } });
        res.redirect("/lists");
      } catch (err) {
        console.log(err);
        res.redirect("/lists");
      }
    } else {
      res.redirect("/login");
    }
  });



  app.post("/add-list", async (req, res) => {
    if (req.isAuthenticated()) {
      const listName = req.body.listname;
      const newList = {
        listTitle: listName,
        content: [] // Initialize with an empty array of tasks
      };
  
      try {
        await User.findByIdAndUpdate(req.user.id, { $push: { lists: newList } });
        res.redirect("/lists");
      } catch (err) {
        console.log(err);
        res.redirect("/lists");
      }
    } else {
      res.redirect("/login");
    }
  });





// app.js
app.get("/todos/:listID", async (req, res) => {
    if (req.isAuthenticated()) {
      const listID = req.params.listID;
  
      try {
        const foundUser = await User.findById(req.user.id);
        if (foundUser) {
          const foundList = foundUser.lists.id(listID);
          if (foundList) {
            res.render("todo", {
              todos: foundList.content,
              Name: req.user.username,
              listID: listID,
            });
          } else {
            res.redirect("/lists");
          }
        }
      } catch (err) {
        console.log(err);
        res.redirect("/lists");
      }
    } else {
      res.redirect("/login");
    }
  });
  
  

  


// app.js
app.post("/add-todo", async (req, res) => {
    if (req.isAuthenticated()) {
      const listID = req.body.listID;
      const taskText = req.body["task-text"];
  
      try {
        const foundUser = await User.findById(req.user.id);
        if (foundUser) {
          const foundList = foundUser.lists.id(listID);
          if (foundList) {
            foundList.content.push({ task: taskText });
            await foundUser.save();
            res.redirect("/todos/" + listID);
           
          } else {
            res.redirect("/lists");
          }
        }
      } catch (err) {
        console.log(err);
        res.redirect("/lists");
      }
    } else {
      res.redirect("/login");
    }
  });
  






app.post("/del-todo", async (req, res) => {
    if (req.isAuthenticated()) {
      const listID = req.body.listID;
      const todoID = req.body.todo_ID;
  
      try {
        const foundUser = await User.findById(req.user.id);
        if (foundUser) {
          const foundList = foundUser.lists.id(listID);  // Find the specific list
          if (foundList) {
            foundList.content.pull({ _id: todoID });  // Remove the specific task by ID
            await foundUser.save();  // Save the changes
            res.redirect("/todos/" + listID);

          }
        }
      } catch (err) {
        console.log(err);
        res.redirect("/lists");
      }
    } else {
      res.redirect("/login");
    }
  });
  




  app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) {
        console.error('Logout Error:', err);
        return next(err);
      }
      res.redirect('/login');
    });
  });






app.listen(PORT, () => {
console.log(`listening on port ${PORT}`);
});

