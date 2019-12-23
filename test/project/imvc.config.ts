import path from 'path'
import { Config } from '../../src'
import cf from './config'

let PORT = 33336
const ROOT = __dirname

const config: Config = {
	root: ROOT, // 项目根目录
	port: PORT, // server 端口号
	routes: 'routes', // 服务端路由目录
	layout: 'Layout', // 自定义 Layout
	// bundleAnalyzer: true,
	staticEntry: 'index.html',
	publish: '../publish',
	output: {
		path: path.resolve(ROOT, '../publish/static')
	},
	webpackDevMiddleware: true
}

export default config