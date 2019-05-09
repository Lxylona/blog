var a = 1;

function foo(str) {
  eval(str);
  console.log(a);
  var a = 3;
}
var str = "var a = 2";
foo(str);