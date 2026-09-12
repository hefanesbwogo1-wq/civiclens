const { createClient } = require('@supabase/supabase-js');
module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('mentions').select('*, leaders(full_name, public_name)').eq('user_id', user.id).order('published_at', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ mentions: data, success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
