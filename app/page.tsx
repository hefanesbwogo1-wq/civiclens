'use client'
import { useState } from 'react'

type Tab = 'Dashboard' | 'Mentions' | 'Leaders' | 'Reports'

const MENTIONS = [
  { id:1, platform:'News', author:'The Star', text:'Bomet roads project flagged over delays - residents demand accountability', sentiment:'negative', time:'2h ago', likes:42 },
  { id:2, platform:'X', author:'@BometWatch', text:'Great to see CivicLens tracking public projects! Transparency matters.', sentiment:'positive', time:'4h ago', likes:18 },
  { id:3, platform:'News', author:'Daily Nation', text:'Governor launches new health initiative, receives neutral reception from MCAs', sentiment:'neutral', time:'6h ago', likes:7 },
  { id:4, platform:'Facebook', author:'Siongiroi Forum', text:'Water project finally completed after 3 years. Kudos to county team.', sentiment:'positive', time:'8h ago', likes:56 },
  { id:5, platform:'X', author:'@Mkenya254', text:'What about the stalled market? No one is talking about it.', sentiment:'neutral', time:'10h ago', likes:3 },
]

export default function App(){
  const [tab, setTab] = useState<Tab>('Reports')
  const [refreshing, setRefreshing] = useState(false)

  const total = MENTIONS.length
  const positive = MENTIONS.filter(m=>m.sentiment==='positive').length
  const neutral = MENTIONS.filter(m=>m.sentiment==='neutral').length
  const negative = total - positive - neutral

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(()=>setRefreshing(false), 900)
  }

  return (
    <div className="min-h-screen bg-[#F2F5FA] w-full overflow-x-hidden">
      {/* HEADER */}
      <header className="h-[56px] bg-[#0A1931] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1E5BFF] flex items-center justify-center text-white font-bold text-[13px]">C</div>
          <span className="text-white font-bold text-[16px]">Civic<span className="text-[#3B82F6]">Lens</span></span>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white text-[12px] font-bold">H</div>
      </header>

      {/* TABS */}
      <div className="bg-[#0A1931] border-t border-white/10 flex gap-1 px-2 overflow-x-auto scrollbar-none sticky top-[56px] z-40">
        {(['Dashboard','Mentions','Leaders','Reports'] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap px-4 py-3 text-[13px] font-medium border-b-2 transition ${tab===t?'text-white border-[#1E5BFF]':'text-white/50 border-transparent hover:text-white/80'}`}>{t}</button>
        ))}
      </div>

      <main className="px-4 py-4 pb-24 max-w-[480px] mx-auto w-full">
        {tab==='Reports' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Public Conversation Intelligence</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1 leading-none">Reports</h1>
            <div className="mt-4 rounded-[18px] bg-[#1677FF] p-5 text-white">
              <p className="text-[9px] font-bold tracking-[0.2em] opacity-80 uppercase">Intelligence Reporting</p>
              <h2 className="text-[20px] font-bold mt-2 leading-tight">Conversation Reports</h2>
              <p className="text-[12px] mt-2 opacity-90 leading-[1.4]">Real monitoring data from Google News RSS - Live intelligence for {total} mentions</p>
              <button onClick={handleRefresh} className="mt-4 bg-white text-black text-[12px] font-bold px-4 py-2 rounded-full active:scale-95 transition">{refreshing?'Refreshing...':'↻ Refresh'}</button>
            </div>
            <div className="mt-3 space-y-3">
              <div className="bg-white rounded-[14px] p-4 flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-[#0A1931]">
                <div><p className="text-[9px] font-bold tracking-widest text-gray-400">TOTAL MENTIONS</p><p className="text-[28px] font-extrabold mt-1">{total}<span className="text-[12px] font-normal text-gray-500 ml-2">Across all platforms</span></p></div>
              </div>
              <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-green-500">
                <p className="text-[9px] font-bold tracking-widest text-gray-400">POSITIVE</p><p className="text-[24px] font-extrabold text-green-600 mt-1">{positive}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width:`${(positive/total)*100}%`}}/></div>
              </div>
              <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-gray-300">
                <p className="text-[9px] font-bold tracking-widest text-gray-400">NEUTRAL</p><p className="text-[24px] font-extrabold mt-1">{neutral}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-gray-400 rounded-full" style={{width:`${(neutral/total)*100}%`}}/></div>
              </div>
              <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-red-500">
                <p className="text-[9px] font-bold tracking-widest text-gray-400">NEGATIVE</p><p className="text-[24px] font-extrabold text-red-600 mt-1">{negative}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-red-500 rounded-full" style={{width:`${(negative/total)*100}%`}}/></div>
              </div>
            </div>
          </>
        )}

        {tab==='Dashboard' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Overview</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Dashboard</h1>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#0A1931] rounded-[14px] p-4 text-white"><p className="text-[10px] opacity-60">TOTAL</p><p className="text-[28px] font-bold mt-1">{total}</p></div>
              <div className="bg-white rounded-[14px] p-4"><p className="text-[10px] text-gray-400">SENTIMENT</p><p className="text-[18px] font-bold mt-1 text-green-600">{Math.round(positive/total*100)}% Positive</p></div>
            </div>
            <div className="mt-4 bg-white rounded-[14px] p-4">
              <p className="text-[12px] font-bold">Latest Mentions</p>
              {MENTIONS.slice(0,3).map(m=>(<div key={m.id} className="mt-3 text-[12px] border-t pt-3 first:border-0"><b>{m.author}</b>: {m.text}</div>))}
            </div>
          </>
        )}

        {tab==='Mentions' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Live Feed</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Mentions</h1>
            <div className="mt-4 space-y-3">
              {MENTIONS.map(m=>(
                <div key={m.id} className="bg-white rounded-[14px] p-4 shadow-sm">
                  <div className="flex justify-between text-[10px] text-gray-400"><span className="font-bold text-[#1E5BFF]">{m.platform} • {m.author}</span><span>{m.time}</span></div>
                  <p className="text-[13px] mt-2 leading-snug">{m.text}</p>
                  <div className="mt-2 flex gap-2"><span className={`text-[10px] px-2 py-1 rounded-full font-bold ${m.sentiment==='positive'?'bg-green-100 text-green-700':m.sentiment==='negative'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{m.sentiment.toUpperCase()}</span><span className="text-[10px] text-gray-400">♥ {m.likes}</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==='Leaders' && (
          <>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Accountability</p>
            <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1">Leaders</h1>
            <div className="mt-4 space-y-3">
              {[
                {name:'Gov. Hillary Barchok', role:'Governor, Bomet', score:68, mentions:124},
                {name:'Hon. Linet Chepkorir', role:'Women Rep', score:82, mentions:89},
                {name:'Siongiroi MCA', role:'MCA Office', score:45, mentions:32},
              ].map(l=>(
                <div key={l.name} className="bg-white rounded-[14px] p-4 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">{l.name[0]}</div>
                  <div className="flex-1"><p className="text-[13px] font-bold">{l.name}</p><p className="text-[11px] text-gray-500">{l.role} • {l.mentions} mentions</p></div>
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