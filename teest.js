const isThisWeek = require("date-fns/isThisWeek");

let response = "2022-07-30T16:26:49.343Z";

const result = isThisWeek(new Date(response));

console.log(result);
