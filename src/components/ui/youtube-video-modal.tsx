'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

// Helper function to extract YouTube video ID from various URL formats
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
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
};

export default function YouTubeVideoModal({ isOpen, onClose, videoUrl, title }: YouTubeVideoModalProps) {
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && videoUrl) {
      const id = getYouTubeVideoId(videoUrl);
      setVideoId(id);
    }
  }, [isOpen, videoUrl]);

  useEffect(() => {
    // Handle escape key press
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-5xl mx-4 sm:mx-6 lg:mx-8">
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Container */}
        <div className="bg-black overflow-hidden shadow-2xl">
          {title && (
            <div className="px-4 py-3 bg-black border-b border">
              <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
            </div>
          )}
          
          <div className="relative w-full">
            {/* Responsive aspect ratio container */}
            <div className="aspect-video w-full">
              {videoId ? (
                <iframe
                  src={getYouTubeEmbedUrl(videoId)}
                  title={title || 'Video Preview'}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <p className="text-white text-lg mb-2">Unable to load video</p>
                    <p className="text-gray-400 text-sm">Please check the video URL</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Additional close button at bottom */}
        <div className="mt-4 flex justify-center sm:hidden">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Close Video
          </Button>
        </div>
      </div>
    </div>
  );
}