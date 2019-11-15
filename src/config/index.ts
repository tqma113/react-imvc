/**
 * 获取配置
 */
import path from 'path'
import fs from 'fs'
import vm from 'vm'
import { TransformOptions, transformFileSync } from '@babel/core'

import defaultConfig from './config.defaults'
import { Options, EntireConfig, Config } from '..'
import configBabel from './babel'
import { isAbsolutePath, getClearFilePath } from '../util'

export { default as defaultConfig } from './config.defaults'
export const babel = configBabel


export default function getConfig(options?: Options): EntireConfig {
	let config = Object.assign({}, defaultConfig)

	options = options || {}

	let customConfig: Config | null = null
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
	let clearFilePath = getClearFilePath(filePath)
	let finalFilePath: string | null = null
  if (fs.existsSync(`${clearFilePath}.js`)) {
		finalFilePath = `${clearFilePath}.js`
	} else if (fs.existsSync(`${clearFilePath}.ts`)) {
		finalFilePath = `${clearFilePath}.ts`
	} else if (fs.existsSync(`${clearFilePath}.jsx`)) {
		finalFilePath = `${clearFilePath}.jsx`
	} else if (fs.existsSync(`${clearFilePath}.tsx`)) {
		finalFilePath = `${clearFilePath}.tsx`
  }
	
	if (finalFilePath !== null) {
		let babelConfig: TransformOptions = {
			...configBabel(true),
			filenameRelative: finalFilePath
		}
		let result = transformFileSync(finalFilePath, babelConfig)
	
		let configFromFile = {}
		if (result && result.code) {
			const finalPath = path.dirname(finalFilePath)
			const module = { exports: {} }
			const virtualRequire = (filePath: string) => {
				if (!isAbsolutePath(filePath)) {
					return requireConfig(path.resolve(finalPath, filePath))
				} else {
					return require(filePath)
				}
			}
			const context = vm.createContext({
				__filename: finalFilePath,
				__dirname: finalPath,
				exports: module.exports,
				require: virtualRequire,
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
	} else {
		if (fs.existsSync(`${clearFilePath}.json`)) {
			finalFilePath = `${clearFilePath}.json`
			return require(finalFilePath)
		} else {
			throw new Error(`The config file path: ${filePath} is icorrect`)
		}
	}

	
}

let runCode = (sourceCode: string, context?: any) => {
	if (context) {
		return vm.runInContext(sourceCode, context)
	}
	return vm.runInThisContext(sourceCode)(require)
}