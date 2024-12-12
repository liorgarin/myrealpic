const express = require('express');
const fetch = require('node-fetch');
const archiver = require('archiver');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/download-photos-zip', async (req, res) => {
  const { photos, ordernum } = req.body;

  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return res.status(400).send('No photos provided');
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${ordernum}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    console.error('Archiver error:', err);
    return res.status(500).send('Error creating ZIP');
  });

  archive.pipe(res);

  for (let i = 0; i < photos.length; i++) {
    const photoUrl = photos[i];
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) {
        console.error('Failed to fetch:', photoUrl, 'Status:', response.status);
        continue;
      }
      const buffer = await response.buffer();
      const fileName = `photo_${i+1}.jpg`;
      archive.append(buffer, { name: fileName });
    } catch (error) {
      console.error('Error fetching photo:', error);
    }
  }

  await archive.finalize();
});

app.listen(3001, () => console.log("Photo zip server running on port 3001"));