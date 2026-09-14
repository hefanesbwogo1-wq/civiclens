"use client";
import { useState, useEffect } from "react";

const PLATFORMS_DETAIL = [
  {id:"wa", n:"WhatsApp", c:892, p:71, col:"#25D366", icon:"W", desc:"Public groups • Chief barazas, market groups, matatu saccos", top:["Barabara ya Siongiroi-Chebole mbaya","Maji hakuna Sotik wiki 3","Bursary Kapletundo haijafika"], counties:["Bomet","Nakuru","Kiambu","Turkana"]},
  {id:"fb", n:"Facebook", c:234, p:19, col:"#1877F2", icon:"f", desc:"County pages, MCA pages, citizen posts", top:["Stima ya Litein zima siku 3","Hospitali ya Longisa dawa hakuna","Roads Kisii graded shoddy"], counties:["Kisii","Nairobi","Kisumu","Mombasa"]},
  {id:"x", n:"X (Twitter)", c:89, p:7, col:"#000", icon:"X", desc:"Elite + journalists, accountability hashtags", top:["#BometRoads crisis","#NairobiBursary audit","#TurkanaWater"], counties:["Nairobi","Uasin Gishu","Machakos"]},
  {id:"tt", n:"TikTok", c:32, p:3, col:"#111", icon:"T", desc:"Gen Z, sheng rants, on-ground videos", top:["Video: Murram road Bomet","Video: Floods Tana River","Video: School no desks Turkana"], counties:["Garissa","Tana River","Kajiado"]},
];

export default function PlatformsPage(){
  return (
    <div className="bg-[#F8F9FB] min-h-screen">
      <div className="max-w-[1200px] mx-auto p-3 md:p-4">
        <div className="rounded-[20px] bg-zinc-900 text-white p-5 flex justify-between items-center">
          <div><h2 className="font-black text-lg">Platforms - Kenya Wide</h2><p className="text-xs opacity-70">Where Kenyans talk — same pattern in all 47 counties</p></div>
          <a href="/" className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold">Dashboard</a>
        </div>
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <div className="md:col-span-3 grid md:grid-cols-2 gap-3">
            {PLATFORMS_DETAIL.map(pl=>(
              <div key={pl.id} className="bg-white rounded-[20px] border p-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center"><div className="w-10 h-10 rounded-full grid place-items-center text-white font-bold" style={{background:pl.col}}>{pl.icon}</div><div><div className="font-black text-sm">{pl.n}</div><div className="text-[11px] text-zinc-500">{pl.c} mentions • {pl.p}% national</div></div></div>
                  <div className="text-[11px] font-black px-2.5 py-1 rounded-full bg-zinc-900 text-white">{pl.p}%</div>
                </div>
                <div className="mt-3"><div className="h-2 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${pl.p}%`, background:pl.col}}/></div></div>
                <div className="mt-3 text-[11px] text-zinc-600">{pl.desc}</div>
                <div className="mt-3 space-y-1.5">
                  {pl.top.map((t,i)=><div key={i} className="text-[11px] p-2 rounded-xl bg-[#F8F9FB] border">"{t}"</div>)}
                </div>
                <div className="mt-3 flex gap-1 flex-wrap">{pl.counties.map(c=><span key={c} className="text-[9px] px-2 py-1 rounded-full bg-zinc-50 border">{c}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-[20px] border p-4"><b className="text-sm">Why WhatsApp 71%?</b><div className="mt-3 text-[11px] space-y-2 text-zinc-600"><div>12M Kenyans in public groups</div><div>Chief baraza to complaint same group</div><div>Sheng/Swahili - Twitter is English</div><div>Works on kabambe</div></div><div className="mt-3 p-3 rounded-xl bg-green-50 border text-[11px]">Pattern in ALL 47 counties</div></div>
            <div className="bg-[#FF4D00] rounded-[20px] p-4 text-white"><b className="text-sm">Kenya Insight</b><div className="text-xs mt-2">NGOs tracking Twitter only miss 71%. We track where mwananchi talks.</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
