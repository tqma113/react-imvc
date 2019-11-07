/**
 * 获取配置
 */
import path from 'path'
import defaultConfig from './config.defaults'
import { Options, Config } from '..'
import configBabel from './babel'

export { default as defaultConfig } from './config.defaults'
export const babel = configBabel

require('@babel/register')({
  ...configBabel(true),
  extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx']
})

export default function getConfig(options?: Options): Config {
	let config = Object.assign({}, defaultConfig)

	options = options || {}

	let customConfig: Partial<Config> = {}
	switch (typeof options.config) {
		case 'object':
			customConfig = options.config as object
			break
		case 'string':
			let customConfigModule = require(path.resolve(options.config as string))
			customConfig = customConfigModule.default as object || customConfigModule
			break
	}
	Object.assign(config, customConfig)

	return config
}