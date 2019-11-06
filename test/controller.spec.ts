import http from 'http'
import path from 'path'
// import express from 'express'
import puppeteer from 'puppeteer'
import { Config } from '../src'
import start from '../src/start'
import { fetchContent } from './util'
import fetchMock from 'fetch-mock'

jest.setTimeout(20000)

interface Server extends http.Server {
	isTouched?: boolean
}
// interface App extends express.Express {
// 	isTouched?: boolean
// }

process.env.NODE_ENV = 'test'
let PORT = 33334
const ROOT = path.join(__dirname, 'project')
const config: Partial<Config> = {
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
	webpackDevMiddleware: true, // 在内存里编译
	NODE_ENV: 'test'
}
const fetchMockDefaultOption = {
  overwriteRoutes: true,
  fetch: global.fetch,
  fallbackToNetwork: true
}

describe('controller', () => {
  // let app: App
  let server: Server
  let browser: puppeteer.Browser

  beforeAll(async () => {
    await start({ config }).then((result) => {
      // app = result.app
      server = result.server
      return puppeteer.launch({
        // headless: false,
        // slowMo: 250
      })
    }).then((brws) => {
      browser = brws
    })
  })

  afterAll(async () => {
    server.close()
    await browser.close()
  })

  describe('location', () => {
    it.todo('valid')
  })
  
  describe('history', () => {
    it.todo('valid')
  })
  
  describe('context', () => {
    it.todo('valid')
  })

  describe('View', () => {
    it.todo('valid')
  })
  
  describe('Model', () => {
    it.todo('valid')
  })
  
  describe('initialState', () => {
    it.todo('valid')
  })
  
  describe('actions', () => {
    it.todo('valid')
  })

  describe('SSR', () => {
    describe('true', () => {
      it('should render in server side', async () => {
				const page = await browser.newPage()
				const url = `http://localhost:${config.port}/static_view`
				await page.goto(url)
        await page.waitFor('#static_view')
        
				const serverContent = await fetchContent(url)
        expect(serverContent.includes('static view content')).toBeTruthy()

        await page.close()
      })

      it('should render in client side', async () => {
				const page = await browser.newPage()
				const url = `http://localhost:${config.port}/static_view`
				await page.goto(url)
        await page.waitFor('#static_view')
        
				const clientContent = await page.$eval('#static_view', (e) => e.innerHTML)
        expect(clientContent.includes('static view content')).toBeTruthy()

        await page.close()
      })
    })

    describe('false', () => {
      it('should not render in server side', async () => {
				const page = await browser.newPage()
				const url = `http://localhost:${config.port}/static_view_csr`
				await page.goto(url)
        await page.waitFor('#static_view_csr')
        
				const serverContent = await fetchContent(url)
        expect(serverContent.includes('static view content by client side rendering')).toBeFalsy()

        await page.close()
      })

      it('should render in client side', async () => {
				const page = await browser.newPage()
				const url = `http://localhost:${config.port}/static_view_csr`
				await page.goto(url)
        await page.waitFor('#static_view_csr')
        
				const clientContent = await page.$eval('#static_view_csr', (e) => e.innerHTML)
        expect(clientContent.includes('static view content by client side rendering')).toBeTruthy()

        await page.close()
      })
    })
  })

  describe('preload', () => {
    it.todo('valid')
  })
  
  describe('KeepAlive', () => {
    it.todo('valid')
  })
  
  describe('KeepAliveOnPush', () => {
    it.todo('valid')
  })
  
  describe('Loading', () => {
    it('should render Loading Component when `SSR` is false in server side', async () => {
      const page = await browser.newPage()
      const url = `http://localhost:${config.port}/loading`
      await page.goto(url)
      await page.waitFor('#load')
      
      const serverContent = await fetchContent(url)
      expect(serverContent.includes('loading...')).toBeTruthy()

      await page.close()
    })

    it('should render View Component when `SSR` is false in client side', async () => {
				const page = await browser.newPage()
				const url = `http://localhost:${config.port}/loading`
				await page.goto(url)
        await page.waitFor('#load')
        
				const clientContent = await page.$eval('#load', (e) => e.innerHTML)
        expect(clientContent.includes('loading...')).toBeFalsy()
        expect(clientContent.includes('load')).toBeTruthy()

        await page.close()
    })
  })
  
  describe('API', () => {
    it('should use map url to fetch', async () => {
      fetchMock.mock(`/foo`, { foo: 'foo' }, fetchMockDefaultOption)
      fetchMock.mock(`/map/foo`, { foo: 'map/foo' }, fetchMockDefaultOption)

      const page = await browser.newPage()
      const url = `http://localhost:${config.port}/api_map`
      await page.goto(url)
      await page.waitFor('#api')
      
      const serverContent = await fetchContent(url)
      expect(serverContent).toContain('map/foo')

      fetchMock.reset()
      await page.close()
    })

    
    it('should use map url to fetch', async () => {
      fetchMock.mock(`/foo`, { foo: 'foo' }, fetchMockDefaultOption)
      fetchMock.mock(`/map/foo`, { foo: 'map/foo' }, fetchMockDefaultOption)

      const page = await browser.newPage()
      const url = `http://localhost:${config.port}/api`
      await page.goto(url)
      await page.waitFor('#api')
      
      const serverContent = await fetchContent(url)
      expect(serverContent).not.toContain('map/foo')
      expect(serverContent).toContain('foo')

      fetchMock.reset()
      await page.close()
    })
  })
  
  describe('restapi', () => {
    it.todo('valid')
  })
  
  describe('resetScrollOnMount', () => {
    it('should scroll after setting true', async () => {
      const page = await browser.newPage()
      const url = `http://localhost:${config.port}/scroll`
      await page.goto(url)
      await page.waitFor('#scroll')

      const clientContent = await page.$eval('#scroll', (e) => e.innerHTML)
      expect(clientContent.includes('success')).toBeTruthy()
      
      await page.close()
    })

    it('should not scroll after setting false', async () => {
      const page = await browser.newPage()
      const url = `http://localhost:${config.port}/unscroll`
      await page.goto(url)
      await page.waitFor('#unscroll')
      
      const clientContent = await page.$eval('#unscroll', (e) => e.innerHTML)
      expect(clientContent.includes('success')).toBeTruthy()
      
      await page.close()
    })
  })
  
  describe('fetch', () => {
    it.todo('valid')
  })
  
  describe('get', () => {
    it.todo('valid')
  })
  
  describe('post', () => {
    it.todo('valid')
  })
  
  describe('fetchPreload', () => {
    it.todo('valid')
  })
  
  describe('prefetch', () => {
    it.todo('valid')
  })
  
  describe('fetchPreload', () => {
    it.todo('valid')
  })
  
  describe('prependBasename', () => {
    it.todo('valid')
  })
  
  describe('prependPublicPath', () => {
    it.todo('valid')
  })
  
  describe('prependRestapi', () => {
    it.todo('valid')
  })
  
  describe('getCookie', () => {
    it.todo('valid')
  })
  
  describe('redirect', () => {
    it.todo('valid')
  })
  
  describe('reload', () => {
    it.todo('valid')
  })
  
  describe('getCookie', () => {
    it.todo('valid')
  })
  
  describe('setCookie', () => {
    it.todo('valid')
  })
  
  describe('removeCookie', () => {
    it.todo('valid')
  })
  
  describe('cookie', () => {
    it.todo('valid')
  })
  
  describe('refreshView', () => {
    it.todo('valid')
  })
  
  describe('renderView', () => {
    it.todo('valid')
  })
  
  describe('getInitialState', () => {
    it.todo('valid')
  })
  
  describe('getFinalActions', () => {
    it.todo('valid')
  })
  
  describe('cookie', () => {
    it.todo('valid')
  })
  
  describe('shouldComponentWillCreate', () => {
    it.todo('valid')
  })
  
  describe('componentDidFirstMount', () => {
    it.todo('valid')
  })
  
  describe('componentDidMount', () => {
    it.todo('valid')
  })
  
  describe('componentWillUnmount', () => {
    it.todo('valid')
  })
  
  describe('pageWillLeave', () => {
    it.todo('valid')
  })
  
  describe('pageDidBack', () => {
    it.todo('valid')
  })
  
  describe('windowWillUnload', () => {
    it.todo('valid')
  })
  
  describe('stateDidChange', () => {
    it.todo('valid')
  })
  
  describe('stateDidReuse', () => {
    it.todo('valid')
  })
  
  describe('errorDidCatch', () => {
    it.todo('valid')
  })
  
  describe('getComponentFallback', () => {
    it.todo('valid')
  })
  
  describe('getViewFallback', () => {
    it.todo('valid')
  })
  
  describe('saveToCache', () => {
    it.todo('valid')
  })
  
  describe('removeFromCache', () => {
    it.todo('valid')
  })
  
  describe('getAllCache', () => {
    it.todo('valid')
  })
  
  describe('cookie', () => {
    it.todo('valid')
  })
  
  describe('getContainer', () => {
    it.todo('valid')
  })
  
  describe('clearContainer', () => {
    it.todo('valid')
  })
  
  describe('handleInputChange', () => {
    it.todo('valid')
  })
  
  describe('fetchPreload', () => {
    it.todo('valid')
  })
  
  describe('init', () => {
    it.todo('valid')
  })
  
  describe('destory', () => {
    it.todo('valid')
  })
  
  describe('initialize', () => {
    it.todo('valid')
  })
  
  describe('bindStoreWithView', () => {
    it.todo('valid')
  })
  
  describe('restore', () => {
    it.todo('valid')
  })
  
  describe('render', () => {
    it.todo('valid')
  })
})