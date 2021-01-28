//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/tododb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
//!Item
const itemSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemSchema);
const items = [{ name: "Buy Food" }, { name: "Cook Food" }, { name: "Eat Food" }];
//!list of Item
const listSchema = new mongoose.Schema({
  name: String,
  itemList: [itemSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find({}, (err, newitems) => {
    if (!err) {
      if (newitems.length == 0) {
        Item.insertMany(items, (err) => {
          if (err) {
            console.log("Error Insert!");
          }
          res.redirect("/");
        });
      } else {
        res.render("list", { listTitle: day, newListItems: newitems });
      }
    }
  });
});

app.post("/", function (req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();
  const newItem = new Item({
    name: item,
  });
  if (item != "") {
    if (listName === day) {
      newItem.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName }, (err, listFound) => {
        if (!err) {
          listFound.itemList.push(newItem);
          listFound.save();
          res.redirect("/" + listName);
        }
      });
    }
  } else {
    res.redirect("/");
  }
});

app.post("/delete", (req, res) => {
  const checkItem = req.body.deleteItem;
  const listTitle = req.body.list;
  if (checkItem != "") {
    if (listTitle === date.getDate()) {
      Item.findByIdAndDelete(checkItem, (err) => {
        if (err) {
          console.log(err);
        }
      });
      res.redirect("/");
    } else {
      List.findOneAndUpdate({ name: listTitle }, { $pull: { itemList: { _id: checkItem } } }, (err) => {
        if (!err) {
          res.redirect("/" + listTitle);
        }
      });
    }
  }
});

app.get("/:customListItem", (req, res) => {
  const customListItem = _.capitalize(req.params.customListItem);
  const newListItem = new List({
    name: customListItem,
    itemList: items,
  });
  List.findOne({ name: customListItem }, (err, list) => {
    if (!err) {
      if (!list) {
        newListItem.save();
        res.redirect("/" + customListItem);
      } else {
        res.render("list", { listTitle: customListItem, newListItems: list.itemList });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
