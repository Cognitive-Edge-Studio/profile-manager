import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

// Keep the tool's explanation, method, and empty form readable in initial HTML.
// React takes over the same root when the normal client bundle starts.
const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({ root, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { default: Calculator } = await server.ssrLoadModule('/src/mvp-calculator.tsx')
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/tools/mvp-cost-calculator/'] }, React.createElement(Calculator)))
  let shell = await readFile(resolve(root, 'dist/index.html'), 'utf8')
  const assets = await readdir(resolve(root, 'dist/assets'))
  const calculatorCss = assets.find(name => /^mvp-calculator-.*\.css$/.test(name))
  const articleCss = assets.find(name => /^blog-.*\.css$/.test(name))
  if (!calculatorCss) throw new Error('Calculator CSS not found in the production build.')
  if (!articleCss) throw new Error('Article card CSS not found in the production build.')
  shell = shell.replace(/<title>.*?<\/title>/s, '<title>MVP Cost Calculator | First-Release Budget | Shibly Noman</title>')
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="Plan your first MVP, compare build costs, and add running costs using your own figures. See what’s included and what you still need to check." />')
    .replace('</head>', [articleCss, calculatorCss].map(file => `<link rel="stylesheet" href="/assets/${file}" />`).join('\n') + '\n</head>')
    .replace('<div id="root"></div>', `<div id="root"><main id="main-content">${html}</main></div>`)
  const output = resolve(root, 'dist/tools/mvp-cost-calculator')
  await mkdir(output, { recursive: true })
  await writeFile(resolve(output, 'index.html'), shell)
  console.log('Prerendered /tools/mvp-cost-calculator/ with its own metadata and readable initial content.')
} finally {
  await server.close()
}
