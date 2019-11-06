import { exec } from 'child_process'
import puppeteer from 'puppeteer'
import path from 'path'
import { setTimeOutAsync } from './util'

jest.setTimeout(30000)

describe('bin', () => {
  let browser: puppeteer.Browser

  beforeAll(async () => {
    browser = await puppeteer.launch()
  })

  afterAll(async () => {
    await browser.close()
  })
  it('start with config file', async (done) => {
    const start = path.resolve(__dirname, '../src/scripts/start.ts')
    const config = path.resolve(__dirname, './project/imvc.config.ts')
    const cmd = `ts-node ${start} --config ${config}`
    let process = exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log(err)
        done()
        return
      }

      console.log(`stdout: ${stdout}`)
      console.log(`stdout: ${stderr}`)
    })
    await setTimeOutAsync(8000)
    let page = await browser.newPage()
    let url = `http://localhost:3333/static_view`
    await page.goto(url)
    await page.waitFor('#static_view')

    let content = await page.$eval('#static_view', (e) => e.innerHTML)
    expect(content).toBe('static view content')
    
    await page.close()
    process.kill()
    done()
  })

  it.todo('build')
  
  it.todo('test')
})