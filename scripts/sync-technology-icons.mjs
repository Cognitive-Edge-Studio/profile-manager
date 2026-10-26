import * as icons from 'simple-icons'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const all=Object.values(icons)
const mapping={
 'Python':'python','Django':'django','FastAPI':'fastapi','TypeScript':'typescript','Node.js':'nodedotjs','React':'react','Next.js':'nextdotjs',
 'Go (Golang)':'go','Vue.js':'vuedotjs','Angular':'angular','NestJS':'nestjs','Remix':'remix','React Native':'react',
 'PostgreSQL':'postgresql','Supabase':'supabase','MongoDB':'mongodb','Redis':'redis','Elasticsearch':'elasticsearch','TypeORM':'typeorm','Prisma':'prisma',
 'RabbitMQ':'rabbitmq','Kafka':'apachekafka','LangChain':'langchain','LangGraph':'langgraph','Hugging Face':'huggingface',
 'Google Cloud Platform (GCP)':'googlecloud','Terraform':'terraform','Firebase':'firebase','Atlassian Suite':'atlassian',
 'Git':'git','GitHub Actions':'githubactions','GitLab CI':'gitlab','Bamboo':'bamboo','TeamCity':'teamcity','Jenkins':'jenkins',
 'Docker':'docker','Kubernetes':'kubernetes','CSS':'css','SCSS':'sass','Tailwind CSS':'tailwindcss','shadcn/ui':'shadcnui','Ant Design (Antd)':'antdesign','Storybook':'storybook','D3.js':'d3',
}
const outDir=path.join(root,'public/images/technologies')
await fs.mkdir(outDir,{recursive:true})
const manifest={},sources=[]
for(const [name,slug] of Object.entries(mapping)){
 const icon=all.find(icon=>icon.slug===slug)
 if(!icon)throw new Error('Missing icon: '+slug)
 const svg=icon.svg.replace('<svg ',`<svg fill="#${icon.hex}" `)
 await fs.writeFile(path.join(outDir,slug+'.svg'),svg+'\n')
 manifest[name]='/images/technologies/'+slug+'.svg'
 sources.push({name,slug,color:icon.hex,source:icon.source,guidelines:icon.guidelines||null})
}
manifest.AWS='/images/technologies/aws.png'
manifest['Framer Motion']='/images/technologies/motion.svg'
sources.push({name:'AWS',source:'https://aws.amazon.com/',asset:'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png'})
sources.push({name:'Framer Motion',source:'https://motion.dev/',asset:'https://motion.dev/favicon.svg'})
const pkg=JSON.parse(await fs.readFile(path.join(root,'node_modules/simple-icons/package.json'),'utf8'))
await fs.writeFile(path.join(root,'src/content/technology-icons.json'),JSON.stringify(manifest,null,2)+'\n')
await fs.writeFile(path.join(root,'content-reference/technology-icon-sources.json'),JSON.stringify({checkedOn:'2026-10-24',library:'simple-icons',version:pkg.version,icons:sources,unbrandedSymbols:{pgvector:'Database symbol; the upstream pgvector project does not supply a distinct brand mark.',charts:'Chart symbol; a general concept, not a brand.','DAG visualization':'Graph symbol; a general concept, not a brand.'}},null,2)+'\n')
for(const source of Object.values(manifest))await fs.access(path.join(root,'public',source))
console.log(`${Object.keys(manifest).length} technology name mappings saved with source references; three non-brand entries use contextual symbols.`)
