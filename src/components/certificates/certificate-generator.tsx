'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface CertificateGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  courseName: string;
  completionDate: string;
}

export default function CertificateGenerator({
  open,
  onOpenChange,
  studentName,
  courseName,
  completionDate,
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  // Helper function to inline all computed styles to avoid lab() color parsing
  const inlineAllComputedStyles = (node: HTMLElement) => {
    const win = window;
    const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
    const nodes: HTMLElement[] = [node];
    let cur = treeWalker.nextNode();
    while (cur) {
      nodes.push(cur as HTMLElement);
      cur = treeWalker.nextNode();
    }

    nodes.forEach((el) => {
      const cs = win.getComputedStyle(el);
      // Copy computed styles to inline styles (converts lab() to rgb())
      const propsToCopy = [
        'color', 'background-color', 'background', 'background-image',
        'font-family', 'font-size', 'font-weight', 'line-height',
        'padding', 'margin', 'border', 'border-radius', 'border-color',
        'border-width', 'border-style', 'border-left', 'border-right',
        'border-top', 'border-bottom', 'width', 'height', 'box-shadow',
        'display', 'text-align', 'vertical-align', 'justify-content',
        'align-items', 'transform', 'opacity', 'letter-spacing',
        'text-transform', 'flex', 'flex-direction', 'gap', 'position',
        'top', 'left', 'right', 'bottom', 'z-index', 'overflow'
      ];

      const styleTextParts: string[] = [];
      propsToCopy.forEach((prop) => {
        try {
          const v = cs.getPropertyValue(prop);
          if (v) styleTextParts.push(`${prop}: ${v};`);
        } catch {
          // ignore unsupported properties
        }
      });

      el.setAttribute('style', (el.getAttribute('style') || '') + ' ' + styleTextParts.join(' '));
    });
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      // Dynamically import libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Clone the certificate element to avoid mutating the visible UI
      const original = certificateRef.current;
      const clone = original.cloneNode(true) as HTMLElement;

      // Position clone off-screen so fonts/images can load properly
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.zIndex = '-1000';
      document.body.appendChild(clone);

      // Inline all computed styles (converts lab() to rgb())
      inlineAllComputedStyles(clone);

      // Render cloned certificate to canvas
      const canvas = await html2canvas(clone, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        removeContainer: true,
      });

      // Convert canvas to high-quality image
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Create PDF in landscape A4 format
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add image to PDF with proper dimensions
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Download PDF
      const fileName = `${courseName.replace(/[^a-zA-Z0-9\s]/g, '_')}_Certificate.pdf`;
      pdf.save(fileName);

      // Cleanup - remove cloned element
      document.body.removeChild(clone);
    } catch (error) {
alert('Failed to generate certificate. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl -p-4 bg-black border-gray-800">
        <VisuallyHidden>
          <DialogTitle>Certificate of Completion</DialogTitle>
        </VisuallyHidden>
        
        <div className="overflow-hidden">
          {/* Certificate Design */}
          <div
            ref={certificateRef}
            className="relative w-full aspect-[1.414/1] p-8 overflow-hidden"
            style={{
              fontFamily: 'Georgia, serif',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Decorative Border */}
            <div className="absolute inset-3 rounded-sm" style={{ border: '8px double #1e3a8a', borderStyle: 'double' }}>
              <div className="absolute inset-1.5 rounded-sm" style={{ border: '2px solid #2563eb' }}></div>
            </div>

            {/* Top Left Accent */}
            <div className="absolute top-0 left-0 w-40 h-40">
              <div className="absolute top-3 left-3 w-28 h-28 rounded-tl-lg" style={{ borderLeft: '8px solid #1e3a8a', borderTop: '8px solid #1e3a8a' }}></div>
              <div className="absolute top-6 left-6 w-20 h-20" style={{ borderLeft: '4px solid #FBBF24', borderTop: '4px solid #FBBF24' }}></div>
            </div>

            {/* Top Right Accent */}
            <div className="absolute top-0 right-0 w-40 h-40">
              <div className="absolute top-3 right-3 w-28 h-28 rounded-tr-lg" style={{ borderRight: '8px solid #1e3a8a', borderTop: '8px solid #1e3a8a' }}></div>
              <div className="absolute top-6 right-6 w-20 h-20" style={{ borderRight: '4px solid #FBBF24', borderTop: '4px solid #FBBF24' }}></div>
            </div>

            {/* Bottom Left Accent */}
            <div className="absolute bottom-0 left-0 w-40 h-40">
              <div className="absolute bottom-3 left-3 w-28 h-28 rounded-bl-lg" style={{ borderLeft: '8px solid #1e3a8a', borderBottom: '8px solid #1e3a8a' }}></div>
              <div className="absolute bottom-6 left-6 w-20 h-20" style={{ borderLeft: '4px solid #FBBF24', borderBottom: '4px solid #FBBF24' }}></div>
            </div>

            {/* Bottom Right Accent */}
            <div className="absolute bottom-0 right-0 w-40 h-40">
              <div className="absolute bottom-3 right-3 w-28 h-28 rounded-br-lg" style={{ borderRight: '8px solid #1e3a8a', borderBottom: '8px solid #1e3a8a' }}></div>
              <div className="absolute bottom-6 right-6 w-20 h-20" style={{ borderRight: '4px solid #FBBF24', borderBottom: '4px solid #FBBF24' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
              {/* Logo/Branding */}
              <div className="space-y-1.5">
                <h1 className="text-4xl font-bold" style={{ letterSpacing: '0.1em', color: '#1e3a8a' }}>
                  CERTIFICATE
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-0.5" style={{ backgroundColor: '#FBBF24' }}></div>
                  <p className="text-base font-semibold tracking-wider" style={{ color: '#374151' }}>
                    OF COMPLETIION
                  </p>
                  <div className="w-6 h-0.5" style={{ backgroundColor: '#FBBF24' }}></div>
                </div>
              </div>

              {/* Presented To */}
              <div className="space-y-1.5">
                <p className="text-xs tracking-widest uppercase" style={{ color: '#4b5563' }}>
                  This certificate is proudly presented to
                </p>
                <h2 className="text-4xl font-bold" style={{ fontFamily: "'Lucida Handwriting', 'Brush Script MT', cursive", fontWeight: 600, color: '#111827' }}>
                  {studentName}
                </h2>
                <div className="w-56 h-0.5 mx-auto" style={{ background: 'linear-gradient(to right, rgba(156, 163, 175, 0), rgba(156, 163, 175, 1), rgba(156, 163, 175, 0))' }}></div>
              </div>

              {/* Course Details */}
              <div className="space-y-2 max-w-xl px-4">
                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  For successfully completing the comprehensive course
                </p>
                <h3 className="text-xl font-bold" style={{ color: '#1e3a8a' }}>
                  {courseName}
                </h3>
                <p className="text-xs" style={{ color: '#4b5563' }}>
                  demonstrating exceptional dedication, knowledge acquisition, and mastery of the subject matter
                </p>
              </div>

              {/* Badge/Seal */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)', border: '4px solid #1e3a8a' }}>
                  <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center" style={{ backgroundColor: '#ffffff', border: '2px solid #FBBF24' }}>
                    <span className="text-[0.6rem] font-bold" style={{ color: '#1e3a8a' }}>CERTIFIED</span>
                    <span className="text-[0.6rem] font-bold" style={{ color: '#D97706' }}>GRADUATE</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between w-full max-w-2xl pt-4">
                <div className="flex-1 text-center">
                  <div className="w-32 h-0.5 mx-auto mb-1.5" style={{ backgroundColor: '#9ca3af' }}></div>
                  <p className="text-xs font-semibold" style={{ color: '#374151' }}>Date</p>
                  <p className="text-[0.65rem]" style={{ color: '#4b5563' }}>{new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Arial, sans-serif', color: '#1e3a8a' }}>
                      Thread LMS
                    </div>
                    <p className="text-[0.65rem] tracking-wider" style={{ color: '#4b5563' }}>LEARNING MANAGEMENT SYSTEM</p>
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-32 h-0.5 mx-auto mb-1.5" style={{ backgroundColor: '#9ca3af' }}></div>
                  <p className="text-xs font-semibold" style={{ color: '#374151' }}>Authorized Signature</p>
                  <p className="text-[0.65rem]" style={{ color: '#4b5563' }}>Director of Education</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
