const fs = require("fs");

// 读取数据
const usersString = fs.readFileSync('./db/users.json').toString();
const usersArray = JSON.parse(usersString);
console.log(usersArray);

// 写数据
const user3 = {id:3,name:'rose',password:121212}
usersArray.push(user3)
const string = JSON.stringify(usersArray);
fs.writeFileSync('./db/users.json',string);