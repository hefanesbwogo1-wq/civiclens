'use client'
import { useState, useEffect } from 'react'

type Tab = 'Dashboard' | 'Mentions' | 'Leaders' | 'Reports'
type Mention = { id:any, platform:string, author:string, text:string, sentiment:string, time:string, likes:number, link?:string }

const FALLBACK: Mention[] = [
  { id:1, platform:'News', author:'The Star', text:'Bomet roads project flagged over delays - residents demand accountability', sentiment:'negative', time:'2h ago', likes:42 },
  { id:2, platform:'X', author:'@BometWatch', text:'Great to see CivicLens tracking public projects!', sentiment:'positive', time:'4h ago', likes:18 },
]

export default function App(){
  const [tab, setTab] = useState<Tab>('Reports')
  const [mentions, setMentions] = useState<Mention[]>(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('All')

  const fetchMentions = async () => {
    setRefreshing(true)
    try {
      const [newsRes, socialRes] = await Promise.all([
        fetch('/api/mentions'),
        fetch('/api/social')
      ])
      const newsJ = await newsRes.json()
      const socialJ = await socialRes.json()
      const combined = [...(newsJ.mentions||[]),...(socialJ.mentions||[])]
      if(combined.length) setMentions(combined)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(()=>{ fetchMentions() }, [])

  const filteredMentions = filter==='All'? mentions : mentions.filter(m=>m.platform.toLowerCase().includes(filter.toLowerCase()))
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
          <button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap px-4 py-3 text-[13px] font-medium border-b-2 ${tab===t?'text-white border-[#1E5BFF]':'text-white/50 border-transparent'}`}>{t}</button>
        ))}
      </div>
      <main className="px-4 py-4 pb-24 max-w-[480px] mx-auto w-full">
        {tab==='Reports' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Public Conversation Intelligence {loading?'• Loading live...':`• ${total} live`}</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1 leading-none">Reports</h1>
            <div className="mt-4 rounded-[18px] bg-[#1677FF] p-5 text-white">
              <p className="text-[9px] font-bold tracking-[0.2em] opacity-80 uppercase">Intelligence Reporting</p>
              <h2 className="text-[20px] font-bold mt-2 leading-tight">Conversation Reports</h2>
              <p className="text-[12px] mt-2 opacity-90 leading-[1.4]">Live from Google News + X (Bluesky) + FB-like (Reddit) - {total} mentions</p>
              <button onClick={fetchMentions} className="mt-4 bg-white text-black text-[12px] font-bold px-4 py-2 rounded-full">{refreshing?'↻ Refreshing...':'↻ Refresh Live'}</button>
            </div>
            <div className="mt-3 space-y-3">
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-[#0A1931]"><p className="text-[9px] font-bold text-gray-400">TOTAL MENTIONS</p><p className="text-[28px] font-extrabold mt-1">{total} <span className="text-[10px] font-normal text-gray-400">{mentions.filter(m=>m.platform.includes('News')).length} News • {mentions.filter(m=>m.platform.includes('X')||m.platform.includes('Bluesky')).length} X • {mentions.filter(m=>m.platform.includes('Reddit')||m.platform.includes('Facebook')).length} FB-like</span></p></div>
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-green-500"><p className="text-[9px] font-bold text-gray-400">POSITIVE</p><p className="text-[24px] font-extrabold text-green-600 mt-1">{positive}</p><div className="mt-2 h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width:`${total?positive/total*100:0}%`}}/></div></div>
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-gray-300"><p className="text-[9px] font-bold text-gray-400">NEUTRAL</p><p className="text-[24px] font-extrabold mt-1">{neutral}</p></div>
              <div className="bg-white rounded-[14px] p-4 border-l-4 border-l-red-500"><p className="text-[9px] font-bold text-gray-400">NEGATIVE</p><p className="text-[24px] font-extrabold text-red-600 mt-1">{negative}</p></div>
            </div>
          </>
        )}
        {tab==='Mentions' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Live Feed • News + X + FB-like</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Mentions</h1>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {['All','News','X','Facebook','Reddit','Bluesky'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold border ${filter===f?'bg-[#0A1931] text-white border-[#0A1931]':'bg-white text-gray-500 border-gray-200'}`}>{f}</button>
              ))}
            </div>
            <div className="mt-3 space-y-3">
              {filteredMentions.map(m=>(
                <a key={m.id} href={m.link||'#'} target="_blank" className="block bg-white rounded-[14px] p-4 shadow-sm">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${m.platform.includes('News')?'bg-blue-50 text-[#1E5BFF]':m.platform.includes('X')||m.platform.includes('Bluesky')?'bg-black text-white':'bg-orange-50 text-orange-600'}`}>{m.platform} • {m.author}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="text-[13px] mt-2 leading-snug">{m.text}</p>
                  <div className="mt-2 flex gap-2"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${m.sentiment==='positive'?'bg-green-100 text-green-700':m.sentiment==='negative'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{m.sentiment.toUpperCase()}</span><span className="text-[10px] text-gray-400">♥ {m.likes}</span></div>
                </a>
              ))}
            </div>
          </>
        )}
        {tab==='Dashboard' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Overview</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Dashboard</h1>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#0A1931] rounded-[14px] p-4 text-white"><p className="text-[10px] opacity-60">TOTAL</p><p className="text-[28px] font-bold mt-1">{total}</p></div>
              <div className="bg-white rounded-[14px] p-4"><p className="text-[10px] text-gray-400">SENTIMENT</p><p className="text-[18px] font-bold mt-1 text-green-600">{total?Math.round(positive/total*100):0}% Positive</p></div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="bg-white rounded-[12px] p-3 text-center"><p className="text-[10px] text-gray-400">NEWS</p><p className="text-[20px] font-bold">{mentions.filter(m=>m.platform.includes('News')).length}</p></div>
              <div className="bg-white rounded-[12px] p-3 text-center"><p className="text-[10px] text-gray-400">X / BLUESKY</p><p className="text-[20px] font-bold">{mentions.filter(m=>m.platform.includes('X')||m.platform.includes('Bluesky')).length}</p></div>
              <div className="bg-white rounded-[12px] p-3 text-center"><p className="text-[10px] text-gray-400">FB-LIKE</p><p className="text-[20px] font-bold">{mentions.filter(m=>m.platform.includes('Reddit')||m.platform.includes('Facebook')).length}</p></div>
            </div>
            <div className="mt-4 bg-white rounded-[14px] p-4"><p className="text-[12px] font-bold">Latest Live</p>{mentions.slice(0,4).map(m=>(<div key={m.id} className="mt-3 text-[12px] border-t pt-3 first:border-0"><span className="text-[10px] font-bold text-[#1E5BFF]">{m.platform}</span> <b>{m.author}</b>: {m.text.slice(0,100)}</div>))}</div>
          </>
        )}
        {tab==='Leaders' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Accountability</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Leaders</h1>
            <div className="mt-4 space-y-3">
              {[{name:'Gov. Hillary Barchok', role:'Governor, Bomet', score:68},{name:'Hon. Linet Chepkorir', role:'Women Rep', score:82}].map(l=>(
                <div key={l.name} className="bg-white rounded-[14px] p-4 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">{l.name[0]}</div>
                  <div className="flex-1"><p className="text-[13px] font-bold">{l.name}</p><p className="text-[11px] text-gray-500">{l.role}</p></div>
                  <div className="text-[16px] font-extrabold text-[#1E5BFF]">{l.score}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}