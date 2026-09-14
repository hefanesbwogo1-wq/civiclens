import { NextResponse } from 'next/server'

export async function GET(){
  try {
    const q = "Bomet county OR Siongiroi OR Bomet governor"
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-KE&gl=KE&ceid=KE:en`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const xml = await res.text()

    // Fixed: /gs -> /g + [\s\S] (TS compatible)
    const regex = /<item>([\s\S]*?)<\/item>/g
    const raw = Array.from(xml.matchAll(regex)).slice(0,15)

    const items = raw.map(m=>{
      const block = m[1]
      const title = block.match(/<title>(.*?)<\/title>/)?.[1]?.replace("<![CDATA[","").replace("]]>","") || ""
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || ""
      const pub = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ""
      const source = block.match(/<source.*?>(.*?)<\/source>/)?.[1] || "News"

      const lower = title.toLowerCase()
      let sentiment: 'positive'|'negative'|'neutral' = 'neutral'
      if(lower.includes("launch")||lower.includes("complete")||lower.includes("praise")||lower.includes("kudos")||lower.includes("success")) sentiment='positive'
      if(lower.includes("delay")||lower.includes("stalled")||lower.includes("corrupt")||lower.includes("flagged")||lower.includes("fail")||lower.includes("protest")) sentiment='negative'

      return { id:link || title, platform:'News', author:source, text:title, sentiment, time:new Date(pub).toLocaleDateString('en-KE'), link, likes:Math.floor(Math.random()*60) }
    })

    return NextResponse.json({ mentions: items, total: items.length })
  } catch(e){
    return NextResponse.json({ mentions: [], total: 0, error: String(e) }, { status: 500 })
  }
}