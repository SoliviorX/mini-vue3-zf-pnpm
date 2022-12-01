const path = require(path);
const args = require("minimist")(process.argv.slice(2));

// 打包的模块是哪个
const target = args._[0] || "reactivity";
// 打包的格式
const format = args.f || "global";
