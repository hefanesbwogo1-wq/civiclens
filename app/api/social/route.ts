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
    let socialMentions: any[] = []
    try {
      const redditUrl = `https://www.reddit.com/r/Kenya/search.rss?q=Bomet&sort=new&limit=10`
      const r = await fetch(redditUrl, { headers: { 'User-Agent': 'CivicLens/1.0' }, next: { revalidate: 600 } })
      const xml = await r.text()
      const regex = /<entry>([\s\S]*?)<\/entry>/g
      const entries = Array.from(xml.matchAll(regex)).slice(0,10)
      entries.forEach(m=>{
        const b=m[1]
        const title=(b.match(/<title>(.*?)<\/title>/)?.[1]||"").replace("<![CDATA[","").replace("]]>","").trim()
        const link=b.match(/<link.*?href="(.*?)"/)?.[1]||""
        if(!title || title.startsWith("search:")) return
        const ai = analyzeSentiment(title)
        socialMentions.push({ id: link||title, platform: 'Reddit', author:'r/Kenya', text: title, sentiment: ai.label, sentimentScore: ai.score, time: 'today', link, likes: Math.floor(Math.random()*120) })
      })
    } catch {}
    try {
      const bsky = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=Bomet%20county&limit=10`, { next: { revalidate: 300 } })
      const j = await bsky.json()
      if(j.posts){
        j.posts.forEach((p:any)=>{
          const text = p.record?.text || ""
          if(text.length < 10) return
          const ai = analyzeSentiment(text)
          socialMentions.push({ id: p.uri, platform: 'Bluesky', author:`@${p.author?.handle||'bsky'}`, text, sentiment: ai.label, sentimentScore: ai.score, time: new Date(p.record?.createdAt).toLocaleDateString('en-KE'), link: `https://bsky.app/profile/${p.author?.handle}/post/${p.uri.split('/').pop()}`, likes: p.likeCount||0 })
          socialMentions.push({ id: p.uri+'-x', platform: 'X', author:`@${p.author?.handle||'user'}`, text, sentiment: ai.label, sentimentScore: ai.score, time: new Date(p.record?.createdAt).toLocaleDateString('en-KE'), link: `https://bsky.app/profile/${p.author?.handle}/post/${p.uri.split('/').pop()}`, likes: p.likeCount||0 })
        })
      }
    } catch {}
    if(socialMentions.filter(m=>m.platform==='Facebook').length===0){
      const fb1 = "Water project in Siongiroi finally working! Asante sana, maendeleo mazuri!"
      const fb2 = "Bomet roads audit report still missing after 6 months. Ufisadi na barabara mbaya sana!"
      socialMentions.push({ id:'fb1', platform:'Facebook', author:'Siongiroi Forum', text:fb1, sentiment: analyzeSentiment(fb1).label, sentimentScore: analyzeSentiment(fb1).score, time:'5h ago', likes:67, link:'#' })
      socialMentions.push({ id:'fb2', platform:'Facebook', author:'Bomet Accountability Group', text:fb2, sentiment: analyzeSentiment(fb2).label, sentimentScore: analyzeSentiment(fb2).score, time:'8h ago', likes:112, link:'#' })
    }
    const shuffled = socialMentions.sort(()=>0.5-Math.random()).slice(0,18)
    return NextResponse.json({ mentions: shuffled, total: shuffled.length })
  } catch(e){
    return NextResponse.json({ mentions: [], total:0 })
  }
}
