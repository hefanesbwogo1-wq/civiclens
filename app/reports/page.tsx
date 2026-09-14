export default function Reports(){
  return (
    <div style={{padding:20, fontFamily:"sans-serif", background:"#F2F5FA", minHeight:"100vh"}}>
      <a href="/" style={{textDecoration:"none"}}>← Back to Dashboard</a>
      <h1 style={{fontSize:28, fontWeight:800, marginTop:12}}>Live Reports - 47 Counties</h1>
      <p>Bomet pilot LIVE • Tracking 50 leaders</p>
      <div style={{background:"white", padding:16, borderRadius:12, marginTop:16}}>
        <b>#roads - Bomet</b><div style={{fontSize:12, color:"#666"}}>234 mentions • 78% negative • Siongiroi</div>
        <div style={{marginTop:8, padding:8, background:"#ffe5e5", borderRadius:8}}>“Barabara ya Siongiroi-Chebole mbaya sana, mchanga tu” - WhatsApp Group</div>
      </div>
      <div style={{background:"white", padding:16, borderRadius:12, marginTop:12}}>
        <b>#ufisadi - Nairobi</b><div style={{fontSize:12, color:"#666"}}>189 mentions • 82% negative</div>
      </div>
      <div style={{background:"white", padding:16, borderRadius:12, marginTop:12}}>
        <b>#maji - Turkana</b><div style={{fontSize:12, color:"#666"}}>156 mentions • water crisis</div>
      </div>
      <a href="/" style={{display:"block", marginTop:20, background:"#0A1931", color:"white", padding:12, borderRadius:12, textAlign:"center", textDecoration:"none"}}>Back to Dashboard</a>
    </div>
  )
}
