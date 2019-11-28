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
import {
	isAbsolutePath,
	getClearFilePath,
	compareObject,
	getKeys
} from '../util'

export { default as defaultConfig } from './config.defaults'
export const getBabelConfig = configBabel

enum Extension {
	JS = 'js',
	TS = 'ts',
	JSX = 'jsx',
	TSX = 'tsx',
	JSON = 'json',
	INVALID = 'invalid'
}

let preOptions: Options = {}
let configCache: EntireConfig = defaultConfig

export default function getConfig(options: Options = {}): EntireConfig {
	const shouldUseCache = compareObject(preOptions, options)
	if (shouldUseCache) {
		return configCache
	}
	let config = constructConfig(options)
	preOptions = options
	configCache = config
	return config
}

function constructConfig(options: Options): EntireConfig {
	let config: Config | null = null
	switch (typeof options.config) {
		case 'object':
				config = options.config
			break
		case 'string':
				config = requireConfig(path.resolve(options.config))
			break
		default:
			throw new Error(`Config in options is incorrect type(string or object).`)
	}
	return Object.assign({}, defaultConfig, config)
}

function requireConfig(filePath: string): EntireConfig {
	const clearFilePath = getClearFilePath(filePath)
	const [finalFilePath, ets] = getFileInfo(clearFilePath)
	if (ets === Extension.INVALID) {
		throw new Error(`The config path: ${filePath} is incorrect`)
	}
	if (ets === Extension.JSON) {
		return require(finalFilePath)
	}
	const babelConfig: TransformOptions = {
		...configBabel(true),
		filenameRelative: finalFilePath
	}
	const result = transformFileSync(finalFilePath, babelConfig)
	if (result && result.code) {
		try {
			return runCode(result.code, createContext(finalFilePath))
		} catch (e) {
			throw e
		}
	} else {
		throw new Error(`The file: ${filePath} has syntax error`)
	}
}

function createContext(filepath: string): vm.Context {
	const dir = path.dirname(filepath)
	const module = { exports: {} }
	const virtualRequire = (filePath: string) => {
		if (!isAbsolutePath(filePath)) {
			return requireConfig(path.resolve(dir, filePath))
		} else {
			return require(filePath)
		}
	}
	return vm.createContext({
		...global,
		__filename: filepath,
		__dirname: dir,
		exports: module.exports,
		require: virtualRequire,
		module: module
	})
}

function getFileInfo(filePath: string): [string, Extension] {
	const clearFilePath = getClearFilePath(filePath)
	let finalFilePath: string = filePath
	let extension: Extension = Extension.INVALID
	getKeys(Extension).some((ets) => {
		if (fs.existsSync(`${clearFilePath}.${ets}`)) {
			finalFilePath = `${clearFilePath}.${ets}`
			extension = Extension[ets]
			return true
		}
		return false
	})
	return [finalFilePath, extension]
}

function runCode(sourceCode: string, context?: vm.Context) {
	if (context) {
		return vm.runInContext(sourceCode, context)
	}
	return vm.runInThisContext(sourceCode)(require)
}