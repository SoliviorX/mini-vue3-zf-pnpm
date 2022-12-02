const { build } = require("esbuild");
const path = require("path");
const args = require("minimist")(process.argv.slice(2)); // { _: [ 'reactivity' ], f: 'esm' }

// 打包的模块是哪个
const target = args._[0] || "reactivity";
// 打包的格式是什么
const format = args.f || "global";
// 读取模块的 package.json 文件
const pkg = require(path.resolve(
  __dirname,
  `../packages/${target}/package.json`
));
// 输出格式：把 global 改成 iife
const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";
// 输出的路径
const outfile = path.resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);

// 使用esbuild打包
build({
  entryPoints: [path.resolve(__dirname, `../packages/${target}/src/index.ts`)], // 入口
  outfile, // 出口
  bundle: true, // 是否打包到一起
  sourcemap: true, // 是否生成sourcemap文件（.map 结尾）
  format: outputFormat, // 打包的格式
  globalName: pkg.buildOptions?.name, // 打包的全局名称
  platform: format === "cjs" ? "node" : "browser", // 平台
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) {
        console.log("rebuild~~~");
      }
    },
  },
}).then(() => {
  console.log("watching~~~");
});
