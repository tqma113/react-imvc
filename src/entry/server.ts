import fs from 'fs'
import path from 'path'
import logger from 'morgan'
import helmet from 'helmet'
import express from 'express'
import favicon from 'serve-favicon'
import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import configBabel from '../config/babel'
import shareRoot from '../middleware/shareRoot'
import * as setupDevEnv from '../build/setup-dev-env'
import type { EntireConfig, Req } from '..'

export default function createExpressApp(
  config: EntireConfig
): express.Express {
  const app: express.Express = express()

  // handle basename
  let list: string[] = Array.isArray(config.basename)
    ? config.basename
    : [config.basename || '']

  list.forEach((basename: string) => {
    app.use(shareRoot(basename))
  })

  // handle helmet
  if (config.helmet) {
    app.use(helmet(config.helmet))
  }

  // handle compression
  if (config.compression) {
    app.use(compression(config.compression))
  }

  // handle favicon
  if (config.favicon) {
    app.use(favicon(config.favicon))
  }

  // handle view engine
  const viewsConfig = {
    ...config.ReactViews,
    babel: {
      ...configBabel,
      extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
    },
  }
  app.engine('js', require('express-react-views').createEngine(viewsConfig))
  app.engine('jsx', require('express-react-views').createEngine(viewsConfig))
  app.engine('ts', require('express-react-views').createEngine(viewsConfig))
  app.engine('tsx', require('express-react-views').createEngine(viewsConfig))

  // view engine setup
  app.set('views', path.join(config.root, config.routes))
  app.set('view engine', 'js') // default view engine ext .js

  // handle logger
  if (config.logger) {
    app.use(logger(config.logger))
  }

  // handle bodyParser
  if (config.bodyParser) {
    if (config.bodyParser.json) {
      app.use(bodyParser.json(config.bodyParser.json))
    }

    if (config.bodyParser.urlencoded) {
      app.use(bodyParser.urlencoded(config.bodyParser.urlencoded))
    }
  }

  // handle cookieParser
  if (config.cookieParser) {
    let { secret = 'imvc', ...options } = config.cookieParser
    app.use(cookieParser(secret, options))
  }

  app.use('/mock', (req, res, next) => {
    let filePath = path.join(config.root, config.src, `${req.path}.json`)
    res.type('application/json')
    fs.createReadStream(filePath).pipe(res)
  })

  app.get('/slbhealthcheck.html', (req, res) => {
    res.send('slbhealthcheck ok')
  })

  if (config.webpackDevMiddleware) {
    // 开发模式用 webpack-dev-middleware 代理 js 文件
    let { compiler, middleware } = setupDevEnv.setupClient(config)
    app.use(middleware)

    // 添加热更新中间件
    if (config.hot) {
      const webpackHotMiddleware = require(`webpack-hot-middleware`)
      app.use(
        webpackHotMiddleware(compiler, {
          log: false,
          quiet: true,
          noInfo: true,
        })
      )
    }

    // 开发模式里，用 src 里的静态资源
    app.use(
      config.staticPath,
      express.static(path.join(config.root, config.src))
    )

    // 开发模式用 webpack-dev-middleware 获取 assets
    app.use((req, res, next) => {
      res.locals.assets = res.locals.webpack.devMiddleware.stats.assets
      next()
    })
  } else {
    // publish 目录启动
    app.use(
      config.staticPath,
      express.static(
        path.join(config.root, config.static),
        config.staticOptions
      )
    )

    // 在根目录启动
    app.use(
      config.staticPath,
      express.static(
        path.join(config.root, config.publish, config.static),
        config.staticOptions
      )
    )

    let assets = readAssets(config)
    app.use((req, res, next) => {
      res.locals.assets = assets
      next()
    })
  }

  // handle publicPath and default props
  app.use((req: Req, res, next) => {
    let basename = req.basename // from shareRoot
    let serverPublicPath = basename + config.staticPath
    let publicPath = config.publicPath || serverPublicPath
    let defaultProps = {
      ...config,
      basename,
      publicPath,
      serverPublicPath,
    }
    Object.assign(res.locals, defaultProps)
    req.serverPublicPath = serverPublicPath
    req.publicPath = publicPath
    next()
  })

  // attach appSettings for client
  app.use((req: Req, res, next) => {
    let { basename, publicPath } = req
    let context = {
      basename,
      publicPath,
      restapi: config.restapi,
      ...config.context,
      preload: {},
    }

    res.locals.appSettings = {
      type: 'createHistory',
      basename,
      context,
      ...config.appSettings,
    }

    next()
  })

  return app
}

function getAssets(stats: Record<string, any>): Record<string, any> {
  return Object.keys(stats).reduce((result, assetName) => {
    let value = stats[assetName]
    result[assetName] = Array.isArray(value) ? value[0] : value
    return result
  }, {} as Record<string, any>)
}

function readAssets(config: EntireConfig): Record<string, any> {
  let result
  // 生产模式直接用编译好的资源表
  let assetsPathList = [
    // 在 publish 目录下启动
    path.join(config.root, config.static, config.assetsPath),
    // 在项目根目录下启动
    path.join(config.root, config.publish, config.static, config.assetsPath),
  ]

  while (assetsPathList.length) {
    try {
      let itemPath = assetsPathList.shift()
      if (itemPath) {
        result = require(itemPath)
      }
    } catch (error) {
      // ignore error
    }
  }

  if (!result) {
    throw new Error('找不到 webpack 资源表 assets.json')
  }

  return getAssets(result)
}
