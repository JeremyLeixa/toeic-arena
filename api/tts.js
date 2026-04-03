// Simple in-memory rate limiter (per serverless instance)
var _rateMap = {};
function rateLimit(key, maxReqs, windowMs) {
  var now = Date.now();
  if (!_rateMap[key]) _rateMap[key] = [];
  _rateMap[key] = _rateMap[key].filter(function(t) { return t > now - windowMs; });
  if (_rateMap[key].length >= maxReqs) return false;
  _rateMap[key].push(now);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: require shared secret
  var secret = req.headers['x-push-secret'];
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limit: 20 requests per minute per IP
  var ip = req.headers['x-forwarded-for'] || 'unknown';
  if (!rateLimit(ip, 20, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { text, voice } = req.body;
  if (typeof text !== 'string' || !text.trim() || text.length > 500) {
    return res.status(400).json({ error: 'Text required (max 500 chars)' });
  }

  // Voice IDs from ElevenLabs
  const voices = {
    us_female: 'EXAVITQu4vr4xnSDxMaL',    // Sarah
    us_male: 'pqHfZKP75CvOlQylNhV4',       // Bill  
    uk_female: 'Xb7hH8MSUJpSbSDYk0k2',     // Charlotte
    uk_male: 'bIHbv24MWmeRgasZH58o',        // Will
  };
  const voiceId = voices[voice] || voices.us_female;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[TTS] ElevenLabs error:', response.status, await response.text());
      return res.status(response.status >= 500 ? 503 : 400).json({ error: 'TTS generation failed' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.send(Buffer.from(audioBuffer));
  } catch (e) {
    console.error('[TTS] Exception:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}