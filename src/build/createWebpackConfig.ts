import path from 'path'
import resolve from 'resolve'
import TerserPlugin from 'terser-webpack-plugin'
import { WebpackManifestPlugin, FileDescriptor } from 'webpack-manifest-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import SetManifestPlugin from './SetManifestPlugin'
import { getExternals } from './util'
import {
  Configuration,
  RuleSetRule,
  IgnorePlugin,
  DefinePlugin,
  HotModuleReplacementPlugin,
} from 'webpack'
import type { EntireConfig } from '..'

export default function createWebpackConfig(
  options: EntireConfig,
  isServer: boolean = false
): Configuration {
  let result: Configuration = {}

  const config: EntireConfig = Object.assign({}, options)
  const root: string = path.join(config.root, config.src)
  const alias = Object.assign({}, config.alias, {
    '@routes': root,
  })
  const indexEntry = isServer ? root : path.join(__dirname, '../entry/client')
  const NODE_ENV = process.env.NODE_ENV
  const isProd = NODE_ENV === 'production'
  const isDev = NODE_ENV === 'development'
  const mode = NODE_ENV === 'test' ? 'development' : NODE_ENV || 'production'
  const entry = Object.assign({}, config.entry, {
    index: [
      !!config.hot && !isServer && 'webpack-hot-middleware/client',
      indexEntry,
    ].filter(Boolean),
  })
  const devtoolModuleFilenameTemplate = (info: any) =>
    path.relative(root, info.absoluteResourcePath).replace(/\\/g, '/')
  let defaultOutput: Configuration['output'] = {
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: !isProd,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate,
    // Link the env to dom
    globalObject: 'this',
  }

  if (isServer) {
    defaultOutput = {
      ...defaultOutput,
      libraryTarget: 'commonjs2',
      path: path.join(config.root, config.publish),
      filename: config.serverBundleName,
    }
  } else {
    defaultOutput = {
      ...defaultOutput,
      path: path.join(config.root, config.publish, config.static),
      filename: `js/[name].js`,
      chunkFilename: `js/[name].js`,
    }
  }

  let output = Object.assign(defaultOutput, config.output)

  function ManifestPluginMap(file: FileDescriptor): FileDescriptor {
    // 删除 .js 后缀，方便直接使用 obj.name 来访问
    if (file.name && /\.js$/.test(file.name)) {
      file.name = file.name.slice(0, -3)
    }
    return file
  }
  let plugins: Configuration['plugins'] = [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    }),
  ]

  if (!isServer) {
    plugins.push(
      new WebpackManifestPlugin({
        fileName: config.assetsPath,
        map: ManifestPluginMap,
        publicPath: '',
      })
    )
    plugins.push(new SetManifestPlugin())

    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    plugins.push(
      new IgnorePlugin({
        contextRegExp: /^\.\/locale$/,
        resourceRegExp: /moment$/,
      })
    )
  }

  if (config.useTypeCheck) {
    plugins.push(
      new ForkTsCheckerWebpackPlugin({
        async: isDev,
        typescript: {
          typescriptPath: resolve.sync('typescript', {
            basedir: path.resolve(config.root, 'node_modules'),
          }),
          context: config.root,
          diagnosticOptions: {
            syntactic: true,
          },
          mode: 'write-references',
          // profile: true,
        },
        issue: {
          // This one is specifically to match during CI tests,
          // as micromatch doesn't match
          // '../cra-template-typescript/template/src/App.tsx'
          // otherwise.
          include: [
            '../**/src/**/*.{ts,tsx}',
            '**/src/**/*.{ts,tsx}',
          ].map((file) => ({ file })),
          exclude: [
            '**/src/**/__tests__/**',
            '**/src/**/?(*.)(spec|test).*',
            '**/src/setupProxy.*',
            '**/src/setupTests.*',
          ].map((file) => ({ file })),
        },
        logger: {
          infrastructure: 'silent',
        },
      })
    )
  }

  // 添加热更新插件
  if (isDev && !isServer && config.hot) {
    plugins.push(new HotModuleReplacementPlugin())
  }

  if (Array.isArray(config.webpackPlugins)) {
    plugins = plugins.concat(config.webpackPlugins)
  }

  const postLoaders: RuleSetRule[] = []
  let optimization: Configuration['optimization'] = {
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: {
      chunks: 'all',
      name: 'vendor',
    },
  }

  if (isProd) {
    output = Object.assign(
      defaultOutput,
      !isServer && {
        filename: 'js/[name]-[contenthash:6].js',
        chunkFilename: 'js/[name]-[contenthash:6].js',
        devtoolModuleFilenameTemplate,
      },
      config.productionOutput
    )
    if (!isServer) {
      optimization = Object.assign(optimization, {
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              parse: {
                // we want terser to parse ecma 8 code. However, we don't want it
                // to apply any minfication steps that turns valid ecma 5 code
                // into invalid ecma 5 code. This is why the 'compress' and 'output'
                // sections only apply transformations that are ecma 5 safe
                // https://github.com/facebook/create-react-app/pull/4234
                ecma: 2020,
              },
              compress: {
                // ecma: 5, // 默认为5，但目前ts似乎不支持该参数
                drop_console: true,
                // Disabled because of an issue with Uglify breaking seemingly valid code:
                // https://github.com/facebook/create-react-app/issues/2376
                // Pending further investigation:
                // https://github.com/mishoo/UglifyJS2/issues/2011
                comparisons: false,
                // Disabled because of an issue with Terser breaking valid code:
                // https://github.com/facebook/create-react-app/issues/5250
                // Pending futher investigation:
                // https://github.com/terser-js/terser/issues/120
                inline: 2,
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                // Turned on because emoji and regex is not minified properly using default
                // https://github.com/facebook/create-react-app/issues/2488
                ascii_only: true,
              },
            },
            // Use multi-process parallel running to improve the build speed
            // Default number of concurrent runs: os.cpus().length - 1
            parallel: true,
          }),
        ],
      })
    } else {
      optimization = {
        minimize: false,
      }
    }
  }

  if (!isServer && config.bundleAnalyzer) {
    plugins = plugins.concat([
      new BundleAnalyzerPlugin(
        Object.assign(
          {
            // Automatically open analyzer page in default browser
            openAnalyzer: true,
            // Analyzer HTTP-server port
            analyzerPort: 8090,
          },
          config.bundleAnalyzer
        )
      ),
    ])
  }

  const babelOptions: Record<string, any> = {
    // include presets|plugins
    babelrc: false,
    configFile: false,
    cacheDirectory: true,
    ...config.babel(),
    // Save disk space when time isn't as important
    cacheCompression: isProd,
    compact: isProd,
  }
  let moduleRulesConfig: RuleSetRule[] = [
    // Disable require.ensure as it's not a standard language feature.
    { parser: { requireEnsure: false } },
    // Process application JS with Babel.
    // The preset includes JSX, Flow, TypeScript and some ESnext features.
    {
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      options: babelOptions,
    },
  ]
  moduleRulesConfig = moduleRulesConfig.concat(
    config.webpackLoaders,
    postLoaders
  )
  const moduleConfig: Configuration['module'] = {
    // makes missing exports an error instead of warning
    strictExportPresence: true,
    rules: moduleRulesConfig,
  }
  const performanceConfig = {
    hints: false,
    maxEntrypointSize: 400000,
    ...config.performance,
  }
  const resolveConfig = {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.json', '.mjs', '.ts', '.tsx'],
    alias: alias,
  }

  result = Object.assign(result, {
    target: isServer ? 'node' : 'web',
    mode: mode,
    // Don't attempt to continue if there are any errors.
    bail: true,
    devtool: isServer ? 'source-map' : config.devtool,
    entry: entry,
    output: output,
    module: moduleConfig,
    plugins: plugins,
    optimization,
    performance: performanceConfig,
    resolve: resolveConfig,
    context: root,
    externals: isServer ? getExternals(config) : void 0,
  })

  if (!!config.webpack) {
    result = config.webpack(result, isServer)
  }

  return result
}
