const path = require('path');
const NodeExternals = require('webpack-node-externals')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: 'node',
  entry: {
    index: path.resolve(__dirname, 'src/index.ts'),
    png: path.resolve(__dirname, 'pngService/index.ts'),
    components: path.resolve(__dirname, 'src/components/index.ts'),
    syncData: path.resolve(__dirname, 'src/syncData.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  stats: {
    errorDetails: true
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  externals: [NodeExternals()],
  externalsPresets: {
    node: true
  }
}