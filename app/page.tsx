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

// AI SENTIMENT v2 - Swahili + Sheng + Emoji
function analyzeSentimentLocal(text: string){
  const t = text.toLowerCase()
  const posW = ['good','great','excellent','success','launched','completed','thanks','working','progress','improved','development','mzuri','vizuri','poa','fiti','safi','hongera','maendeleo','imekamilika','asante','poa sana','best']
  const negW = ['bad','delay','stalled','failed','corrupt','flagged','protest','missing','scandal','poor','worst','broken','mbaya','mbovu','ufisadi','wizi','imeharibika','imechelewa','imekwama','hongo','hakuna maji','barabara mbaya','shida','lalamika']
  let pos=0, neg=0
  posW.forEach(w=>{ if(t.includes(w)) pos++ })
  negW.forEach(w=>{ if(t.includes(w)) neg++ })
  if(t.includes('😡')||t.includes('🤬')) neg+=2
  if(t.includes('❤️')||t.includes('👏')||t.includes('🎉')) pos+=2
  if(pos===0 && neg===0) return 'neutral'
  return pos>neg?'positive':neg>pos?'negative':'neutral'
}

function getLeaderStats(mentions: Mention[], leader: Leader){
  const first = leader.name.split(' ')[0].toLowerCase()
  const last = leader.name.split(' ').pop()!.toLowerCase()
  const related = mentions.filter(m=>{
    const txt = (m.text+' '+m.author).toLowerCase()
    // ensure sentiment is AI-correct
    const sentiment = m.sentiment || analyzeSentimentLocal(m.text)
    ;(m as any).sentiment = sentiment
    return txt.includes(first) || txt.includes(last) || txt.includes(leader.role.toLowerCase()) || txt.includes(leader.county.toLowerCase().split(' ')[0])
  })
  if(related.length===0) return { score: leader.score, count:0, pos:0, neu:0, neg:0, isLive:false, related:[] }
  const pos = related.filter(m=>m.sentiment==='positive').length
  const neu = related.filter(m=>m.sentiment==='neutral').length
  const neg = related.filter(m=>m.sentiment==='negative').length
  const score = Math.max(15, Math.min(95, Math.round((pos + neu*0.5)/related.length*100)))
  return { score, count: related.length, pos, neu, neg, isLive:true, related }
}

export default function App(){
  const [tab, setTab] = useState<Tab>('Mentions')
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
      // Re-run AI locally to ensure Swahili works even if API didn't
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
      list = list.filter(m=> m.text.toLowerCase().includes(q) || m.author.toLowerCase().includes(q) || m.platform.toLowerCase().includes(q))
    }
    if(selectedLeader){
      const leader = LEADERS_DB.find(l=>l.id===selectedLeader)
      if(leader){
        const q1 = leader.name.split(' ')[0].toLowerCase()
        const q2 = leader.name.split(' ').pop()!.toLowerCase()
        list = list.filter(m=> {
          const txt = m.text.toLowerCase()
          return txt.includes(q1) || txt.includes(q2) || txt.includes(leader.county.toLowerCase())
        })
      }
    }
    return list
  }, [mentions, filter, search, selectedLeader])

  const filteredLeaders = useMemo(()=>{
    if(!leaderSearch.trim()) return LEADERS_DB
    const q = leaderSearch.toLowerCase()
    return LEADERS_DB.filter(l=> l.name.toLowerCase().includes(q) || l.role.toLowerCase().includes(q) || l.county.toLowerCase().includes(q))
  }, [leaderSearch])

  const total = mentions.length
  const positive = mentions.filter(m=>m.sentiment==='positive').length
  const neutral = mentions.filter(m=>m.sentiment==='neutral').length
  const negative = total - positive - neutral

  return (
    <div className="min-h-screen bg-[#F2F5FA] w-full overflow-x-hidden">
      <header className="h-[56px] bg-[#0A1931] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1E5BFF] flex items-center justify-center text-white font-bold text-[13px]">C</div>
          <span className="text-white font-bold text-[16px]">Civic<span className="text-[#3B82F6]">Lens</span></span>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white text-[12px] font-bold">H</div>
      </header>
      <div className="bg-[#0A1931] border-t border-white/10 flex gap-1 px-2 overflow-x-auto scrollbar-none sticky top-[56px] z-40">
        {(['Dashboard','Mentions','Leaders','Reports'] as Tab[]).map(t=>(
          <button key={t} onClick={()=>{setTab(t); setSelectedLeader(null)}} className={`whitespace-nowrap px-4 py-3 text-[13px] font-medium border-b-2 ${tab===t?'text-white border-[#1E5BFF]':'text-white/50 border-transparent'}`}>{t}</button>
        ))}
      </div>
      <main className="px-4 py-4 pb-24 max-w-[480px] mx-auto w-full">

        {tab==='Mentions' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Live Feed • {filteredMentions.length}/{total} shown {loading?'• AI analyzing...':''}</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Mentions</h1>
            <div className="mt-3 relative">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search e.g. "roads", "mbaya", "Barchok"...' className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 pr-10 text-[13px] focus:outline-none focus:border-[#1E5BFF]" />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
              {search && <button onClick={()=>setSearch('')} className="absolute right-8 top-2.5 text-gray-400 text-[12px]">✕</button>}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {['All','News','X','Facebook','Reddit','Bluesky'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold border ${filter===f?'bg-[#0A1931] text-white border-[#0A1931]':'bg-white text-gray-500 border-gray-200'}`}>{f} {f==='All'?`(${mentions.length})`:''}</button>
              ))}
            </div>
            {selectedLeader && (
              <div className="mt-3 bg-[#0A1931] text-white rounded-full px-3 py-1.5 flex justify-between items-center text-[12px]">
                <span>Leader: <b>{LEADERS_DB.find(l=>l.id===selectedLeader)?.name}</b> • {filteredMentions.length} mentions</span>
                <button onClick={()=>setSelectedLeader(null)} className="bg-white/20 rounded-full px-2 py-0.5">✕</button>
              </div>
            )}
            <div className="mt-3 space-y-3">
              {filteredMentions.length===0 && <div className="bg-white rounded-[14px] p-8 text-center text-gray-400 text-[13px]">No results for "{search}"<br/><span className="text-[11px]">Try "roads", "water", "mbaya", "poa"</span></div>}
              {filteredMentions.map(m=>(
                <a key={m.id} href={m.link||'#'} target="_blank" className="block bg-white rounded-[14px] p-4 shadow-sm">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${m.platform.includes('News')?'bg-blue-50 text-[#1E5BFF]':m.platform.includes('X')||m.platform.includes('Bluesky')?'bg-black text-white':'bg-orange-50 text-orange-600'}`}>{m.platform} • {m.author}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-[13px] mt-2 leading-snug">{m.text}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${m.sentiment==='positive'?'bg-green-100 text-green-700':m.sentiment==='negative'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{m.sentiment.toUpperCase()} {m.sentimentScore?`(${m.sentimentScore.toFixed(1)})`:''}</span>
                    <span className="text-[10px] text-gray-400">♥ {m.likes}</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {tab==='Leaders' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Accountability • AI Auto-Score • {filteredLeaders.length} leaders</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Leaders</h1>
            <div className="mt-3 relative">
              <input value={leaderSearch} onChange={e=>setLeaderSearch(e.target.value)} placeholder='Filter: "Governor", "Siongiroi", "Barchok"...' className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 pr-10 text-[13px] focus:outline-none focus:border-[#1E5BFF]" />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="mt-4 space-y-3">
              {filteredLeaders.map(l=>{
                const stats = getLeaderStats(mentions, l)
                return (
                  <div key={l.id} className="bg-white rounded-[14px] p-4 border border-gray-100">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">{l.name[0]}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold flex items-center gap-1">{l.name} {stats.isLive && <span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">LIVE AI</span>}</p>
                        <p className="text-[11px] text-gray-500">{l.role} • {l.county} • {l.party}</p>
                        {stats.isLive? <p className="text-[10px] text-gray-400 mt-0.5">🟢{stats.pos} ⚪{stats.neu} 🔴{stats.neg} • {stats.count} related mentions</p> : <p className="text-[10px] text-gray-400 mt-0.5">No live mentions yet • fallback</p>}
                      </div>
                      <div className="text-right">
                        <div className={`text-[20px] font-extrabold ${stats.score>=70?'text-green-600':stats.score>=50?'text-yellow-600':'text-red-600'}`}>{stats.score}</div>
                        <div className="text-[9px] text-gray-400">{stats.isLive?'AI SCORE':'BASE'}</div>
                      </div>
                    </div>
                    {stats.isLive && (
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-green-500" style={{width:`${stats.count?stats.pos/stats.count*100:0}%`}}/>
                        <div className="h-full bg-gray-300" style={{width:`${stats.count?stats.neu/stats.count*100:0}%`}}/>
                        <div className="h-full bg-red-500" style={{width:`${stats.count?stats.neg/stats.count*100:0}%`}}/>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={()=>{setSelectedLeader(l.id); setTab('Mentions'); setSearch(l.name.split(' ')[0])}} className="flex-1 bg-[#F2F5FA] rounded-full py-2 text-[11px] font-bold">View {stats.count} mentions →</button>
                      <button className="flex-1 bg-[#0A1931] text-white rounded-full py-2 text-[11px] font-bold">Report: {stats.score}/100</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab==='Reports' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Public Conversation Intelligence • {total} live • AI v2</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Reports</h1>
            <div className="mt-4 rounded-[18px] bg-[#1677FF] p-5 text-white">
              <p className="text-[9px] font-bold tracking-[0.2em] opacity-80 uppercase">Intelligence Reporting • AI Swahili/Sheng</p>
              <h2 className="text-[20px] font-bold mt-2">Conversation Reports</h2>
              <p className="text-[12px] mt-2 opacity-90">AI now understands "mbaya", "ufisadi", "poa", "hongera" • {total} mentions</p>
              <button onClick={fetchMentions} className="mt-4 bg-white text-black text-[12px] font-bold px-4 py-2 rounded-full">{refreshing?'↻ AI analyzing...':'↻ Refresh Live AI'}</button>
            </div>
            <div className="mt-3 space-y-3">
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-[#0A1931]"><p className="text-[9px] font-bold text-gray-400">TOTAL MENTIONS</p><p className="text-[28px] font-extrabold mt-1">{total}</p></div>
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-green-500"><p className="text-[9px] font-bold text-gray-400">POSITIVE (AI)</p><p className="text-[24px] font-extrabold text-green-600 mt-1">{positive}</p><div className="mt-2 h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width:`${total?positive/total*100:0}%`}}/></div></div>
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-gray-300"><p className="text-[9px] font-bold text-gray-400">NEUTRAL</p><p className="text-[24px] font-extrabold mt-1">{neutral}</p></div>
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-red-500"><p className="text-[9px] font-bold text-gray-400">NEGATIVE (AI)</p><p className="text-[24px] font-extrabold text-red-600 mt-1">{negative}</p></div>
            </div>
          </>
        )}

        {tab==='Dashboard' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Overview • AI Sentiment v2</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Dashboard</h1>
            <div className="mt-3 relative">
              <input value={search} onChange={e=>{setSearch(e.target.value); setTab('Mentions')}} placeholder='Search mentions live...' className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#0A1931] rounded-[14px] p-4 text-white"><p className="text-[10px] opacity-60">TOTAL</p><p className="text-[28px] font-bold mt-1">{total}</p><p className="text-[10px] opacity-60 mt-1">{positive} pos / {negative} neg</p></div>
              <div className="bg-white rounded-[14px] p-4"><p className="text-[10px] text-gray-400">FILTERED</p><p className="text-[28px] font-bold mt-1">{filteredMentions.length}</p></div>
            </div>
            <div className="mt-4 bg-white rounded-[14px] p-4"><p className="text-[12px] font-bold">Try AI searches:</p><div className="mt-2 flex gap-2 flex-wrap">{['roads','water','mbaya','poa sana','ufisadi','Barchok','audit'].map(k=>(<button key={k} onClick={()=>{setSearch(k); setTab('Mentions')}} className="bg-[#F2F5FA] px-3 py-1 rounded-full text-[11px]">{k}</button>))}</div></div>
          </>
        )}
      </main>
    </div>
  )
}