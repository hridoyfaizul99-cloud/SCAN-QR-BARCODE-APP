import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google Gen AI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Convert raw 16-bit PCM little-endian audio bytes (from gemini-3.8-flash-tts) into standard WAV.
 * If the bytes already start with RIFF header, returns untouched.
 */
function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  if (
    pcmData.length >= 4 &&
    pcmData[0] === 0x52 &&
    pcmData[1] === 0x49 &&
    pcmData[2] === 0x46 &&
    pcmData[3] === 0x46
  ) {
    return pcmData;
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Extract text from web URL (with HTML strip and reader fallback)
app.post('/api/extract-article', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to fetch webpage (HTTP ${response.status}). You can paste the article text directly.`,
      });
      return;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    // Simple robust HTML content extraction: remove scripts, styles, svgs, header, footer, nav
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Keep first 8000 characters if very long
    if (cleanText.length > 8000) {
      cleanText = cleanText.slice(0, 8000) + '...';
    }

    res.json({
      title,
      content: cleanText,
      sourceUrl: url,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Unable to fetch article from link. Please paste the article text directly.',
    });
  }
});

// Generate commute script and audio
app.post('/api/generate-briefing', async (req: Request, res: Response) => {
  try {
    const {
      articles,
      commuteDuration = 5,
      commuterProfile = {
        role: 'Professional',
        interests: ['Technology', 'Economy'],
      },
      style = 'podcast_duo', // 'podcast_duo' | 'npr_anchor' | 'executive_summary' | 'casual_commute'
      voiceA = 'Puck',
      voiceB = 'Kore',
    } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      res.status(400).json({ error: 'Please provide at least one article to summarize.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.',
      });
      return;
    }

    // Target word count based on speaking rate ~140-150 words per minute
    const targetWordCount = Math.min(Math.max(commuteDuration * 140, 300), 1800);

    const isDuo = style === 'podcast_duo';

    const systemPrompt = `You are the executive producer and lead broadcaster for "CommuteCast", an audio news service designed for busy commuters on their way to work or back home.
Your mission: Take the user's provided news articles and write an engaging, natural, personalized radio/podcast script tailored for listening during a commute.

Commuter Profile:
- Profession/Role: ${commuterProfile.role || 'General Professional'}
- Key Interests: ${(commuterProfile.interests || []).join(', ') || 'General News, Tech, Business'}
- Target Audio Length: ${commuteDuration} minutes (around ${targetWordCount} words total)
- Broadcast Style: ${
      isDuo
        ? 'Dynamic Podcast Co-Hosts: "Alex" (curious, energetic, asks great questions) and "Sam" (insightful, analytical, provides context). Include natural transitions, backchanneling like |yeah| and |mhm|, and vocal tags like <breath> or <laugh>.'
        : style === 'npr_anchor'
        ? 'NPR Morning Anchor: Thoughtful, articulate, measured, authoritative with smart context.'
        : style === 'executive_summary'
        ? 'Executive Morning Briefing: Crisp, bottom-line upfront, market/industry implications.'
        : 'Casual Commuter Radio: Friendly, punchy, engaging morning drive momentum.'
    }

Rules for the audio script:
1. It MUST be written specifically to be spoken aloud. Avoid awkward parentheticals, URLs, or citations. Use conversational signposts: "Turning to our next story...", "Now, let's unpack...", "Here's what this means for your day...".
2. Tailor "Why it matters" specifically to the commuter's profile (${commuterProfile.role}).
3. Organize into clear story segments/chapters corresponding to the articles.
4. If podcast_duo style: EVERY line of dialogue must have a speaker attribution ("Alex" or "Sam"). Each speaker turn should be 1-3 sentences.
5. If single speaker style: speaker should be "Anchor".
`;

    const articlesText = articles
      .map(
        (a: any, idx: number) =>
          `[Article ${idx + 1}]
Title: ${a.title || 'Untitled'}
Priority: ${a.priority || 'normal'}
Source: ${a.sourceUrl || 'User input'}
Content:
${(a.content || '').slice(0, 3500)}
`
      )
      .join('\n---\n');

    // Call gemini-3.8-flash to create the editorial script
    const scriptResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nHere are the news articles to cover in today's commute briefing:\n${articlesText}\n\nGenerate the complete structured briefing with chapters, key takeaways, and the exact spoken dialogue script.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Catchy, engaging headline for this commute edition',
            },
            headline: {
              type: Type.STRING,
              description: 'One-line punchy subtitle',
            },
            estimatedMinutes: {
              type: Type.NUMBER,
              description: 'Estimated listening duration in minutes',
            },
            executiveSummary: {
              type: Type.STRING,
              description: '2-3 sentence overview of what the commuter will learn',
            },
            chapters: {
              type: Type.ARRAY,
              description: 'List of individual news story segments',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  storyTitle: { type: Type.STRING },
                  originalArticleTitle: { type: Type.STRING },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2-3 concise bullet points',
                  },
                  whyItMatters: {
                    type: Type.STRING,
                    description: 'Direct implication for the commuter profile',
                  },
                  dialogue: {
                    type: Type.ARRAY,
                    description: 'The spoken dialogue lines for this story segment',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING, description: 'Alex, Sam, or Anchor' },
                        text: { type: Type.STRING, description: 'The spoken words' },
                        style: {
                          type: Type.STRING,
                          description: 'Direction like "Enthusiastic", "Thoughtful", or "Crisp"',
                        },
                      },
                      required: ['speaker', 'text'],
                    },
                  },
                },
                required: ['id', 'storyTitle', 'keyTakeaways', 'whyItMatters', 'dialogue'],
              },
            },
          },
          required: ['title', 'headline', 'estimatedMinutes', 'executiveSummary', 'chapters'],
        },
      },
    });

    const scriptJsonText = scriptResponse.text;
    if (!scriptJsonText) {
      throw new Error('No script generated from Gemini model');
    }

    const scriptData = JSON.parse(scriptJsonText);

    // Now generate high-fidelity audio using gemini-3.8-flash-tts
    // We will generate audio for each chapter to keep time markers clean and guarantee smooth audio stitching
    const audioSegments: {
      chapterId: string;
      startTime: number;
      duration: number;
      wavBase64: string;
      rawPcm: Buffer;
    }[] = [];

    let currentTotalSeconds = 0;

    for (let i = 0; i < scriptData.chapters.length; i++) {
      const chapter = scriptData.chapters[i];

      try {
        let ttsResponse;

        if (isDuo) {
          // Format dialogue parts for multi-speaker gemini-3.8-flash-tts
          const parts = chapter.dialogue.map((d: any) => {
            const speakerName = d.speaker === 'Sam' ? 'Sam' : 'Alex';
            return {
              text: `${speakerName}: ${d.text}`,
              speechMetadata: {
                speaker: speakerName,
                style: d.style || (speakerName === 'Alex' ? 'Enthusiastic podcast host' : 'Insightful co-host'),
              },
            };
          });

          // If parts is empty for some reason, provide fallback
          if (parts.length === 0) {
            parts.push({
              text: `Alex: Now let's discuss ${chapter.storyTitle}. Sam, what's the key takeaway here?`,
              speechMetadata: { speaker: 'Alex', style: 'Enthusiastic podcast host' },
            });
          }

          ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: 'Alex',
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceA || 'Puck' },
                      },
                    },
                    {
                      speaker: 'Sam',
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceB || 'Kore' },
                      },
                    },
                  ],
                },
              },
            },
          });
        } else {
          // Single speaker mode
          const combinedChapterText = chapter.dialogue.map((d: any) => d.text).join(' ');
          const anchorVoice = voiceA || 'Zephyr';

          ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: combinedChapterText,
                    speechMetadata: {
                      style:
                        style === 'npr_anchor'
                          ? 'Thoughtful, articulate, NPR-style radio anchor'
                          : 'Clear, confident, professional morning news anchor',
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: anchorVoice },
                },
              },
            },
          });
        }

        const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (audioPart && audioPart.data) {
          const rawBytes = Buffer.from(audioPart.data, 'base64');
          // 24000 Hz, 16-bit mono = 48000 bytes per second
          const durationSeconds = rawBytes.length / 48000;
          const wavBuffer = pcmToWav(rawBytes, 24000, 1, 16);

          audioSegments.push({
            chapterId: chapter.id,
            startTime: currentTotalSeconds,
            duration: durationSeconds,
            wavBase64: wavBuffer.toString('base64'),
            rawPcm: rawBytes,
          });

          // Attach timestamp metrics to chapter
          chapter.startTimeSeconds = currentTotalSeconds;
          chapter.durationSeconds = durationSeconds;
          currentTotalSeconds += durationSeconds;
        } else {
          console.warn(`No audio returned for chapter ${i}: ${chapter.storyTitle}`);
        }
      } catch (err: any) {
        console.error(`TTS generation error for chapter ${i}:`, err);
        // Chapter continues without breaking the entire briefing
      }
    }

    // Concatenate all raw PCM segments into a single full briefing audio track
    let fullWavBase64 = '';
    if (audioSegments.length > 0) {
      const allPcm = Buffer.concat(audioSegments.map((s) => s.rawPcm));
      const fullWav = pcmToWav(allPcm, 24000, 1, 16);
      fullWavBase64 = fullWav.toString('base64');
    }

    res.json({
      briefing: {
        id: 'briefing_' + Date.now(),
        createdAt: new Date().toISOString(),
        title: scriptData.title,
        headline: scriptData.headline,
        estimatedMinutes: Math.max(1, Math.round(currentTotalSeconds / 60) || scriptData.estimatedMinutes),
        actualDurationSeconds: currentTotalSeconds,
        executiveSummary: scriptData.executiveSummary,
        chapters: scriptData.chapters,
        fullAudioWavBase64: fullWavBase64,
        style,
        voiceA,
        voiceB,
      },
    });
  } catch (error: any) {
    console.error('Error generating briefing:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate audio summary. Please try again.',
    });
  }
});

// Single voice preview test endpoint
app.post('/api/preview-voice', async (req: Request, res: Response) => {
  try {
    const { voiceName = 'Puck', text = "Good morning! Here's your personalized commute news briefing." } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Warm, clear radio host',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error('No audio returned');
    }

    const rawBytes = Buffer.from(audioData, 'base64');
    const wavBuffer = pcmToWav(rawBytes, 24000, 1, 16);

    res.json({
      audioBase64: wavBuffer.toString('base64'),
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to preview voice' });
  }
});

// Serve frontend with Vite in development or static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`CommuteCast server running on port ${port}`);
  });
}

startServer();
