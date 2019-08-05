'use strict';
const webpack = require('webpack');
const serverRender = require('rax-server-renderer');
const babelMerge = require('babel-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const UniversalDocumentPlugin = require('../../plugins/UniversalDocumentPlugin');
const PWAAppShellPlugin = require('../../plugins/PWAAppShellPlugin');
const babelConfig = require('../babel.config');

const babelConfigWeb = babelMerge.all([{
  plugins: [require.resolve('rax-hot-loader/babel')],
}, babelConfig]);

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const getWebpackBase = require('../getWebpackBase');

module.exports = (context) => {
  const { rootDir, userConfig } = context;
  const { publicPath } = userConfig;

  const config = getWebpackBase(context);

  config.output.filename('web/[name].js');

  config.resolve.alias
    .set('@core/app', 'universal-app-runtime')
    .set('@core/page', 'universal-app-runtime')
    .set('@core/router', 'universal-app-runtime');

  config.module.rule('jsx')
    .test(/\.(js|mjs|jsx)$/)
    .exclude
      .add(/(node_modules|bower_components)/)
      .end()
    .use('babel')
      .loader(require.resolve('babel-loader'))
      .options(babelConfigWeb);

  config.module.rule('tsx')
    .test(/\.tsx?$/)
    .exclude
      .add(/(node_modules|bower_components)/)
      .end()
    .use('babel')
      .loader(require.resolve('babel-loader'))
      .options(babelConfigWeb)
      .end()
    .use('ts')
      .loader(require.resolve('ts-loader'));

  config.module.rule('css')
    .test(/\.css?$/)
    .use('css')
      .loader(require.resolve('stylesheet-loader'));

  config.module.rule('assets')
    .test(/\.(svg|png|webp|jpe?g|gif)$/i)
    .use('source')
      .loader(require.resolve('image-source-loader'));

  if (process.env.ANALYZER) {
    config.plugin('analyze')
      .use(BundleAnalyzerPlugin);
  }

  config.plugin('document')
    .use(UniversalDocumentPlugin, [{
      rootDir,
      publicPath,
      path: 'src/document/index.jsx',
      render: serverRender.renderToString,
    }]);

  config.plugin('PWAAppShell')
    .use(PWAAppShellPlugin, [{
      rootDir,
      path: 'src/shell/index.jsx',
      render: serverRender.renderToString,
    }]);

  config.plugin('minicss')
    .use(MiniCssExtractPlugin, [{
      filename: 'web/[name].css',
      chunkFilename: 'web/[id].css',
    }]);

  config.plugin('noError')
    .use(webpack.NoEmitOnErrorsPlugin);

  return config;
};
