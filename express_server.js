var express = require("express");
var cookieSession = require("cookie-session");
const uuidv4 = require("uuid/v4");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

var app = express();
var PORT = 8080;

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(
  cookieSession({
    name: "session",
    signed: false,

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);

var urlDatabase = {
  b2xVn2: { url: "http://www.lighthouselabs.ca", userID: "user2RandomID" },
  "9sm5xK": { url: "http://www.google.com", userID: "userRandomID" }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("123", 10)
  }
};

///////////////////////////////////////////////////////////
////////////////////HELPER FUNCTIONS///////////////////////
///////////////////////////////////////////////////////////

function matchUserIdByEmail(enteredEmail) {
  for (var id in users) {
    if (users[id].email === enteredEmail) {
      return id;
    }
  }
  return;
}
// check if the user owns the shortURL
function matchUserIdByShortURL(user, shortURL) {
  if (urlDatabase[shortURL].userID !== user.id) {
    return false;
  }
  return true;
}

// create custom database for the current user in session
function urlsForUser(sessionUserId) {
  let sessionUserDB = {};

  for (var key in urlDatabase) {
    id = urlDatabase[key]["userID"];
    if (sessionUserId === id) {
      sessionUserDB[key] = urlDatabase[key];
    }
  }
  return sessionUserDB;
}

function generateRandomString() {
  //Imported from the URL below
  //https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var length = 6;
  var result = "";
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

//current user that is logged in
function currentUser(req) {
  return users[req.session.user_id];
}

//at post /login, check if user is logged in
function userLoggedIn(enteredEmail, enteredPassword) {
  for (var id in users) {
    if (enteredEmail === users[id].email) {
      let passwordValid = bcrypt.compareSync(
        enteredPassword,
        users[matchUserIdByEmail(enteredEmail)].password
      );

      if (passwordValid) {
        return id;
      }
    }
  }
  return false;
}

////////////////////////////////////////////////////////
////////////////////Get Requests////////////////////////
////////////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  let templateVars = {
    user: currentUser(req),
    urls: urlsForUser(req.session.user_id)
  };
  if (Object.keys(users).length === 0 || !req.session.user_id) {
    res.send("Please log in or register first");
    res.redirect("/register");
    return;
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (currentUser(req)) {
    res.render("urls_new", { user: currentUser(req) });
  } else {
    res.redirect("/login");
  }
});

//register page
app.get("/register", (req, res) => {
  res.render("urls_register", { user: undefined });
});

//login page
app.get("/login", (req, res) => {
  if (currentUser(req)) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", { user: undefined });
  }
});

// "/" redirect
app.get("/", (req, res) => {
  if (currentUser(req)) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", { user: undefined });
  }
});

//receiving the url that the user wants to update and go to urls_show
app.get("/urls/:id/edit", (req, res) => {
  let templateVars = {
    user: currentUser(req),
    shortURL: req.params.id,
    urls: urlsForUser(req.session.user_id)
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  console.log(urlDatabase);
  console.log(currentUser(req));
  if (currentUser(req)) {
    if (matchUserIdByShortURL(currentUser(req), req.params.id)) {
      let templateVars = {
        user: currentUser(req),
        shortURL: req.params.id,
        urls: urlsForUser(req.session.user_id)
      };
      res.render("urls_show", templateVars);
    } else {
      res.send("You do not own this short URL.");
    }
  } else {
    res.send("Please log in or register first");
  }
});
//sign out cookie
app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

////////////////////////////////////////////////////////
////////////////////Post Requests///////////////////////
////////////////////////////////////////////////////////

//register
app.post("/register", (req, res) => {
  var userValid = false;

  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send("Please fill the forms before submitting.");
    return;
  } else {
    userValid = true;
    for (var id in users) {
      if (users[id].email === req.body.email) {
        userValid = false;
        res.status(400);
        res.send("User already registered.");
        break;
      }
    }
  }
  if (userValid === true) {
    let id = generateRandomString();
    let email = req.body.email;
    let password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);

    users[id] = {
      id,
      email,
      password: hashedPassword
    };
    res.redirect("/login");
  } else {
    //userValid === false
    res.redirect("/login");
  }
});

//delete the url from database
app.post("/urls/:id/delete", (req, res) => {
  let deleteURL = req.params.id;
  if (
    req.session.user_id === urlsForUser(req.session.user_id)[deleteURL].userID
  ) {
    delete urlDatabase[deleteURL];
    res.redirect("/urls");
  }
  res.render("urls_login", { user: undefined });
});

//updating the long url
app.post("/urls/:id/update", (req, res) => {
  let updateUrlName = req.params.id;
  let updateUrlValue = req.body.newURL;

  urlsForUser(req.session.user_id)[updateUrlName].url = updateUrlValue;

  let templateVars = {
    user: currentUser(req),
    urls: urlsForUser(req.session.user_id)
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = { url: longURL, userID: currentUser(req).id };
  res.redirect(`/urls/${shortURL}`);
});

//sign in cookie
app.post("/login", (req, res) => {
  let enteredEmail = req.body.email;
  let enteredPassword = req.body.password;
  let id = userLoggedIn(enteredEmail, enteredPassword);

  if (id) {
    req.session.user_id = id;
    res.redirect("/urls");
  } else {
    res.status(403);
    res.send("Invalid password or username.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
