'use client'
import { useState, useEffect, useMemo } from 'react'

type Tab = 'Dashboard' | 'Mentions' | 'Leaders' | 'Reports'
type Mention = { id:any, platform:string, author:string, text:string, sentiment:string, time:string, likes:number, link?:string }
type Leader = { id:string, name:string, role:string, county:string, score:number, party:string }

// ALL KENYA LEADERS - 47 Governors + National
const LEADERS_DB: Leader[] = [
  { id:'ruto', name:'William Ruto', role:'President', county:'Kenya', score:62, party:'UDA' },
  { id:'kindiki', name:'Kithure Kindiki', role:'Deputy President', county:'Kenya', score:64, party:'UDA' },
  { id:'raila', name:'Raila Odinga', role:'Opposition Leader', county:'Kenya', score:71, party:'ODM' },
  { id:'wetangula', name:'Moses Wetangula', role:'Speaker National Assembly', county:'Kenya', score:58, party:'Ford Kenya' },
  { id:'kingi', name:'Amason Kingi', role:'Speaker Senate', county:'Kenya', score:60, party:'PAA' },
  { id:'sakaja', name:'Johnson Sakaja', role:'Governor', county:'Nairobi', score:61, party:'UDA' },
  { id:'nassir', name:'Abdulswamad Nassir', role:'Governor', county:'Mombasa', score:68, party:'ODM' },
  { id:'achani', name:'Fatuma Achani', role:'Governor', county:'Kwale', score:66, party:'UDA' },
  { id:'mungaro', name:'Gideon Mungaro', role:'Governor', county:'Kilifi', score:59, party:'ODM' },
  { id:'godhana', name:'Dhadho Godhana', role:'Governor', county:'Tana River', score:55, party:'ODM' },
  { id:'timamy', name:'Issa Timamy', role:'Governor', county:'Lamu', score:63, party:'ANC' },
  { id:'mwadime', name:'Andrew Mwadime', role:'Governor', county:'Taita Taveta', score:57, party:'Wiper' },
  { id:'nathif', name:'Nathif Jama', role:'Governor', county:'Garissa', score:60, party:'ODM' },
  { id:'abdullahi-wajir', name:'Ahmed Abdullahi', role:'Governor', county:'Wajir', score:54, party:'ODM' },
  { id:'khalif', name:'Mohamed Adan Khalif', role:'Governor', county:'Mandera', score:52, party:'UDM' },
  { id:'ali-marsabit', name:'Mohamud Ali', role:'Governor', county:'Marsabit', score:56, party:'UDM' },
  { id:'guyo', name:'Abdi Guyo', role:'Governor', county:'Isiolo', score:53, party:'Jubilee' },
  { id:'mwangaza', name:'Kawira Mwangaza', role:'Governor', county:'Meru', score:48, party:'Independent' },
  { id:'njuki', name:'Muthomi Njuki', role:'Governor', county:'Tharaka Nithi', score:67, party:'UDA' },
  { id:'mbarire', name:'Cecily Mbarire', role:'Governor', county:'Embu', score:69, party:'UDA' },
  { id:'malombe', name:'Julius Malombe', role:'Governor', county:'Kitui', score:64, party:'Wiper' },
  { id:'wavinya', name:'Wavinya Ndeti', role:'Governor', county:'Machakos', score:62, party:'Wiper' },
  { id:'mutula', name:'Mutula Kilonzo Jr', role:'Governor', county:'Makueni', score:74, party:'Wiper' },
  { id:'badilisha', name:'Kiarie Badilisha', role:'Governor', county:'Nyandarua', score:58, party:'UDA' },
  { id:'kahiga', name:'Mutahi Kahiga', role:'Governor', county:'Nyeri', score:65, party:'UDA' },
  { id:'waiguru', name:'Anne Waiguru', role:'Governor', county:'Kirinyaga', score:60, party:'UDA' },
  { id:'kangata', name:'Irungu Kangata', role:'Governor', county:'Muranga', score:72, party:'UDA' },
  { id:'wamatangi', name:'Kimani Wamatangi', role:'Governor', county:'Kiambu', score:57, party:'UDA' },
  { id:'lomorukai', name:'Jeremiah Lomorukai', role:'Governor', county:'Turkana', score:55, party:'ODM' },
  { id:'kachapin', name:'Simon Kachapin', role:'Governor', county:'West Pokot', score:61, party:'UDA' },
  { id:'lelelit', name:'Jonathan Lelelit', role:'Governor', county:'Samburu', score:59, party:'UDA' },
  { id:'natembeya', name:'George Natembeya', role:'Governor', county:'Trans Nzoia', score:78, party:'DAP-K' },
  { id:'bii', name:'Jonathan Bii', role:'Governor', county:'Uasin Gishu', score:56, party:'UDA' },
  { id:'rotich', name:'Wisley Rotich', role:'Governor', county:'Elgeyo Marakwet', score:68, party:'UDA' },
  { id:'sang', name:'Stephen Sang', role:'Governor', county:'Nandi', score:70, party:'UDA' },
  { id:'cheboi', name:'Benjamin Cheboi', role:'Governor', county:'Baringo', score:60, party:'UDA' },
  { id:'irungu-laikipia', name:'Joshua Irungu', role:'Governor', county:'Laikipia', score:62, party:'UDA' },
  { id:'kihika', name:'Susan Kihika', role:'Governor', county:'Nakuru', score:59, party:'UDA' },
  { id:'ntutu', name:'Patrick Ole Ntutu', role:'Governor', county:'Narok', score:64, party:'UDA' },
  { id:'lenku', name:'Joseph Ole Lenku', role:'Governor', county:'Kajiado', score:66, party:'ODM' },
  { id:'mutai', name:'Erick Mutai', role:'Governor', county:'Kericho', score:63, party:'UDA' },
  { id:'barchok', name:'Hillary Barchok', role:'Governor', county:'Bomet', score:68, party:'UDA' },
  { id:'barasa', name:'Fernandes Barasa', role:'Governor', county:'Kakamega', score:67, party:'ODM' },
  { id:'ottichilo', name:'Wilber Ottichilo', role:'Governor', county:'Vihiga', score:71, party:'ODM' },
  { id:'lusaka', name:'Kenneth Lusaka', role:'Governor', county:'Bungoma', score:65, party:'Ford Kenya' },
  { id:'otuoma', name:'Paul Otuoma', role:'Governor', county:'Busia', score:62, party:'ODM' },
  { id:'orengo', name:'James Orengo', role:'Governor', county:'Siaya', score:69, party:'ODM' },
  { id:'nyongo', name:'Anyang Nyongo', role:'Governor', county:'Kisumu', score:70, party:'ODM' },
  { id:'wanga', name:'Gladys Wanga', role:'Governor', county:'Homa Bay', score:75, party:'ODM' },
  { id:'ayacko', name:'Ochillo Ayacko', role:'Governor', county:'Migori', score:64, party:'ODM' },
  { id:'arati', name:'Simba Arati', role:'Governor', county:'Kisii', score:73, party:'ODM' },
  { id:'nyaribo', name:'Amos Nyaribo', role:'Governor', county:'Nyamira', score:58, party:'UPA' },
  { id:'sigei', name:'Wakili Sigei', role:'Senator', county:'Bomet', score:71, party:'UDA' },
  { id:'linet', name:'Linet Chepkorir Toto', role:'Women Rep', county:'Bomet', score:82, party:'UDA' },
  { id:'sifuna', name:'Edwin Sifuna', role:'Senator', county:'Nairobi', score:76, party:'ODM' },
  { id:'cherargei', name:'Samson Cherargei', role:'Senator', county:'Nandi', score:54, party:'UDA' },
  { id:'passaris', name:'Esther Passaris', role:'Women Rep', county:'Nairobi', score:65, party:'ODM' },
  { id:'siongiroi-mca', name:'Siongiroi MCA', role:'MCA', county:'Siongiroi', score:59, party:'Independent' },
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
    words.forEach(w=>{ if(w.length<4 || stop.has(w)) return; freq[w] = (freq[w]||0)+1 })
  })
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([word,count])=>({word,count}))
}

export default function App(){
  const [tab, setTab] = useState<Tab>('Reports')
  const [mentions, setMentions] = useState<Mention[]>([
    { id:1, platform:'News', author:'The Star', text:'Bomet roads project flagged over delays - residents demand accountability', sentiment:'negative', time:'2h ago', likes:42 },
    { id:2, platform:'X', author:'@BometWatch', text:'Great to see CivicLens tracking public projects in Siongiroi!', sentiment:'positive', time:'4h ago', likes:18 },
  ])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [leaderSearch, setLeaderSearch] = useState('')
  const [countyFilter, setCountyFilter] = useState('All Counties')
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
    setRefreshing(false)
  }
  useEffect(()=>{ fetchMentions() }, [])

  const filteredMentions = useMemo(()=>{
    let list = mentions
    if(filter!=='All') list = list.filter(m=>m.platform.toLowerCase().includes(filter.toLowerCase()))
    if(search.trim()){ const q=search.toLowerCase(); list=list.filter(m=> m.text.toLowerCase().includes(q) || m.author.toLowerCase().includes(q)) }
    if(selectedLeader){ const leader=LEADERS_DB.find(l=>l.id===selectedLeader); if(leader){ const q1=leader.name.split(' ')[0].toLowerCase(); const q2=leader.name.split(' ').pop()!.toLowerCase(); list=list.filter(m=> m.text.toLowerCase().includes(q1) || m.text.toLowerCase().includes(q2)) } }
    return list
  }, [mentions, filter, search, selectedLeader])

  const filteredLeaders = useMemo(()=>{
    let list = LEADERS_DB
    if(countyFilter!=='All Counties') list = list.filter(l=> l.county===countyFilter || l.county==='Kenya')
    if(leaderSearch.trim()){ const q=leaderSearch.toLowerCase(); list=list.filter(l=> l.name.toLowerCase().includes(q) || l.role.toLowerCase().includes(q) || l.county.toLowerCase().includes(q)) }
    return list
  }, [leaderSearch, countyFilter])

  const trending = useMemo(()=>getTrending(mentions), [mentions])
  const counties = useMemo(()=>['All Counties',...Array.from(new Set(LEADERS_DB.map(l=>l.county))).sort()], [])
  const total = mentions.length
  const positive = mentions.filter(m=>m.sentiment==='positive').length
  const neutral = mentions.filter(m=>m.sentiment==='neutral').length
  const negative = total - positive - neutral

  // WHATSAPP
  const shareWA = (text:string)=> window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank')
  const shareMention = (m:Mention)=> shareWA(`🔍 CivicLens Alert - ${m.platform}\n\n"${m.text}"\n— ${m.author} | ${m.sentiment.toUpperCase()} | ${m.time}\n\nTracked via CivicLens.live\n${m.link||''}`)
  const shareLeader = (l:Leader)=>{ const s=getLeaderStats(mentions,l); shareWA(`📊 CivicLens LIVE Score\n\n${l.name} — ${l.role}, ${l.county}\nScore: ${s.score}/100 ${s.isLive?'(LIVE '+s.count+' mentions)':''}\n🟢${s.pos} ⚪${s.neu} 🔴${s.neg}\nParty: ${l.party}\n\nLive: https://civiclens.vercel.app\n#${l.county} #Accountability`) }
  const shareReport = ()=>{ const top=trending.slice(0,5).map(t=>`#${t.word}`).join(' '); shareWA(`📄 CivicLens Report — ${new Date().toLocaleDateString('en-KE')}\n\n${total} mentions | Pos ${positive} Neg ${negative}\nTrending: ${top}\n\nLeaders:\n${LEADERS_DB.slice(0,8).map(l=>{const s=getLeaderStats(mentions,l); return `• ${l.name}: ${s.score}/100`}).join('\n')}\n\nFull: https://civiclens.vercel.app\nAI Swahili/Sheng`) }

  const exportPDF = () => {
    const date = new Date().toLocaleDateString('en-KE', {dateStyle:'long'})
    const html = `<html><head><title>CivicLens ${date}</title><style>body{font-family:Arial;padding:40px;color:#0A1931} table{width:100%;border-collapse:collapse;margin-top:12px} td,th{border:1px solid #ddd;padding:8px;text-align:left;font-size:11px}.badge{padding:2px 6px;border-radius:10px;color:white;font-size:10px}.pos{background:green}.neg{background:red}.neu{background:gray}</style></head><body><h1>CivicLens — National Accountability Report</h1><p>Date: ${date} | Total: ${total} | Pos ${positive} | Neg ${negative} | Trending: ${trending.map(t=>t.word).join(', ')}</p><h2>Leaders AI Scores (47 Governors + National)</h2><table><tr><th>Leader</th><th>County</th><th>Role</th><th>Score</th><th>Mentions</th></tr>${LEADERS_DB.map(l=>{const s=getLeaderStats(mentions,l); return `<tr><td>${l.name}</td><td>${l.county}</td><td>${l.role}</td><td><b>${s.score}/100</b> ${s.isLive?'LIVE':''}</td><td>${s.count}</td></tr>`}).join('')}</table><h2>Top Mentions</h2><table><tr><th>Platform</th><th>Text</th><th>Sent</th></tr>${mentions.slice(0,25).map(m=>`<tr><td>${m.platform}</td><td>${m.text.slice(0,120)}</td><td>${m.sentiment}</td></tr>`).join('')}</table><p style="font-size:9px;color:gray;margin-top:20px">CivicLens.live — AI Swahili/Sheng • 47 Counties • Siongiroi, Bomet</p><script>window.print()</script></body></html>`
    const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close() }
  }

  return (
    <div className="min-h-screen bg-[#F2F5FA]">
      <header className="h-[56px] bg-[#0A1931] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#1E5BFF] flex items-center justify-center text-white font-bold text-[13px]">C</div><span className="text-white font-bold text-[16px]">Civic<span className="text-[#3B82F6]">Lens</span></span><span className="ml-2 text-[8px] bg-white/20 text-white px-2 py-0.5 rounded-full">{LEADERS_DB.length} LEADERS</span></div>
        <div className="flex gap-1.5"><button onClick={shareReport} className="bg-[#25D366] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">WhatsApp</button><button onClick={exportPDF} className="bg-white text-[#0A1931] text-[11px] font-bold px-3 py-1.5 rounded-full">PDF</button></div>
      </header>
      <div className="bg-[#0A1931] border-t border-white/10 flex gap-1 px-2 overflow-x-auto sticky top-[56px] z-40">
        {(['Dashboard','Mentions','Leaders','Reports'] as Tab[]).map(t=>(
          <button key={t} onClick={()=>{setTab(t); setSelectedLeader(null)}} className={`whitespace-nowrap px-4 py-3 text-[13px] font-medium border-b-2 ${tab===t?'text-white border-[#1E5BFF]':'text-white/50 border-transparent'}`}>{t}</button>
        ))}
        <a href="/landing" className="ml-auto whitespace-nowrap px-3 py-3 text-[11px] font-bold text-[#25D366]">NGO Pitch →</a>
      </div>
      <main className="px-4 py-4 pb-24 max-w-[480px] mx-auto w-full">

        {tab==='Mentions' && (<>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Live • {filteredMentions.length}/{total} • {LEADERS_DB.length} leaders tracked</p>
          <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Mentions</h1>
          <div className="mt-3 relative"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search "Ruto", "roads", "mbaya", "ufisadi"...' className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 pr-10 text-[13px] focus:outline-none focus:border-[#1E5BFF]" /><span className="absolute right-3 top-2.5 text-gray-400">🔍</span></div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{['All','News','X','Facebook','Reddit','Bluesky'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold border ${filter===f?'bg-[#0A1931] text-white border-[#0A1931]':'bg-white text-gray-500 border-gray-200'}`}>{f}</button>)}</div>
          <div className="mt-2 flex gap-2 overflow-x-auto"><span className="text-[10px] text-gray-400 py-1">🔥</span>{trending.slice(0,6).map(t=><button key={t.word} onClick={()=>setSearch(t.word)} className="whitespace-nowrap bg-white border border-gray-200 px-2.5 py-1 rounded-full text-[11px]">#{t.word} ({t.count})</button>)}</div>
          <div className="mt-3 space-y-3">{filteredMentions.map(m=><div key={m.id} className="bg-white rounded-[14px] p-4 shadow-sm"><div className="flex justify-between text-[10px] text-gray-400"><span className="font-bold">{m.platform} • {m.author}</span><span>{m.time}</span></div><p className="text-[13px] mt-2">{m.text}</p><div className="mt-3 flex gap-2 items-center"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${m.sentiment==='positive'?'bg-green-100 text-green-700':m.sentiment==='negative'?'bg-red-100 text-red-700':'bg-gray-100'}`}>{m.sentiment}</span><button onClick={()=>shareMention(m)} className="ml-auto bg-[#25D366] text-white text-[10px] px-3 py-1.5 rounded-full font-bold">WhatsApp ↗</button></div></div>)}</div>
        </>)}

        {tab==='Leaders' && (<>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">47 Governors + National • {filteredLeaders.length} shown</p>
          <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Leaders</h1>
          <div className="mt-3 flex gap-2">
            <select value={countyFilter} onChange={e=>setCountyFilter(e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-2.5 text-[12px]">{counties.map(c=><option key={c}>{c}</option>)}</select>
            <input value={leaderSearch} onChange={e=>setLeaderSearch(e.target.value)} placeholder='Search name...' className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-[12px]" />
          </div>
          <div className="mt-4 space-y-3">{filteredLeaders.map(l=>{ const stats=getLeaderStats(mentions,l); return (<div key={l.id} className="bg-white rounded-[14px] p-4"><div className="flex gap-3 items-center"><div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">{l.name[0]}</div><div className="flex-1"><p className="text-[13px] font-bold">{l.name} {stats.isLive&&<span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full ml-1">LIVE</span>}</p><p className="text-[11px] text-gray-500">{l.role} • {l.county} • {l.party}</p>{stats.isLive&&<p className="text-[10px] text-gray-400">🟢{stats.pos} ⚪{stats.neu} 🔴{stats.neg} • {stats.count} mentions</p>}</div><div className={`text-[20px] font-extrabold ${stats.score>=70?'text-green-600':stats.score>=50?'text-yellow-600':'text-red-600'}`}>{stats.score}</div></div><div className="mt-3 flex gap-2"><button onClick={()=>{setSelectedLeader(l.id); setTab('Mentions'); setSearch(l.name.split(' ')[0])}} className="flex-1 bg-[#F2F5FA] rounded-full py-2 text-[11px] font-bold">Mentions</button><button onClick={()=>shareLeader(l)} className="flex-1 bg-[#25D366] text-white rounded-full py-2 text-[11px] font-bold">WhatsApp 📲</button></div></div>)})}</div>
        </>)}

        {tab==='Reports' && (<>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">National • {total} live • {LEADERS_DB.length} leaders</p>
          <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Reports</h1>
          <div className="mt-4 rounded-[18px] bg-[#0A1931] p-5 text-white"><p className="text-[9px] font-bold tracking-[0.2em] opacity-60">47 COUNTIES COVERAGE</p><h2 className="text-[20px] font-bold mt-2">Accountability Report</h2><p className="text-[12px] mt-2 opacity-80">{total} mentions • {positive} pos • {negative} neg • {trending.length} trends</p><div className="mt-4 flex gap-2"><button onClick={fetchMentions} className="bg-white text-black text-[12px] font-bold px-4 py-2 rounded-full">{refreshing?'↻...':'↻ Refresh'}</button><button onClick={shareReport} className="bg-[#25D366] text-white text-[12px] font-bold px-4 py-2 rounded-full">WhatsApp Report</button><button onClick={exportPDF} className="bg-[#1E5BFF] text-white text-[12px] font-bold px-4 py-2 rounded-full">PDF</button></div></div>
          <div className="mt-4 bg-white rounded-[14px] p-4"><p className="text-[11px] font-bold">🔥 Trending — All Kenya</p><div className="mt-3 flex flex-wrap gap-2">{trending.map(t=>{ const big=t.count>=3; return <button key={t.word} onClick={()=>{setSearch(t.word); setTab('Mentions')}} className={`${big?'bg-[#0A1931] text-white font-bold text-[13px]':'bg-[#F2F5FA] text-[11px]'} px-3 py-1.5 rounded-full border`}>{t.word} ({t.count})</button> })}</div></div>
          <div className="mt-3 grid grid-cols-3 gap-2"><div className="bg-white rounded-[14px] p-3 border-l-4 border-l-green-500"><p className="text-[9px] text-gray-400">POSITIVE</p><p className="text-[20px] font-extrabold text-green-600">{positive}</p></div><div className="bg-white rounded-[14px] p-3 border-l-4 border-l-gray-300"><p className="text-[9px] text-gray-400">NEUTRAL</p><p className="text-[20px] font-extrabold">{neutral}</p></div><div className="bg-white rounded-[14px] p-3 border-l-4 border-l-red-500"><p className="text-[9px] text-gray-400">NEGATIVE</p><p className="text-[20px] font-extrabold text-red-600">{negative}</p></div></div>
          <div className="mt-4 bg-white rounded-[14px] p-4"><p className="text-[11px] font-bold">Top Leaders (AI LIVE)</p><div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">{LEADERS_DB.slice(0,15).map(l=>{const s=getLeaderStats(mentions,l); return <div key={l.id} className="flex justify-between text-[12px]"><span>{l.name} <span className="text-[10px] text-gray-400">{l.county}</span></span><span className={`font-bold ${s.score>=70?'text-green-600':s.score>=50?'text-yellow-600':'text-red-600'}`}>{s.score}/100 {s.isLive?'• LIVE':''}</span></div>})}<p className="text-[10px] text-gray-400 mt-2">+ {LEADERS_DB.length-15} more — see Leaders tab</p></div><div className="mt-4 flex gap-2"><button onClick={exportPDF} className="flex-1 bg-[#0A1931] text-white rounded-full py-3 text-[12px] font-bold">📄 Full PDF — All 47</button><button onClick={shareReport} className="flex-1 bg-[#25D366] text-white rounded-full py-3 text-[12px] font-bold">Share WhatsApp</button></div></div>
        </>)}

        {tab==='Dashboard' && (<><h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Dashboard • {LEADERS_DB.length} leaders</h1><div className="mt-4 bg-white rounded-[14px] p-4"><p className="text-[11px] font-bold">🔥 Trending Now — Kenya</p><div className="mt-2 flex flex-wrap gap-2">{trending.slice(0,10).map(t=><button key={t.word} onClick={()=>{setSearch(t.word); setTab('Mentions')}} className="bg-[#F2F5FA] px-2.5 py-1 rounded-full text-[11px]">#{t.word}</button>)}</div></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="bg-[#0A1931] rounded-[14px] p-4 text-white"><p className="text-[10px] opacity-60">MENTIONS</p><p className="text-[28px] font-bold">{total}</p></div><div className="bg-white rounded-[14px] p-4"><p className="text-[10px] text-gray-400">LEADERS</p><p className="text-[28px] font-bold">{LEADERS_DB.length}</p></div></div><div className="mt-3 flex gap-2"><button onClick={shareReport} className="flex-1 bg-[#25D366] text-white rounded-full py-3 text-[12px] font-bold">WhatsApp National Report</button><button onClick={exportPDF} className="flex-1 bg-[#0A1931] text-white rounded-full py-3 text-[12px] font-bold">Export PDF</button></div></>)}
      </main>
    </div>
  )
}