'use client';

import { useEffect, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

// Helper function to detect if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url);
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
};

// Helper function to detect other video platforms
const isVimeoUrl = (url: string): boolean => {
  return /vimeo\.com/.test(url);
};

const getVimeoVideoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

const getVimeoEmbedUrl = (videoId: string): string => {
  return `https://player.vimeo.com/video/${videoId}?h=0&title=0&byline=0&portrait=0`;
};

export default function VideoPlayer({ videoUrl, title, className = "" }: VideoPlayerProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'youtube' | 'vimeo' | 'direct'>('direct');

  useEffect(() => {
    if (isYouTubeUrl(videoUrl)) {
      const id = getYouTubeVideoId(videoUrl);
      setVideoId(id);
      setPlatform('youtube');
    } else if (isVimeoUrl(videoUrl)) {
      const id = getVimeoVideoId(videoUrl);
      setVideoId(id);
      setPlatform('vimeo');
    } else {
      setPlatform('direct');
    }
  }, [videoUrl]);

  // YouTube Player
  if (platform === 'youtube' && videoId) {
    return (
      <div className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={getYouTubeEmbedUrl(videoId)}
          title={title || 'Video'}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Vimeo Player
  if (platform === 'vimeo' && videoId) {
    return (
      <div className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={getVimeoEmbedUrl(videoId)}
          title={title || 'Video'}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct Video File
  return (
    <div className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <video
        controls
        className="w-full h-full"
        src={videoUrl}
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}