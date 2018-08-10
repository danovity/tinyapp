var express = require("express");
var app = express();
var PORT = 8080;
const uuidv4 = require("uuid/v4");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

const bcrypt = require("bcrypt");

var cookieSession = require("cookie-session");

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

function matchUserIdByEmail(enteredEmail) {
  for (var id in users) {
    if (users[id].email === enteredEmail) {
      return id;
    }
  }
  return;
}
function urlsForUser(newId) {
  let newUrl = {};

  for (var key in urlDatabase) {
    id = urlDatabase[key]["userID"];
    if (newId === id) {
      newUrl[key] = urlDatabase[key];
    }
  }
  return newUrl;
}

function addIdToDB(id, req) {
  for (var key in urlsForUser(req.session.user_id)) {
    urlsForUser(req.session.user_id)[key]["userID"] = id;
  }
  return;
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

//check if user is logged in
function userLoggedIn(enteredEmail, enteredPassword) {
  for (var id in users) {
    if (enteredEmail === users[id].email) {
      let passwordValid = bcrypt.compareSync(
        enteredPassword,
        users[matchUserIdByEmail(enteredEmail)].password
      ); // returns true

      if (passwordValid) {
        return id;
      }
    }
  }
  return false;
}

app.get("/urls", (req, res) => {
  let templateVars = {
    user: currentUser(req),
    urls: urlsForUser(req.session.user_id)
  };
  if (Object.keys(users).length > 0 && req.session.user_id) {
    res.render("urls_index", templateVars);
  } else if (Object.keys(users).length === 0 || !req.session.user_id) {
    res.send("Please log in or register first");
    res.redirect("/register");
  }
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

//register
app.post("/register", (req, res) => {
  var userValid = false;

  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.render("urls_register");
    return; // return is to end function
  } else {
    userValid = true;
    for (var id in users) {
      if (users[id].email === req.body.email) {
        userValid = false;
        break; //stops the for loop, if the user email is already registered
        // break, bc for loop
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
  let templateVars = {
    user: currentUser(req),
    shortURL: req.params.id,
    urls: urlsForUser(req.session.user_id)
  };
  res.render("urls_show", templateVars);
});

//delete the url from database
app.post("/urls/:id/delete", (req, res) => {
  let deleteURL = req.params.id;
  if (
    req.session.user_id === urlsForUser(req.session.user_id)[deleteURL].userID
  ) {
    delete urlDatabase[deleteURL];
    let templateVars = {
      urls: urlsForUser(req.session.user_id),
      user: currentUser(req)
    };
    res.render("urls_index", templateVars);
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

  res.redirect(`/urls`);
});

//sign in cookie
app.post("/login", (req, res) => {
  let enteredEmail = req.body.login;
  let enteredPassword = req.body.password;

  let id = userLoggedIn(enteredEmail, enteredPassword);

  if (id) {
    req.session.user_id = id;
    addIdToDB(id, req);
    res.redirect("/urls");
  } else {
    res.status(403);
    res.render("urls_login", { user: undefined });
  }
});

//sign out cookie
app.get("/logout", (req, res) => {
  req.session = null;
  res.render("urls_login", { user: undefined });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
