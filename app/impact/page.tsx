export default function NGOPitch(){
  return (
    <div style={{padding:20, fontFamily:"sans-serif", background:"#F2F5FA", minHeight:"100vh"}}>
      <a href="/" style={{textDecoration:"none"}}>← Back</a>
      <h1 style={{fontSize:28, fontWeight:800, marginTop:12}}>Impact - CivicLens</h1>
      <p>Built in Siongiroi • Scaling to 47 Counties</p>
      
      <div style={{background:"white", padding:16, borderRadius:12, marginTop:16}}>
        <b>Problem:</b> 12M Kenyans discuss leaders in WhatsApp, no tracking.
        <br/><br/>
        <b>Solution:</b> AI listens to public WhatsApp groups (Swahili/Sheng), tags leader + sentiment + issue.
        <br/><br/>
        <b>Traction:</b> 50 leaders LIVE, 1.2k mentions, Bomet pilot.
        <br/><br/>
        <b>Ask:</b> $5k to scale to 47 Counties + build USSD *384* for mama mboga.
      </div>

      <a href="https://wa.me/254700000000?text=Interested%20in%20CivicLens%20Impact%20Deck" style={{display:"block", marginTop:16, background:"#FF6B35", color:"white", padding:14, borderRadius:12, textAlign:"center", textDecoration:"none", fontWeight:700}}>Talk to Founder - Siongiroi</a>
    </div>
  )
}
