'use client'
import { useState, useEffect, useMemo } from 'react'

type Tab = 'Dashboard' | 'Mentions' | 'Leaders' | 'Reports'
type Mention = { id:any, platform:string, author:string, text:string, sentiment:string, sentimentScore?:number, time:string, likes:number, link?:string }
type Leader = { id:string, name:string, role:string, county:string, score:number, party:string }

const FALLBACK: Mention[] = [
  { id:1, platform:'News', author:'The Star', text:'Bomet roads project flagged over delays - residents demand accountability', sentiment:'negative', time:'2h ago', likes:42 },
  { id:2, platform:'X', author:'@BometWatch', text:'Great to see CivicLens tracking public projects in Siongiroi!', sentiment:'positive', time:'4h ago', likes:18 },
]

const LEADERS_DB: Leader[] = [
  { id:'barchok', name:'Hillary Barchok', role:'Governor', county:'Bomet', score:68, party:'UDA' },
  { id:'linet', name:'Linet Chepkorir Toto', role:'Women Rep', county:'Bomet', score:82, party:'UDA' },
  { id:'sigei', name:'Wakili Sigei', role:'Senator', county:'Bomet', score:71, party:'UDA' },
  { id:'siongiroi-mca', name:'Siongiroi MCA', role:'MCA', county:'Siongiroi', score:59, party:'Independent' },
  { id:'bomet-east-mp', name:'Bomet East MP', role:'MP', county:'Bomet East', score:64, party:'UDA' },
  { id:'chepalungu-mp', name:'Chepalungu MP', role:'MP', county:'Chepalungu', score:77, party:'CCM' },
]

function analyzeSentimentLocal(text: string){
  const t = text.toLowerCase()
  const posW = ['good','great','excellent','success','launched','completed','thanks','working','progress','improved','development','mzuri','vizuri','poa','fiti','safi','hongera','maendeleo','imekamilika','asante','poa sana','best']
  const negW = ['bad','delay','stalled','failed','corrupt','flagged','protest','missing','scandal','poor','worst','broken','mbaya','mbovu','ufisadi','wizi','imeharibika','imechelewa','imekwama','hongo','hakuna maji','barabara mbaya','shida','lalamika']
  let pos=0, neg=0
  posW.forEach(w=>{ if(t.includes(w)) pos++ })
  negW.forEach(w=>{ if(t.includes(w)) neg++ })
  if(pos===0 && neg===0) return 'neutral'
  return pos>neg?'positive':neg>pos?'negative':'neutral'
}

function getLeaderStats(mentions: Mention[], leader: Leader){
  const first = leader.name.split(' ')[0].toLowerCase()
  const last = leader.name.split(' ').pop()!.toLowerCase()
  const related = mentions.filter(m=>{
    const txt = (m.text+' '+m.author).toLowerCase()
    ;(m as any).sentiment = m.sentiment || analyzeSentimentLocal(m.text)
    return txt.includes(first) || txt.includes(last) || txt.includes(leader.role.toLowerCase())
  })
  if(related.length===0) return { score: leader.score, count:0, pos:0, neu:0, neg:0, isLive:false }
  const pos = related.filter(m=>m.sentiment==='positive').length
  const neu = related.filter(m=>m.sentiment==='neutral').length
  const neg = related.filter(m=>m.sentiment==='negative').length
  const score = Math.max(15, Math.min(95, Math.round((pos + neu*0.5)/related.length*100)))
  return { score, count: related.length, pos, neu, neg, isLive:true }
}

function getTrending(mentions: Mention[]){
  const stop = new Set(['the','and','for','with','from','that','this','have','has','will','bomet','siongiroi','county','said','says','about','their','there','been','were','are','was','what','when','where','just','into','over','more','your','they','them','kenya','-','says:'])
  const freq: Record<string, number> = {}
  mentions.forEach(m=>{
    const words = m.text.toLowerCase().replace(/[^a-z ]/g,' ').split(/\s+/)
    words.forEach(w=>{
      if(w.length<4 || stop.has(w)) return
      freq[w] = (freq[w]||0)+1
    })
  })
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([word,count])=>({word,count}))
}

export default function App(){
  const [tab, setTab] = useState<Tab>('Reports')
  const [mentions, setMentions] = useState<Mention[]>(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [leaderSearch, setLeaderSearch] = useState('')
  const [selectedLeader, setSelectedLeader] = useState<string|null>(null)

  const fetchMentions = async () => {
    setRefreshing(true)
    try {
      const [newsRes, socialRes] = await Promise.all([fetch('/api/mentions'), fetch('/api/social')])
      const newsJ = await newsRes.json()
      const socialJ = await socialRes.json()
      let combined = [...(newsJ.mentions||[]),...(socialJ.mentions||[])]
      combined = combined.map((m:any)=>({...m, sentiment: m.sentiment || analyzeSentimentLocal(m.text) }))
      if(combined.length) setMentions(combined)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }
  useEffect(()=>{ fetchMentions() }, [])

  const filteredMentions = useMemo(()=>{
    let list = mentions
    if(filter!=='All') list = list.filter(m=>m.platform.toLowerCase().includes(filter.toLowerCase()))
    if(search.trim()){
      const q = search.toLowerCase()
      list = list.filter(m=> m.text.toLowerCase().includes(q) || m.author.toLowerCase().includes(q))
    }
    if(selectedLeader){
      const leader = LEADERS_DB.find(l=>l.id===selectedLeader)
      if(leader){
        const q1 = leader.name.split(' ')[0].toLowerCase()
        const q2 = leader.name.split(' ').pop()!.toLowerCase()
        list = list.filter(m=> m.text.toLowerCase().includes(q1) || m.text.toLowerCase().includes(q2))
      }
    }
    return list
  }, [mentions, filter, search, selectedLeader])

  const filteredLeaders = useMemo(()=>{
    if(!leaderSearch.trim()) return LEADERS_DB
    const q = leaderSearch.toLowerCase()
    return LEADERS_DB.filter(l=> l.name.toLowerCase().includes(q) || l.role.toLowerCase().includes(q) || l.county.toLowerCase().includes(q))
  }, [leaderSearch])

  const trending = useMemo(()=>getTrending(mentions), [mentions])
  const total = mentions.length
  const positive = mentions.filter(m=>m.sentiment==='positive').length
  const neutral = mentions.filter(m=>m.sentiment==='neutral').length
  const negative = total - positive - neutral

  const exportPDF = () => {
    const date = new Date().toLocaleDateString('en-KE', {dateStyle:'long'})
    const html = `
    <html><head><title>CivicLens Report - ${date}</title>
    <style>body{font-family:Arial;padding:40px;color:#0A1931} h1{color:#0A1931}.badge{padding:4px 8px;border-radius:12px;font-size:11px;color:white}.pos{background:green}.neg{background:red}.neu{background:gray} table{width:100%;border-collapse:collapse;margin-top:12px} td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}.trend{display:inline-block;background:#F2F5FA;padding:4px 10px;border-radius:20px;margin:3px;font-size:12px}</style>
    </head><body>
    <h1>CivicLens — Accountability Report</h1>
    <p><b>Date:</b> ${date} | <b>Location:</b> Siongiroi, Bomet County | <b>Platform:</b> CivicLens Live</p>
    <h2>Summary</h2>
    <p>Total Mentions: <b>${total}</b> • Positive: <b style="color:green">${positive}</b> • Neutral: <b>${neutral}</b> • Negative: <b style="color:red">${negative}</b></p>
    <h2>Trending Keywords (Live)</h2>
    <p>${trending.map(t=>`<span class="trend">${t.word} (${t.count})</span>`).join('')}</p>
    <h2>Leaders AI Scores (Live Auto-Calculated)</h2>
    <table><tr><th>Leader</th><th>Role</th><th>AI Score</th><th>Mentions</th><th>Pos/Neu/Neg</th></tr>
    ${LEADERS_DB.map(l=>{const s=getLeaderStats(mentions,l); return `<tr><td>${l.name}</td><td>${l.role}</td><td><b>${s.score}/100</b> ${s.isLive?'LIVE':''}</td><td>${s.count}</td><td>🟢${s.pos} ⚪${s.neu} 🔴${s.neg}</td></tr>`}).join('')}
    </table>
    <h2>Top Mentions (AI Analyzed)</h2>
    <table><tr><th>Platform</th><th>Text</th><th>Sentiment</th></tr>
    ${mentions.slice(0,20).map(m=>`<tr><td>${m.platform}</td><td>${m.text.slice(0,120)}</td><td><span class="badge ${m.sentiment==='positive'?'pos':m.sentiment==='negative'?'neg':'neu'}">${m.sentiment}</span></td></tr>`).join('')}
    </table>
    <p style="margin-top:30px;font-size:10px;color:gray">Generated by CivicLens — Public Conversation Intelligence • AI Sentiment v2 Swahili/Sheng • Siongiroi, Bomet</p>
    <script>window.print()</script>
    </body></html>`
    const w = window.open('', '_blank')
    if(w){ w.document.write(html); w.document.close() }
  }

  return (
    <div className="min-h-screen bg-[#F2F5FA] w-full overflow-x-hidden">
      <header className="h-[56px] bg-[#0A1931] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1E5BFF] flex items-center justify-center text-white font-bold text-[13px]">C</div>
          <span className="text-white font-bold text-[16px]">Civic<span className="text-[#3B82F6]">Lens</span></span>
        </div>
        <button onClick={exportPDF} className="bg-white text-[#0A1931] text-[11px] font-bold px-3 py-1.5 rounded-full">📄 Export PDF</button>
      </header>
      <div className="bg-[#0A1931] border-t border-white/10 flex gap-1 px-2 overflow-x-auto scrollbar-none sticky top-[56px] z-40">
        {(['Dashboard','Mentions','Leaders','Reports'] as Tab[]).map(t=>(
          <button key={t} onClick={()=>{setTab(t); setSelectedLeader(null)}} className={`whitespace-nowrap px-4 py-3 text-[13px] font-medium border-b-2 ${tab===t?'text-white border-[#1E5BFF]':'text-white/50 border-transparent'}`}>{t}</button>
        ))}
      </div>
      <main className="px-4 py-4 pb-24 max-w-[480px] mx-auto w-full">

        {tab==='Mentions' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Live Feed • {filteredMentions.length}/{total} shown</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Mentions</h1>
            <div className="mt-3 relative">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search e.g. "roads", "mbaya", "Barchok"...' className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 pr-10 text-[13px] focus:outline-none focus:border-[#1E5BFF]" />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {['All','News','X','Facebook','Reddit','Bluesky'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold border ${filter===f?'bg-[#0A1931] text-white border-[#0A1931]':'bg-white text-gray-500 border-gray-200'}`}>{f}</button>
              ))}
            </div>
            {/* Trending quick filters */}
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-gray-400 py-1">Trending:</span>
              {trending.slice(0,6).map(t=>(
                <button key={t.word} onClick={()=>setSearch(t.word)} className="whitespace-nowrap bg-white border border-gray-200 px-2.5 py-1 rounded-full text-[11px]">#{t.word} ({t.count})</button>
              ))}
            </div>
            <div className="mt-3 space-y-3">
              {filteredMentions.map(m=>(
                <div key={m.id} className="bg-white rounded-[14px] p-4 shadow-sm">
                  <div className="flex justify-between text-[10px] text-gray-400"><span className="font-bold">{m.platform} • {m.author}</span><span>{m.time}</span></div>
                  <p className="text-[13px] mt-2">{m.text}</p>
                  <div className="mt-2 flex gap-2"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${m.sentiment==='positive'?'bg-green-100 text-green-700':m.sentiment==='negative'?'bg-red-100 text-red-700':'bg-gray-100'}`}>{m.sentiment}</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==='Leaders' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">AI Auto-Score • {filteredLeaders.length} leaders</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Leaders</h1>
            <div className="mt-3 relative">
              <input value={leaderSearch} onChange={e=>setLeaderSearch(e.target.value)} placeholder='Filter leaders...' className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 text-[13px]" />
            </div>
            <div className="mt-4 space-y-3">
              {filteredLeaders.map(l=>{
                const stats = getLeaderStats(mentions, l)
                return (
                  <div key={l.id} className="bg-white rounded-[14px] p-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">{l.name[0]}</div>
                      <div className="flex-1"><p className="text-[13px] font-bold">{l.name} {stats.isLive&&<span className="text-[8px] bg-green-500 text-white px-1 rounded-full">LIVE AI</span>}</p><p className="text-[11px] text-gray-500">{l.role} • {l.county}</p>{stats.isLive&&<p className="text-[10px] text-gray-400">🟢{stats.pos} ⚪{stats.neu} 🔴{stats.neg}</p>}</div>
                      <div className={`text-[20px] font-extrabold ${stats.score>=70?'text-green-600':stats.score>=50?'text-yellow-600':'text-red-600'}`}>{stats.score}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={()=>{setSelectedLeader(l.id); setTab('Mentions'); setSearch(l.name.split(' ')[0])}} className="flex-1 bg-[#F2F5FA] rounded-full py-2 text-[11px] font-bold">View mentions</button>
                      <button onClick={exportPDF} className="flex-1 bg-[#0A1931] text-white rounded-full py-2 text-[11px] font-bold">PDF: {stats.score}/100</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab==='Reports' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Reports • {total} live • AI + Trending + PDF</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Reports</h1>

            <div className="mt-4 rounded-[18px] bg-[#1677FF] p-5 text-white">
              <p className="text-[9px] font-bold tracking-[0.2em] opacity-80 uppercase">CivicLens Intelligence</p>
              <h2 className="text-[20px] font-bold mt-2">Accountability Report</h2>
              <p className="text-[12px] mt-2 opacity-90">{total} mentions • {positive} pos • {negative} neg • {trending.length} trends detected</p>
              <div className="mt-4 flex gap-2">
                <button onClick={fetchMentions} className="bg-white text-black text-[12px] font-bold px-4 py-2 rounded-full">{refreshing?'↻...':'↻ Refresh Live'}</button>
                <button onClick={exportPDF} className="bg-black text-white text-[12px] font-bold px-4 py-2 rounded-full">📄 Export PDF</button>
              </div>
            </div>

            {/* TRENDING KEYWORDS CLOUD */}
            <div className="mt-4 bg-white rounded-[14px] p-4">
              <p className="text-[11px] font-bold">🔥 Trending Keywords (Live AI)</p>
              <p className="text-[10px] text-gray-400 mt-1">Most talked about topics from {total} mentions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trending.map(t=>{
                  const size = t.count>=3?'text-[14px] font-bold bg-[#0A1931] text-white':'text-[12px] bg-[#F2F5FA]'
                  return <button key={t.word} onClick={()=>{setSearch(t.word); setTab('Mentions')}} className={`${size} px-3 py-1.5 rounded-full border`}>{t.word} <span className="opacity-60">({t.count})</span></button>
                })}
                {trending.length===0 && <span className="text-[12px] text-gray-400">No trends yet — refresh</span>}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="bg-white rounded-[14px] p-3 border-l-4 border-l-green-500"><p className="text-[9px] text-gray-400">POSITIVE</p><p className="text-[20px] font-extrabold text-green-600">{positive}</p></div>
              <div className="bg-white rounded-[14px] p-3 border-l-4 border-l-gray-300"><p className="text-[9px] text-gray-400">NEUTRAL</p><p className="text-[20px] font-extrabold">{neutral}</p></div>
              <div className="bg-white rounded-[14px] p-3 border-l-4 border-l-red-500"><p className="text-[9px] text-gray-400">NEGATIVE</p><p className="text-[20px] font-extrabold text-red-600">{negative}</p></div>
            </div>

            <div className="mt-4 bg-white rounded-[14px] p-4">
              <p className="text-[11px] font-bold">Leaders Performance (AI Auto-Score)</p>
              <div className="mt-3 space-y-2">
                {LEADERS_DB.map(l=>{
                  const s = getLeaderStats(mentions,l)
                  return <div key={l.id} className="flex justify-between text-[12px]"><span>{l.name} <span className="text-[10px] text-gray-400">{l.role}</span></span><span className={`font-bold ${s.score>=70?'text-green-600':s.score>=50?'text-yellow-600':'text-red-600'}`}>{s.score}/100 {s.isLive?'• LIVE':''}</span></div>
                })}
              </div>
              <button onClick={exportPDF} className="w-full mt-4 bg-[#0A1931] text-white rounded-full py-3 text-[12px] font-bold">📄 Export Full PDF Report — Ready for County</button>
            </div>
          </>
        )}

        {tab==='Dashboard' && (
          <>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Dashboard</h1>
            <div className="mt-4 bg-white rounded-[14px] p-4"><p className="text-[11px] font-bold">Trending Now</p><div className="mt-2 flex flex-wrap gap-2">{trending.slice(0,8).map(t=><button key={t.word} onClick={()=>{setSearch(t.word); setTab('Mentions')}} className="bg-[#F2F5FA] px-2 py-1 rounded-full text-[11px]">#{t.word}</button>)}</div></div>
            <div className="mt-3 grid grid-cols-2 gap-3"><div className="bg-[#0A1931] rounded-[14px] p-4 text-white"><p className="text-[10px] opacity-60">TOTAL</p><p className="text-[28px] font-bold">{total}</p></div><div className="bg-white rounded-[14px] p-4"><p className="text-[10px] text-gray-400">TRENDS</p><p className="text-[28px] font-bold">{trending.length}</p></div></div>
            <button onClick={exportPDF} className="w-full mt-4 bg-[#1677FF] text-white rounded-full py-3 text-[12px] font-bold">📄 Export PDF Report</button>
          </>
        )}
      </main>
    </div>
  )
}