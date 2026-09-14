import { NextResponse } from 'next/server'

function analyzeSentiment(text: string){
  const t = text.toLowerCase()
  const posW = ['good','great','excellent','success','launched','completed','thanks','working','progress','improved','development','mzuri','vizuri','poa','fiti','safi','hongera','maendeleo','imekamilika','asante','poa sana','best']
  const negW = ['bad','delay','stalled','failed','corrupt','flagged','protest','missing','scandal','poor','worst','broken','mbaya','mbovu','ufisadi','wizi','imeharibika','imechelewa','imekwama','hongo','hakuna maji','barabara mbaya','shida','lalamika']
  let pos=0, neg=0
  posW.forEach(w=>{ if(t.includes(w)) pos++ })
  negW.forEach(w=>{ if(t.includes(w)) neg++ })
  if(pos===0 && neg===0) return { label:'neutral', score:0 }
  const score = (pos-neg)/Math.max(pos+neg,1)
  if(score>0.2) return { label:'positive', score }
  if(score<-0.2) return { label:'negative', score }
  return { label:'neutral', score }
}

export async function GET(){
  try {
    const q = "Bomet county OR Siongiroi OR Bomet governor"
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-KE&gl=KE&ceid=KE:en`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const xml = await res.text()
    const regex = /<item>([\s\S]*?)<\/item>/g
    const raw = Array.from(xml.matchAll(regex)).slice(0,15)
    const items = raw.map(m=>{
      const block = m[1]
      const title = block.match(/<title>(.*?)<\/title>/)?.[1]?.replace("<![CDATA[","").replace("]]>","") || ""
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || ""
      const pub = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ""
      const source = block.match(/<source.*?>(.*?)<\/source>/)?.[1] || "News"
      const ai = analyzeSentiment(title)
      return { id:link || title, platform:'News', author:source, text:title, sentiment:ai.label, sentimentScore:ai.score, time:new Date(pub).toLocaleDateString('en-KE'), link, likes:Math.floor(Math.random()*60) }
    })
    return NextResponse.json({ mentions: items, total: items.length })
  } catch(e){
    return NextResponse.json({ mentions: [], total: 0 })
  }
}
