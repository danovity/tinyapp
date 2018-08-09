var express = require("express");
var app = express();
var PORT = 8080;
const uuidv4 = require("uuid/v4");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
var cookieParser = require("cookie-parser");
app.use(cookieParser());
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
  console.log(result);
  return result;
}

function headerState() {
  return req.cookies["username"] ? req.cookies["username"] : undefined;
}

app.set("view engine", "ejs");

var urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};
const userStatus = { userLoggedIn: false };

app.get("/urls", (req, res) => {
  //console.log(req.headers);
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };

  /*   for (var prop in users) {
    if (users.hasOwnProperty(prop)) {
      console.log(users.hasOwnProperty(prop));
      res.render("urls_index", templateVars);
    } else if (!users.hasOwnProperty(prop)) {
      console.log(users.hasOwnProperty(prop));
      console.log("no user.");
      res.redirect("/urls/register");
    }
  } */
  if (Object.keys(users).length > 0 && req.cookies["user_id"]) {
    res.render("urls_index", templateVars);
  } else if (Object.keys(users).length === 0 || !req.cookies["user_id"]) {
    console.log("no user.");
    res.redirect("/urls/register");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});
//register page
app.get("/register", (req, res) => {
  //if (Object.keys(users).length > 0) {
  //res.redirect("/urls");
  // } else if (Object.keys(users).length === 0) {
  res.render("urls_register");
  //}
});

//login page
app.get("/login", (req, res) => {
  if (userStatus.userLoggedIn === false) {
    console.log(
      `userStatus.userLoggedIn should be false, actual: ${
        userStatus.userLoggedIn
      }`
    );
    res.render("urls_login", { userLoggedIn: userStatus.userLoggedIn });
  } else if (userStatus.userLoggedIn === true) {
    console.log(
      `userStatus.userLoggedIn should be true, actual: ${
        userStatus.userLoggedIn
      }`
    );
    res.render("urls_login", { userLoggedIn: userStatus.userLoggedIn });
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
        console.log(
          `post register, comparison, userRegister should be false, but is actually: `,
          userValid
        );
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
    console.log(
      `post register, userRegister should be true, but is actually: `,
      userValid
    );
    users[id] = {
      id,
      email,
      password
    };
    console.log(users);
    res.cookie("user_id", id);
    res.redirect("/urls");
  } else {
    //userValid === false
    res.redirect("/login");
  }
});
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    urls: urlDatabase,
    users: users
  };
  res.render("urls_show", templateVars);
});

//receiving the url that the user wants to update and go to urls_show
app.get("/urls/:id/edit", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    urls: urlDatabase,
    users: users
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // let longURL = ...
  let longURL = urlDatabase[req.params.shortURL];
  console.log("shortURL", req.params.shortURL);
  console.log(typeof longURL);
  res.redirect(longURL);
});

//delete the url from database
app.post("/urls/:id/delete", (req, res) => {
  let deleteURL = req.params.id;
  delete urlDatabase[deleteURL];
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
    users: users
  };
  res.render("urls_index", templateVars);
});

//updating the long url
app.post("/urls/:id/update", (req, res) => {
  let updateUrlName = req.params.id;
  let updateUrlValue = req.body.newURL;

  urlDatabase[updateUrlName] = updateUrlValue;
  //console.log(req.body.newURL);
  //console.log("res", res);

  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
    users: users
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  console.log("shortURL", shortURL);
  urlDatabase[shortURL] = longURL;
  //console.log(req.body); // debug statement to see POST parameters
  //res.send("Ok"); // Respond with 'Ok' (we will replace this)
  //let templateVars = { urls: urlDatabase };
  res.redirect(`u/${shortURL}`);
  //res.redirect(`urls/`);
});

//sign in cookie
app.post("/login", (req, res) => {
  let email = req.body.login;
  let password = req.body.password;
  if (
    users[req.cookies["user_id"]].email === email &&
    users[req.cookies["user_id"]].password === password
  ) {
    console.log(
      `post login, userStatus.userLoggedIn should be true, but is actually: `,
      userStatus.userLoggedIn
    );
    userStatus.userLoggedIn = true;
    res.redirect("/urls");
  } else if (
    users[req.cookies["user_id"]].email !== email &&
    users[req.cookies["user_id"]].password !== password
  ) {
    console.log(
      `post login, userStatus.userLoggedIn should be false, but is actually: `,
      userStatus.userLoggedIn
    );
    res.render("urls_login", { userLoggedIn: userStatus.userLoggedIn });
  }
});

//sign out cookie
app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  userStatus.userLoggedIn = false;
  res.render("urls_login", { userLoggedIn: userStatus.userLoggedIn });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
