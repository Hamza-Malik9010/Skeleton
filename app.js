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
mongoose.connect( "mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });
// MONGO_URI in the .env for when you are deploying on Heroku , write MONGO_URI directly onto the Heroku dashboard.           

const userSchema = new mongoose.Schema({
    username: String, 
    googleId:String,
    facebookId: String,
  });
  


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





/*    // I HAVE COMMENTED IT BECAUSE IT WILL GIVE AN ERROR UNLESS CLIENT_ID AND CLIENT_SECRET FIELDS ARE SPECIFIED IN THE .env FILE......

//------------------------------------------------------------------------------------Google Strategy-----------------------------------------------------------------------------------------//
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL:"http://localhost:3000/auth/google/callback",
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
    callbackURL: "http://localhost:3000/auth/facebook/callback",
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

*/

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
            res.redirect(""); // whatever route/psge/file you want the user to see after registering.
          }
        });
      }
    });
  });
  app.post("/login", passport.authenticate("local", {
    successRedirect: "/lists",   // whatever route/psge/file you want the user to see after logging in.
    failureRedirect: "/login"   
  }));
  app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) {
        console.error('Logout Error:', err);
        return next(err);
      }
      res.redirect('/login');
    });
  });
// ---------------------------------------------------------------------- write your app here ---------------------------------------------------------------------------//

app.get("/", (req,res) => {
  res.render("starter") 
});






//------------------------------------------------------------------------------------------------------------------------------------------------------------------------//


app.listen(PORT, () => {
console.log(`listening on port ${PORT}`);
});

