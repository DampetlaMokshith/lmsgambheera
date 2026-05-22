"use client";
import { Tooltip } from "@/components/ui/tooltip-card";
import React from "react";

interface CourseDescriptionTooltipProps {
  description: string;
}

export function CourseDescriptionTooltip({ description }: CourseDescriptionTooltipProps) {
  // Define key terms and their explanations that might appear in course descriptions
  const keyTerms: Record<string, string> = {
    "Very Large Scale Integration": "Very Large Scale Integration (VLSI) is the process of creating integrated circuits by combining thousands or millions of transistors into a single chip.",
    "VLSI": "Very Large Scale Integration (VLSI) is the process of creating integrated circuits by combining thousands or millions of transistors into a single chip.",
    "integrated circuits": "Integrated circuits (ICs) are electronic circuits formed on a small piece of semiconductor material, typically silicon, containing multiple interconnected components.",
    "semiconductor device": "A semiconductor device is an electronic component made from semiconductor materials that can control the flow of electrical current, including transistors and diodes.",
    "semiconductor devices": "Semiconductor devices are electronic components made from semiconductor materials that can control the flow of electrical current, including transistors and diodes.",
    "modern fabrication processes": "Modern fabrication processes refer to advanced manufacturing techniques used to create integrated circuits and microchips at nanometer scales.",
    "advanced digital design techniques": "Advanced digital design techniques involve sophisticated methods for creating complex digital circuits, including VLSI design and hardware description languages.",
    "advanced digital design": "Advanced digital design techniques involve sophisticated methods for creating complex digital circuits, including VLSI design and hardware description languages.",
    "microelectronics": "Microelectronics is the study and manufacture of very small electronic components and circuits, typically measured in micrometers or nanometers.",
    "Next.js": "Next.js is a React framework that provides features like server-side rendering, static site generation, and API routes for building production-ready web applications.",
    "React": "React is a popular JavaScript library for building user interfaces, developed by Facebook. It uses a component-based architecture for creating interactive UIs.",
    "SSR": "Server-Side Rendering (SSR) is a technique where web pages are generated on the server and sent to the client, improving initial load performance and SEO.",
    "Server-Side Rendering": "Server-Side Rendering (SSR) is a technique where web pages are generated on the server and sent to the client, improving initial load performance and SEO.",
    "SSG": "Static Site Generation (SSG) is a method of pre-rendering pages at build time, resulting in fast-loading static HTML files that can be served from a CDN.",
    "Static Site Generation": "Static Site Generation (SSG) is a method of pre-rendering pages at build time, resulting in fast-loading static HTML files that can be served from a CDN.",
    "API routes": "API routes allow you to build API endpoints directly within your Next.js application, enabling backend functionality without a separate server.",
    "middleware": "Middleware is code that runs before a request is completed, allowing you to modify responses, redirect, or rewrite URLs based on incoming requests.",
    "file-based routing": "File-based routing is a routing system where the file structure of your project determines the URL structure of your application automatically.",
    "App Router": "The App Router is Next.js's new routing system that supports React Server Components, nested layouts, and advanced routing patterns.",
    "Pages Router": "The Pages Router is Next.js's original routing system based on the pages directory, providing simple file-based routing for applications.",
    "signals": "Signals are a reactive primitive used in modern frameworks for state management, automatically tracking dependencies and triggering updates when values change.",
    "discrete-time signals": "Discrete-time signals are signals defined only at discrete time intervals, commonly used in digital signal processing and computer systems.",
    "continuous signals": "Continuous signals are signals defined at every instant in time, representing analog information that varies smoothly without interruption.",
    "power plants": "Power plants are industrial facilities that generate electricity by converting various energy sources (coal, nuclear, hydro, solar, wind) into electrical power.",
    "macroscopic engines": "Macroscopic engines are large-scale thermal engines that convert heat energy into mechanical work, such as internal combustion engines and steam turbines.",
    "microscopic particles": "Microscopic particles are extremely small particles that can only be observed through microscopes, including atoms, molecules, and subatomic particles.",
    "Thermodynamics": "Thermodynamics is the branch of physics that deals with heat, work, temperature, and the laws governing energy transformations in systems.",
    "advanced mix design": "Advanced mix design refers to sophisticated techniques for formulating concrete mixtures to achieve specific strength, durability, and performance characteristics.",
    "modern infrastructure": "Modern infrastructure encompasses contemporary systems and facilities including transportation networks, utilities, communication systems, and smart city technologies.",
    "filters": "Filters are electronic or digital systems that allow certain frequencies or signals to pass while blocking others, essential in signal processing and data analysis.",
    "digital logic design": "Digital logic design is the process of creating circuits that perform logical operations using binary values, forming the foundation of modern computers.",
    "transistors": "Transistors are semiconductor devices that can amplify or switch electronic signals, serving as the fundamental building blocks of modern electronic devices.",
  };

  // Function to detect and wrap key terms with tooltips
  const renderDescriptionWithTooltips = (text: string) => {
    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = Object.keys(keyTerms).sort((a, b) => b.length - a.length);
    
    const parts: React.ReactNode[] = [];
    let remainingText = text;
    let keyCounter = 0;
    const wrappedTerms = new Set<string>(); // Track terms that have been wrapped

    while (remainingText.length > 0) {
      let foundTerm = false;
      let earliestMatch: { term: string; index: number; matchedText: string } | null = null;

      // Find the earliest matching term in the remaining text
      for (const term of sortedTerms) {
        // Skip if this term has already been wrapped
        const normalizedTerm = term.toLowerCase();
        if (wrappedTerms.has(normalizedTerm)) {
          continue;
        }

        // Escape special regex characters in the term
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
        const match = remainingText.match(regex);

        if (match && match.index !== undefined) {
          if (!earliestMatch || match.index < earliestMatch.index) {
            earliestMatch = {
              term,
              index: match.index,
              matchedText: match[0]
            };
          }
        }
      }

      if (earliestMatch) {
        // Add text before the term
        if (earliestMatch.index > 0) {
          parts.push(remainingText.substring(0, earliestMatch.index));
        }

        // Mark this term as wrapped (normalize to lowercase for comparison)
        wrappedTerms.add(earliestMatch.term.toLowerCase());

        // Add the term with tooltip
        parts.push(
          <Tooltip
            key={`tooltip-${keyCounter++}`}
            containerClassName="text-gray-300"
            content={keyTerms[earliestMatch.term]}
          >
            <span className="cursor-pointer font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              {earliestMatch.matchedText}
            </span>
          </Tooltip>
        );

        // Update remaining text
        remainingText = remainingText.substring(earliestMatch.index + earliestMatch.matchedText.length);
        foundTerm = true;
      }

      if (!foundTerm) {
        // No more terms found, add remaining text
        parts.push(remainingText);
        break;
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold text-white">Description</h3>
      <div className="text-gray-300 text-base leading-relaxed">
        {renderDescriptionWithTooltips(description)}
      </div>
    </div>
  );
}
