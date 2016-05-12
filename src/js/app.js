"use strict";
var $ = window.jQuery = require("jquery");
var replaceStr = require("cdp-task-package-manager");
require("bootstrap");


$("button").click(function(){
/* eslint-disable no-console */
  console.log(replaceStr.replaceStr("1234567"));
/* eslint-enable no-console */
});