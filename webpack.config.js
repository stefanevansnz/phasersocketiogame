
const path = require('path');
const webpack = require('webpack');

let ENVIRONMENT_VARIABLES = {
  ENVIRONMENT: JSON.stringify('development'),
  PORT: JSON.stringify('8082'),
};

module.exports = {
  entry: './server.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'game.bundle.js',
  },
  target: 'node',
  plugins: [
    new webpack.DefinePlugin(ENVIRONMENT_VARIABLES),
  ],
  stats: {warnings:false}  
};
