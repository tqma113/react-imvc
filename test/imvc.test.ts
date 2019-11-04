import path from 'path'
import fetch from 'node-fetch'
import http from 'http'
import express from 'express'
import puppeteer from 'puppeteer'
import { Config } from '../src'
import start from '../src/start'

jest.setTimeout(20000)

interface Server extends http.Server {
	isTouched?: boolean
}
interface App extends express.Express {
	isTouched?: boolean
}

process.env.NODE_ENV = 'development'
let PORT = 33334
const ROOT = path.join(__dirname, 'project')
const defaultConfig: Partial<Config> = {
	root: ROOT, // 项目根目录
	port: PORT, // server 端口号
	logger: null, // 不出 log
	devtool: '', // 不出 source-map
	ReactViews: {
		beautify: false, // 不美化
		transformViews: false // 已有转换，无须再做
	},
	routes: 'routes', // 服务端路由目录
	layout: 'Layout.tsx', // 自定义 Layout
	webpackLogger: false, // 关闭 webpack logger
	webpackDevMiddleware: true // 在内存里编译
}

describe('React-IMVC', () => {
	describe('Enable SSR', () => {
		let config = {
			...defaultConfig,
			port: PORT++,
			SSR: true
		}
		
		let app: App
		let server: Server
		let browser: puppeteer.Browser

		beforeAll(async (done) => {
			await start({ config }).then((result) => {
				app = result.app
				server = result.server
				return puppeteer.launch()
			}).then((brws) => {
				browser = brws
			})
			done()
		})

		afterAll(async (done) => {
			server.close()
			await browser.close()
			done()
		})

		describe('static view', () => {
			it(`should render view in server side`, async (done) => {
				let page = await browser.newPage()
				let url = `http://localhost:${config.port}/static_view`
				await page.goto(url)
				await page.waitFor('#static_view')
				let serverContent = await fetchContent(url)
				let clientContent = await page.evaluate(
					() => document.documentElement.outerHTML
				)
				expect(serverContent.includes('static view content')).toBe(
					config.SSR ? true : false
				)
				expect(clientContent.includes('static view content')).toBe(true)
	
				await page.close()
				done()
			}) 
	
			it('should not render view in server side when controller.SSR is false', async (done) => {
				let page = await browser.newPage()
				let url = `http://localhost:${config.port}/static_view_csr`
				await page.goto(url)
				await page.waitFor('#static_view_csr')
				let serverContent = await fetchContent(url)
				let clientContent = await page.evaluate(
					() => document.documentElement.outerHTML
				)
				expect(
					serverContent.includes('static view content by client side rendering')
				).toBe(false)
				expect(
					clientContent.includes('static view content by client side rendering')
				).toBe(true)
				await page.close()
				done()
			})
		})
	
		describe('server side', () => {
			it('should pass server and app instance to every route handler', () => {
				expect(app.isTouched).toBe(true)
				expect(server.isTouched).toBe(true)
			})
	
			it('should support custom server router', async (done) => {
				let url = `http://localhost:${config.port}/my_router`
				let response = await fetch(url)
				let json = await response.json()
				expect(typeof json).toBe('object')
				expect(json.ok).toBe(true)
				done()
			})
	
			it('should support render custom layout', async (done) => {
				let page = await browser.newPage()
				let url = `http://localhost:${config.port}/static_view`
				await page.goto(url)
				await page.waitFor('#static_view')
				let serverContent = await fetchContent(url)
				let __CUSTOM_LAYOUT__ = await page.evaluate(
					() => window.__CUSTOM_LAYOUT__
				)
	
				expect(serverContent.includes('window.__CUSTOM_LAYOUT__')).toBe(true)
				expect(__CUSTOM_LAYOUT__).toBe(true)
				await page.close()
				done()
			})
	
			let responseStatus = config.SSR ? 404 : 200
			it(`should respond ${responseStatus} status code when url is not match`, async (done) => {
				let url = `http://localhost:${config.port}/a_path_which_is_not match`
				let response = await fetch(url)
				expect(response.status).toBe(responseStatus)
				done()
			})
		})
	
		describe('controller', () => {
			it('should have location and context properties in controller instance both server side and client side', async (done) => {
				let url = `http://localhost:${config.port}/basic_state?a=1&b=2`
				let page: any
				let clientController: any
				try {
					page = await browser.newPage()
	
					await page.goto(url)
					await page.waitFor('#basic_state')
		
					clientController = await page.evaluate(() => window.controller)
				} catch (e) {
					throw e
				}
				
	
				if (config.SSR) {
					let serverController = global.controller
	
					let locationKeys = [
						'params',
						'query',
						'pathname',
						'pattern',
						'search',
						'raw'
					]
					locationKeys.forEach(key => {
						expect(JSON.stringify(serverController.location[key])).toEqual(
							JSON.stringify(clientController.location[key])
						)
					})
	
					let contextKeys = ['basename', 'publicPath', 'restapi']
					contextKeys.forEach(key => {
						expect(JSON.stringify(serverController.context[key])).toEqual(
							JSON.stringify(clientController.context[key])
						)
					})
	
					expect(typeof serverController.context.req).toBe('object')
					expect(typeof serverController.context.res).toBe('object')
					expect(serverController.context.isClient).toBe(false)
					expect(serverController.context.isServer).toBe(true)
	
					expect(clientController.context.isClient).toBe(true)
					expect(clientController.context.isServer).toBe(false)
				}
	
				let { location } = clientController
	
				expect(location.pattern).toEqual('/basic_state')
				expect(location.pathname).toEqual('/basic_state')
				expect(location.raw).toEqual('/basic_state?a=1&b=2')
				expect(location.search).toEqual('?a=1&b=2')
				expect(location.query).toEqual({ a: '1', b: '2' })
				expect(location.params).toEqual({})
	
				await page.close()
				done()
			})
		})
	})

	describe('Disable SSR', () => {
		let config = {
			...defaultConfig,
			port: PORT++,
			SSR: false
		}
			
		let app: App
		let server: Server
		let browser: puppeteer.Browser

		beforeAll(async (done) => {
			await start({ config }).then((result) => {
				app = result.app
				server = result.server
				return puppeteer.launch()
			}).then((brws) => {
				browser = brws
			})
			done()
		})

		afterAll(async (done) => {
			server.close()
			await browser.close()
			done()
		})

		describe('static view', () => {
			it(`should not render view in server side`, async (done) => {
				let page = await browser.newPage()
				let url = `http://localhost:${config.port}/static_view`
				await page.goto(url)
				await page.waitFor('#static_view')
				let serverContent = await fetchContent(url)
				let clientContent = await page.evaluate(
					() => document.documentElement.outerHTML
				)
				expect(serverContent.includes('static view content')).toBe(
					config.SSR ? true : false
				)
				expect(clientContent.includes('static view content')).toBe(true)
	
				await page.close()
				done()
			}) 
	
			it('should not render view in server side when controller.SSR is false', async (done) => {
				let page = await browser.newPage()
				let url = `http://localhost:${config.port}/static_view_csr`
				await page.goto(url)
				await page.waitFor('#static_view_csr')
				let serverContent = await fetchContent(url)
				let clientContent = await page.evaluate(
					() => document.documentElement.outerHTML
				)
				expect(
					serverContent.includes('static view content by client side rendering')
				).toBe(false)
				expect(
					clientContent.includes('static view content by client side rendering')
				).toBe(true)
				await page.close()
				done()
			})
		})
	
		describe('server side', () => {
			it('should pass server and app instance to every route handler', () => {
				expect(app.isTouched).toBe(true)
				expect(server.isTouched).toBe(true)
			})
	
			it('should support custom server router', async (done) => {
				let url = `http://localhost:${config.port}/my_router`
				let response = await fetch(url)
				let json = await response.json()
				expect(typeof json).toBe('object')
				expect(json.ok).toBe(true)
				done()
			})
	
			it('should support render custom layout', async (done) => {
				let page = await browser.newPage()
				let url = `http://localhost:${config.port}/static_view`
				await page.goto(url)
				await page.waitFor('#static_view')
				let serverContent = await fetchContent(url)
				let __CUSTOM_LAYOUT__ = await page.evaluate(
					() => window.__CUSTOM_LAYOUT__
				)
	
				expect(serverContent.includes('window.__CUSTOM_LAYOUT__')).toBe(true)
				expect(__CUSTOM_LAYOUT__).toBe(true)
				await page.close()
				done()
			})
	
			let responseStatus = config.SSR ? 404 : 200
			it(`should respond ${responseStatus} status code when url is not match`, async (done) => {
				let url = `http://localhost:${config.port}/a_path_which_is_not match`
				let response = await fetch(url)
				expect(response.status).toBe(responseStatus)
				done()
			})
		})
	
		describe('controller', () => {
			it('should have location and context properties in controller instance both server side and client side', async (done) => {
				let url = `http://localhost:${config.port}/basic_state?a=1&b=2`
				let page: any
				let clientController: any
				try {
					page = await browser.newPage()
	
					await page.goto(url)
					await page.waitFor('#basic_state')
		
					clientController = await page.evaluate(() => window.controller)
				} catch (e) {
					throw e
				}
				
	
				if (config.SSR) {
					let serverController = global.controller
	
					let locationKeys = [
						'params',
						'query',
						'pathname',
						'pattern',
						'search',
						'raw'
					]
					locationKeys.forEach(key => {
						expect(JSON.stringify(serverController.location[key])).toEqual(
							JSON.stringify(clientController.location[key])
						)
					})
	
					let contextKeys = ['basename', 'publicPath', 'restapi']
					contextKeys.forEach(key => {
						expect(JSON.stringify(serverController.context[key])).toEqual(
							JSON.stringify(clientController.context[key])
						)
					})
	
					expect(typeof serverController.context.req).toBe('object')
					expect(typeof serverController.context.res).toBe('object')
					expect(serverController.context.isClient).toBe(false)
					expect(serverController.context.isServer).toBe(true)
	
					expect(clientController.context.isClient).toBe(true)
					expect(clientController.context.isServer).toBe(false)
				}
	
				let { location } = clientController
	
				expect(location.pattern).toEqual('/basic_state')
				expect(location.pathname).toEqual('/basic_state')
				expect(location.raw).toEqual('/basic_state?a=1&b=2')
				expect(location.search).toEqual('?a=1&b=2')
				expect(location.query).toEqual({ a: '1', b: '2' })
				expect(location.params).toEqual({})
	
				await page.close()
				done()
			})
		})
	})
})

async function fetchContent(url: string): Promise<string> {
	let response = await fetch(url)
	let content = await response.text()
	return content
}
