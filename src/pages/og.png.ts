import { ImageResponse } from '@vercel/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const GET = async () => {
  // 1. Read the font and explicitly convert the Node Buffer to an ArrayBuffer
  const fontBuffer = await readFile(join(process.cwd(), 'public/fonts/orbitron-bold.otf'));
  const fontArrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );

  // 2. Read the image as usual
  const image = await readFile(join(process.cwd(), 'public/images/dp3.jpg'));
  const imageBase64 = `data:image/jpeg;base64,${image.toString('base64')}`;

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '1200px',
          height: '630px',
          background: '#0a0010',
          padding: '80px',
          fontFamily: 'Orbitron',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 },
              children: [
                {
                  type: 'p',
                  props: {
                    style: { color: '#0fd28c', fontSize: '22px', letterSpacing: '0.3em', margin: '0 0 20px 0' },
                    children: '— Python | Deep Learning | Full Stack',
                  },
                },
                {
                  type: 'h1',
                  props: {
                    style: { color: '#0fd28c', fontSize: '100px', fontWeight: 900, lineHeight: 0.9, margin: '0 0 30px 0', textTransform: 'uppercase' },
                    children: 'AKIF ZAHIN',
                  },
                },
                {
                  type: 'p',
                  props: {
                    style: { color: '#888888', fontSize: '24px', margin: '0 0 30px 0' },
                    children: 'Building full stack AI-powered apps — Dhaka, Bangladesh',
                  },
                },
                {
                  type: 'p',
                  props: {
                    style: { color: '#0fd28c', fontSize: '20px', margin: 0, letterSpacing: '0.2em', textTransform: 'uppercase' },
                    children: 'View Portfolio → akifzahin.dev',
                  },
                },
              ],
            },
          },
          {
            type: 'img',
            props: {
              src: imageBase64,
              style: {
                width: '280px',
                height: '280px',
                objectFit: 'cover',
                clipPath: 'polygon(10% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%, 0% 10%)',
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Orbitron',
          data: fontArrayBuffer, // <-- Passing the clean ArrayBuffer here fixes the crash
          weight: 900,
        },
      ],
    }
  );
};