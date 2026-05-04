import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    let stream = null;

    const setupAudio = async () => {
      try {
        if (!isRecording) return;
        
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        
        const analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 64;
        analyzerRef.current = analyzer;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyzer);
        
        const bufferLength = analyzer.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        draw();
      } catch (err) {
        console.error('Microphone access denied or error:', err);
      }
    };

    const draw = () => {
      if (!canvasRef.current || !analyzerRef.current || !dataArrayRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
      
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / dataArrayRef.current.length) * 1.5;
      let x = 0;
      
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        // Soften the raw data for visual appeal
        const rawHeight = dataArrayRef.current[i];
        const barHeight = (rawHeight / 255) * height * 0.8; 
        
        // Use the exact pink color from the EvalAI mockup
        ctx.fillStyle = '#E598A5';
        
        // Draw centered vertically like a waveform
        const y = height - barHeight;
        
        // Round corners by drawing a rounded rect
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 2, barHeight, 2);
        ctx.fill();
        
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    if (isRecording) {
      setupAudio();
    } else {
      // Draw flatline if not recording
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / 32) * 1.5;
        let x = 0;
        ctx.fillStyle = '#E598A5';
        for (let i = 0; i < 32; i++) {
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - 4, barWidth - 2, 4, 2);
          ctx.fill();
          x += barWidth;
        }
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={60} 
      style={{ width: '100%', height: '60px', opacity: isRecording ? 1 : 0.5 }} 
    />
  );
};

export default AudioVisualizer;
