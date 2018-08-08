var express = require("express");
var app = express();
var PORT = 8080;

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

app.get("/urls", (req, res) => {
  //console.log(req.headers);
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id
  };
  res.render("urls_show", templateVars);
});

//receiving the url that the user wants to update and go to urls_show
app.get("/urls/:id/edit", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    urls: urlDatabase
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
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//updating the long url
app.post("/urls/:id/update", (req, res) => {
  let updateUrlName = req.params.id;
  let updateUrlValue = req.body.newURL;

  urlDatabase[updateUrlName] = updateUrlValue;
  //console.log(req.body.newURL);
  //console.log("res", res);

  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
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
  res.cookie("username", req.body.username);
  res.redirect("urls");
});
//sign out cookie
app.get("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
