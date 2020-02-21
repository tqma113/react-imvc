import path from 'path'
import { Config } from '../../src'

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
	webpackDevMiddleware: true,
	webpack: webpackConfig => {
		return {
			...webpackConfig,
			optimization: {
				...webpackConfig.optimization,
				splitChunks: {
					minChunks: 5,
					chunks: 'all',
					cacheGroups: {
						common: {
							test: function (mod, chunks) {
								// 只包含 node_modules 下的模块，和 share, components 目录
								return (
									(mod.context.includes('node_modules')) ||
									/src[\\/]\w+[\\/](share|components)|src[\\/](shared|publicComponent)/.test(
										mod.context
									)
								)
							},
							chunks: 'all', //表示显示块的范围，有三个可选值：initial(初始块)、async(按需加载块)、all(全部块)，默认为all;
							name: 'common', //拆分出来块的名字(Chunk Names)，默认由块名和hash值自动生成；
							priority: -10
						},
						vendors: {
							test(module) {
								return /@ant-design|antd/.test(module.context);
							}  ,
							name: 'vendors',
							priority: 1
						}
					}
				}
			}
		}
	}
}

export default config