import { exec } from 'child_process'
import puppeteer from 'puppeteer'
import path from 'path'
import { setTimeOutAsync } from './util'

jest.setTimeout(50000)


describe('scripts', () => {
  let browser: puppeteer.Browser

  beforeAll(async () => {
    browser = await puppeteer.launch()
  })

  afterAll(async () => {
    await browser.close()
  })

  describe('start', () => {
    it('start with config file written with typescript', async (done) => {
      const start = path.resolve(__dirname, '../src/bin/scripts.ts')
      const config = path.resolve(__dirname, './project/imvc.config.ts')
      const cmd = `ts-node ${start} --config ${config}`
      let p = exec(cmd, (err, stdout, stderr) => {
        if (err) {
          console.log(err)
          return
        }
      })
      await setTimeOutAsync(15000)
      let page = await browser.newPage()
      let url = `http://localhost:33336/static_view`
      await page.goto(url)
      await page.waitFor('#static_view')
  
      let content = await page.$eval('#static_view', (e) => e.innerHTML)
      expect(content).toBe('static view content')
      
      await page.close()
      p.kill()
      done()
    })
  })

  it.todo('build')
  
  it.todo('test')
})