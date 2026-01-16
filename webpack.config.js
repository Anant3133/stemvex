require("dotenv").config();
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

const isEnvProduction = process.env.NODE_ENV === "production";

const uiPath = path.resolve(__dirname, "./src/ui");
const sandboxPath = path.resolve(__dirname, "./src/sandbox");
const enginesPath = path.resolve(__dirname, "./src/engines");

module.exports = {
  mode: isEnvProduction ? "production" : "development",
  devtool: "source-map",
  entry: {
    index: "./src/ui/index.tsx",
        code: "./src/sandbox/code.ts"
  },
  experiments: {
        outputModule: true
  },
  output: {
    pathinfo: !isEnvProduction,
    path: path.resolve(__dirname, "dist"),
    module: true,
        filename: "[name].js"
  },
  externalsType: "module",
  externalsPresets: { web: true },
  externals: {
    "add-on-sdk-document-sandbox": "add-on-sdk-document-sandbox",
        "express-document-sdk": "express-document-sdk"
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      scriptLoading: "module",
            excludeChunks: ["code"]
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "src/*.json", to: "[name][ext]" }],
    }),
    // Build-time env injection for the UI runtime (do NOT commit secrets).
    // These become global constants used by MathOcrClient (no process.env dependency in browser TS).
    new webpack.DefinePlugin({
      __STEMVEX_MATH_OCR_API_KEY__: JSON.stringify(
        process.env.MATH_OCR_API_KEY || ""
      ),
      __STEMVEX_MATH_OCR_ENDPOINT__: JSON.stringify(
        process.env.MATH_OCR_ENDPOINT || ""
      ),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
                            configFile: path.resolve(uiPath, "tsconfig.json")
                        }
                    }
        ],
        include: [uiPath, enginesPath],
                exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
                            configFile: path.resolve(sandboxPath, "tsconfig.json")
                        }
                    }
        ],
        include: sandboxPath,
                exclude: /node_modules/
      },
      {
        test: /\.css$/,
                use: ["style-loader", "css-loader", "postcss-loader"]
            }
        ]
  },
  resolve: {
        extensions: [".tsx", ".ts", ".js", ".css"]
    }
};
