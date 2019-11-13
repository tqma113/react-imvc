/**
 * 获取配置
 */
import path from 'path'
import fs from 'fs'
import { transformFileSync } from '@babel/core'
import vm from 'vm'

import defaultConfig from './config.defaults'
import { Options, Config } from '..'
import configBabel from './babel'

export { default as defaultConfig } from './config.defaults'
export const babel = configBabel


export default function getConfig(options?: Options): Config {
	let config = Object.assign({}, defaultConfig)

	options = options || {}

	let customConfig: Partial<Config> | null = null
	switch (typeof options.config) {
		case 'object':
			customConfig = options.config
			break
		case 'string':
			customConfig = requireConfig(path.resolve(options.config))
			break
	}
	Object.assign(config, customConfig)

	return config
}

function requireConfig(filePath: string): any {
	let clearFilePath = filePath.split('.').slice(0, -1).join('.')
	let finalFilePath: string | null = null
	if (fs.existsSync(`${clearFilePath}.js`)) {
		finalFilePath = `${clearFilePath}.js`
	} else if (fs.existsSync(`${clearFilePath}.ts`)) {
		finalFilePath = `${clearFilePath}.ts`
	}
	if (finalFilePath === null) {
		throw new Error(`The config file path: ${filePath} is icorrect`)
	}
	let configFromFile = {}
	let result = transformFileSync(finalFilePath, configBabel(true))

	if (result && result.code) {
		const module = { exports: {} }
		const context = vm.createContext({
			__filename: finalFilePath,
			__dirname: path.dirname(finalFilePath),
			exports: module.exports,
      require: require,
      module: module
		})
		try {
			configFromFile = runCode(result.code, context)
		} catch (e) {
			throw e
		}
	} else {
		throw new Error(`The file: ${filePath} has syntax error`)
	}

	return configFromFile
}

let runCode = (sourceCode: string, context?: any) => {
	if (context) {
		return vm.runInContext(sourceCode, context)
	}
	return vm.runInThisContext(sourceCode)(require)
}