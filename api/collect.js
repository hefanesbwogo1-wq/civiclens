const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: leaders } = await supabase.from('leaders').select('*').eq('user_id', user.id).eq('monitoring_enabled', true);
    
    let collected = 0;
    for (const leader of leaders || []) {
      const query = encodeURIComponent(leader.full_name || leader.public_name || "");
      if (!query) continue;
      const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-KE&gl=KE&ceid=KE:en`;
      try {
        const feed = await parser.parseURL(rssUrl);
        for (const item of feed.items.slice(0, 5)) {
          const { data: exists } = await supabase.from('mentions').select('id').eq('url', item.link).eq('user_id', user.id).limit(1);
          if (exists && exists.length > 0) continue;

          const text = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();
          let sentiment = 'neutral';
          if (['praised','wins','support','launches','good','development','approved'].some(w=>text.includes(w))) sentiment = 'positive';
          if (['criticized','scandal','corrupt','protest','fails','accused','arrested'].some(w=>text.includes(w))) sentiment = 'negative';

          await supabase.from('mentions').insert({
            user_id: user.id,
            leader_id: leader.id,
            content: (item.title + ' - ' + (item.contentSnippet || '')).slice(0,500),
            platform: 'News',
            sentiment,
            author: 'Google News',
            url: item.link,
            published_at: item.isoDate || new Date().toISOString()
          });
          collected++;
        }
      } catch (e) { console.log('RSS error for', query, e.message); }
    }
    return res.status(200).json({ success: true, collected });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}