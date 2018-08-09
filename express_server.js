var express = require("express");
var app = express();
var PORT = 8080;
const uuidv4 = require("uuid/v4");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
var cookieParser = require("cookie-parser");
app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
  b2xVn2: { url: "http://www.lighthouselabs.ca" },
  "9sm5xK": { url: "http://www.google.com" }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};
const userStatus = { userLoggedIn: false };

function addIdToDB(id) {
  for (var key in urlDatabase) {
    urlDatabase[key]["userID"] = id;
  }
  return;
}

function generateRandomString() {
  //Imported from the URL below
  //https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
  console.log("random.");
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var length = 6;
  var result = "";
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function headerState() {
  return req.cookies["user_id"] ? req.cookies["user_id"] : undefined;
}

//current user that is logged in
function currentUser(req) {
  return users[req.cookies.user_id];
}

//check if user is logged in
function userLoggedIn(enteredEmail, enteredPassword) {
  for (var id in users) {
    if (
      enteredEmail === users[id].email &&
      enteredPassword === users[id].password
    ) {
      return id;
    }
  }
  return false;
}

app.get("/urls", (req, res) => {
  //console.log(req.headers);
  let templateVars = {
    user: currentUser(req),
    urls: urlDatabase
  };

  if (Object.keys(users).length > 0 && req.cookies["user_id"]) {
    res.render("urls_index", templateVars);
  } else if (Object.keys(users).length === 0 || !req.cookies["user_id"]) {
    console.log("no user.");
    res.redirect("/urls/register");
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
    res.redirect("/");
  } else {
    res.render("urls_login", { user: undefined });
  }
});

//register
app.post("/register", (req, res) => {
  var userValid = false;
  console.log(`post register, users is: `, users);

  if (req.body.email === "" || req.body.password === "") {
    console.log(
      `post register, userRegister should be false, but is actually: `,
      userValid
    );
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
    let id = uuidv4();
    let email = req.body.email;
    let password = req.body.password;

    users[id] = {
      id,
      email,
      password
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
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: currentUser(req),
    shortURL: req.params.id,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});
//delete the url from database
app.post("/urls/:id/delete", (req, res) => {
  let deleteURL = req.params.id;
  delete urlDatabase[deleteURL];
  let templateVars = {
    urls: urlDatabase,
    user: currentUser(req)
  };
  res.render("urls_index", templateVars);
});

//updating the long url
app.post("/urls/:id/update", (req, res) => {
  let updateUrlName = req.params.id;
  let updateUrlValue = req.body.newURL;

  urlDatabase[updateUrlName] = updateUrlValue;

  let templateVars = {
    user: currentUser(req),
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`u/${shortURL}`);
});

//sign in cookie
app.post("/login", (req, res) => {
  let enteredEmail = req.body.login;
  let enteredPassword = req.body.password;
  let id = userLoggedIn(enteredEmail, enteredPassword);
  if (id) {
    res.cookie("user_id", id);
    addIdToDB(id);
    console.log(urlDatabase);
    res.redirect("/urls");
  } else {
    res.status(403);
    res.render("urls_login", { user: undefined });
  }
});

//sign out cookie
app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.render("urls_login", { user: undefined });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
