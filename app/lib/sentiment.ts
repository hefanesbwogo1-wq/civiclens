export function analyzeSentiment(text: string): { label: 'positive'|'negative'|'neutral', score: number } {
  const t = text.toLowerCase()

  const positiveWords = [
    // English
    'good','great','excellent','success','launched','completed','praise','kudos','thanks','working','progress','improved','development',
    // Swahili / Sheng
    'mzuri','vizuri','poa','fiti','safi','hongera','maendeleo','imekamilika','imezinduliwa','asante','safi sana','poa sana','best'
  ]
  const negativeWords = [
    // English
    'bad','delay','delayed','stalled','failed','fail','corrupt','corruption','flagged','protest','complaint','missing','audit','scandal','poor','worst','broken',
    // Swahili / Sheng
    'mbaya','mbovu','ufisadi','wizi','imeharibika','imechelewa','imekwama','imefeli','ubaya','hongo','imebomo','hakuna maji','barabara mbaya','shida','lalamika','maandamano'
  ]

  let pos = 0, neg = 0
  positiveWords.forEach(w=>{ if(t.includes(w)) pos++ })
  negativeWords.forEach(w=>{ if(t.includes(w)) neg++ })

  // emoji check
  if(t.includes('😡')||t.includes('🤬')||t.includes('💔')) neg+=2
  if(t.includes('❤️')||t.includes('🙏')||t.includes('👏')||t.includes('🎉')) pos+=2

  const total = pos + neg
  if(total===0) return { label:'neutral', score:0 }
  const score = (pos - neg) / Math.max(total,1) // -1 to 1

  if(score > 0.2) return { label:'positive', score }
  if(score < -0.2) return { label:'negative', score }
  return { label:'neutral', score }
}

export function calculateLeaderScore(mentions: any[], leaderName: string, fallback: number){
  const firstName = leaderName.split(' ')[0].toLowerCase()
  const lastName = leaderName.split(' ').pop()!.toLowerCase()
  const related = mentions.filter(m=>{
    const txt = (m.text+' '+m.author).toLowerCase()
    return txt.includes(firstName) || txt.includes(lastName)
  })
  if(related.length < 2) return fallback // not enough data

  const pos = related.filter(m=>m.sentiment==='positive').length
  const neu = related.filter(m=>m.sentiment==='neutral').length
  const neg = related.filter(m=>m.sentiment==='negative').length
  // Score formula: 100 - negative%*1.5 + positive bonus, clamped 15-95
  const negPct = neg / related.length
  const posPct = pos / related.length
  let score = Math.round( (pos + neu*0.5) / related.length * 100 )
  score = Math.max(15, Math.min(95, score))
  return { score, mentions: related.length, breakdown: {pos, neu, neg} }
}