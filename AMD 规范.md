# 背景 
  其实 AMD，CommonJs 对于任何一个前端程序员来说，都已经是老生常谈了，大家都知道他们的语法，都知道 NodeJS 用的是 CommonJS，浏览器端使用异步加载的 AMD。但是具体的应用场景却不是特别的清楚，没有真正用过或者结合一个场景来学习，也许会一直都停留在他们的语法层面呢。
  
  FBI 中表单使用 UI Schema 来自动生成表单，表单有很多种类型的表单项，比如 input、selector 等等，这种表单项内置在 UI Schema 中，也有一些和业务耦合的表单项，他们是用到的时候才会通过 cdn 加载的。cdn 异步加载，当然是使用 AMD 啦。
  
  其实我实习的时候就已经 FBI 就已经有这个 js 加载器的存在了，但是一直没有去了解，只是大概知道用的是什么规范，代码流程怎么样，没想过深入了解，感觉也不是很复杂。上周五心血来潮决定学习一下代码，发现代码有点看不懂……问了梅老板才发现，自己对于 AMD 这类规范了解还处于那种“自己觉得懂了，其实啥都不懂”的阶段。
 
 这倒是激起了我的学习热情，想起了自己春招的时候在学校里学习，每天都是看到啥都不懂的状态，经常撸起袖子一个知识点就研究个两三天。于是这一次，我也撸起了袖子，好好研究起了这些加载脚本和 AMD 包。
 
 
# 模块规范
  一个 AMD 包的打包规范如下： 
```javascript
// 参数：模块名，依赖列表，模块体
define('index', [ 'node_modules/foo/index', 'node_modules/foo/src/bar' ], function (foo, bar) { 
    console.log(foo, bar);
})
```
  来看看 define 函数的定义： 
```javascript
/**
 *
 * @param id?: string 模块名
 * @param dependencies?: string[] 依赖
 * @param factory: function 工厂方法，为模块初始化要执行的函数或对象。它应该只被执行一次。如果是对象，此对象应该为模块的输出值。
 */
define(id?, dependencies?, factory);
```
  注意 define 函数必须有一个属性 amd，define.amd 为一个对象，它表示这个 define 函数是遵守 AMD 规范的，这算是一个双重保障，确保这个 define 函数确实是用来处理这个 AMD 包的，而不是一个不知道从哪来的野鸡函数。amd 的属性可以随意扩展。
  具体看文献： [AMD 规范](https://github.com/amdjs/amdjs-api/wiki/AMD-(%E4%B8%AD%E6%96%87%E7%89%88))

  按照 AMD 规范打出来的包也差不多，会在经过 webpack 编译的文件外加一层立即执行函数： 
```javascript
!(function(root, factory) {
  // es6 module 规范
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = factory(
        require(void 0),
        require(void 0),
        require(void 0)
      ))
    // AMD 规范, 确认 requireJS 是否存在
    : "function" == typeof define && define.amd
    ? define("oui-editor-string", [
        "vendor/react@15.5.4",
        "card/color@1.1.7",
        "vendor/react-dom@15.5.4"
      ], factory)
    : "object" == typeof exports
    // CommomJS 规范
    : "object" == typeof exports
    : "object" == typeof exports
    ? (exports["oui-editor-string"] = factory(
        require(void 0),
        require(void 0),
        require(void 0)
      ))
    : ((root.$card = root.$card || {}),
      (root.$card["oui-editor-string"] = factory(
        root[void 0],
        root[void 0],
        root[void 0]
      )));
})(this, function(
  __WEBPACK_EXTERNAL_MODULE_0__,
  __WEBPACK_EXTERNAL_MODULE_17__,
  __WEBPACK_EXTERNAL_MODULE_174__
){
// webpack 模块
  return (function(modules){

    function __webpack_require__(moduleId) {
      // ...
    }
    // ...
  })([
    // webpack 模块列表
  ])
});
```
  浏览器拿到这个 AMD 包之后，会在上下文中找 define 函数来处理这个模块，define 文件遵守 AMD 模块规范，但有时候会缺失参数。

 
# 加载脚本
  如果要写一个加载 AMD 的脚本，需要做什么？
  已知 AMD 脚本会包一层来执行 define 函数，所以必须保证上下文有一个行为符合预期的 define 函数。
```javascript
function load(
  url: string
): Promise<{
  cdnSpecs: string[];
  factory: any;
  src: string;
}> {
  return new Promise(resolve => {
    fetch(url).then(res => {
      res.text().then(data => {
        new Function(
          "cb",
          `
        // 定义 define 函数
        function define(name, cdnSpecs, factory){
          if (!cdnSpecs && !factory) {
            factory = name;
            cdnSpecs = [];
          }

          if (typeof name === "object") {
            factory = cdnSpecs;
            cdnSpecs = name;
            name = null;
          }
          // 这里传入回调函数，可以把该模块的依赖、模块主体和加载的 cdn 地址存起来
          cb({
            cdnSpecs,
            factory,
            src: "${url}"
          })   
        };
        // 让 define.amd 不为空
        define.amd = () => {};
        // 这里是 AMD 包，实际上会执行上面定义的 define 函数
        ${data}
      `
        )(resolve);
      });
    });
  });
}
```

@todo： 1. 才想 requireJS 也是差不多这种机制， 再看看，2. 另外要实现缓存机制， 3.打包后怎么用,  4. webpack 包，


