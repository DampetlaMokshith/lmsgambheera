'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle, RotateCcw, Code, Palette, FileText, Hammer, Zap, Braces } from 'lucide-react';

// Dynamic import of Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// IDE Types
type IDEType = 'code' | 'civil' | 'electrical';
type FileType = 'html' | 'css' | 'javascript' | 'python';

// Default code templates
const defaultCode = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
</head>
<body>
    <div class="container">
        <h1>Hello World!</h1>
        <p>Welcome to the IDE! Start coding here...</p>
        <button onclick="showMessage()">Click me!</button>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`,
  css: `/* VS Code Style CSS */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    text-align: center;
    max-width: 500px;
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

h1 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 2.5rem;
}

p {
    color: #666;
    margin-bottom: 2rem;
    font-size: 1.1rem;
}

button {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

button:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}`,
  javascript: `// JavaScript IDE with Modern ES6+ Features
// Modern JavaScript Features
const greeting = (name = "Developer") => {
    return \`Hello, \${name}! Welcome to the JavaScript IDE! 🎉\`;
};
// Async/Await Example
const fetchData = async () => {
    try {
await new Promise(resolve => setTimeout(resolve, 1000));
        return { message: "Data fetched successfully!", status: 200 };
    } catch (error) {
}
};

// Array Methods & Destructuring
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
// Map, Filter, Reduce
const squared = numbers.map(n => n ** 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
// Object Methods
const person = {
    name: "John",
    age: 30,
    greet() {
        return \`Hi, I'm \${this.name} and I'm \${this.age} years old!\`;
    }
};
// Classes
class Calculator {
    constructor() {
        this.result = 0;
    }
    
    add(x) {
        this.result += x;
        return this;
    }
    
    multiply(x) {
        this.result *= x;
        return this;
    }
    
    getValue() {
        return this.result;
    }
}

const calc = new Calculator();
const result = calc.add(5).multiply(3).getValue();
// DOM Interaction (for HTML)
function showMessage() {
    alert("Hello from JavaScript! 👋");
}

// Modern Promise handling
fetchData().then(data => {
});
`,
  python: `# Python IDE with Skulpt
print("🚀 Welcome to Python IDE!")
print("=" * 30)

# Basic operations
name = "Coder"
age = 25
print(f"Hello {name}, you are {age} years old!")

# Math operations
x = 10
y = 20
print(f"Sum: {x} + {y} = {x + y}")
print(f"Product: {x} * {y} = {x * y}")

# Lists and loops
numbers = [1, 2, 3, 4, 5]
print(f"Numbers: {numbers}")

print("Squares:")
for num in numbers:
    print(f"{num}² = {num ** 2}")

# Functions
def greet(name):
    return f"Hello, {name}!"

print(greet("Python Developer"))

print("\\n✨ Ready to code! Edit this and click Run!")`,
};

interface WindowWithSkulpt extends Window {
  Sk?: {
    configure: (config: {
      output: (text: string) => void;
      read: (x: string) => string;
    }) => void;
    misceval: {
      asyncToPromise: (fn: () => unknown) => Promise<unknown>;
    };
    importMainWithBody: (name: string, dumpJS: boolean, body: string, canSuspend: boolean) => unknown;
    builtinFiles?: {
      files: { [key: string]: string };
    };
  };
}

export default function IDEPage() {
  const [currentIDE, setCurrentIDE] = useState<IDEType>('code');
  const [currentFile, setCurrentFile] = useState<FileType>('html');
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Save code to localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem('ide-code');
    if (savedCode) {
      try {
        setCode(JSON.parse(savedCode));
      } catch {
}
    }
  }, []);

  // Save code when it changes
  useEffect(() => {
    localStorage.setItem('ide-code', JSON.stringify(code));
  }, [code]);

  const updateCode = (fileType: FileType, value: string | undefined) => {
    if (value !== undefined) {
      setCode(prev => ({ ...prev, [fileType]: value }));
    }
  };

  const runCode = async () => {
    setIsLoading(true);
    setOutput('');

    if (currentFile === 'python') {
      runPython();
    } else if (currentFile === 'javascript') {
      runJavaScript();
    } else {
      runHTMLCSS();
    }

    setIsLoading(false);
  };

  const runPython = () => {
    if (typeof window !== 'undefined') {
      const windowWithSkulpt = window as WindowWithSkulpt;
      
      if (windowWithSkulpt.Sk) {
        windowWithSkulpt.Sk.configure({
          output: (text: string) => {
            setOutput(prev => prev + text);
          },
          read: (x: string) => {
            if (windowWithSkulpt.Sk?.builtinFiles === undefined || 
                windowWithSkulpt.Sk.builtinFiles.files[x] === undefined) {
              throw new Error("File not found: '" + x + "'");
            }
            return windowWithSkulpt.Sk.builtinFiles.files[x];
          }
        });

        windowWithSkulpt.Sk.misceval.asyncToPromise(() => {
          return windowWithSkulpt.Sk?.importMainWithBody("<stdin>", false, code.python, true);
        }).catch((err: Error) => {
          setOutput(prev => prev + `\nError: ${err.message}`);
        });
      } else {
        setOutput('Skulpt not loaded. Please refresh the page.');
      }
    }
  };

  const runJavaScript = () => {
    try {
      const logs: string[] = [];
      
      // Capture console output
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      // Execute JavaScript code
      const func = new Function(code.javascript);
      func();
      
      // Restore console.log
      console.log = originalLog;
      
      setOutput(logs.join('\n') || 'JavaScript executed successfully!');
    } catch (err) {
      setOutput(`Error: ${(err as Error).message}`);
    }
  };

  const runHTMLCSS = () => {
    const fullHTML = `
      <style>${code.css}</style>
      ${code.html}
      <script>
        ${code.javascript}
      </script>
    `;
    
    const iframe = document.getElementById('preview') as HTMLIFrameElement;
    if (iframe) {
      iframe.srcdoc = fullHTML;
      setOutput('HTML/CSS/JavaScript code executed successfully! Check the preview panel.');
    }
  };

  const resetCode = () => {
    setCode(defaultCode);
    setOutput('');
    localStorage.removeItem('ide-code');
  };

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case 'html': return <FileText className="w-4 h-4" />;
      case 'css': return <Palette className="w-4 h-4" />;
      case 'javascript': return <Braces className="w-4 h-4" />;
      case 'python': return <Code className="w-4 h-4" />;
    }
  };

  const getLanguageForMonaco = (fileType: FileType) => {
    switch (fileType) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'javascript': return 'javascript';
      case 'python': return 'python';
    }
  };

  const renderCodeIDE = () => (
    <>
      {/* File Tabs */}
      <div className="bg-[#252526] border-b border-[#3c3c3c] flex">
        {(['html', 'css', 'javascript', 'python'] as FileType[]).map((fileType) => (
          <button
            key={fileType}
            onClick={() => setCurrentFile(fileType)}
            className={`px-4 py-2 flex items-center gap-2 text-sm border-r border-[#3c3c3c] transition-colors cursor-pointer ${
              currentFile === fileType
                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#0078d4]'
                : 'bg-[#2d2d30] text-[#cccccc] hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            {getFileIcon(fileType)}
            {fileType.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Editor Panel */}
        <div className="flex-1 bg-[#1e1e1e] min-w-0">
          <Editor
            height="100%"
            language={getLanguageForMonaco(currentFile)}
            theme="vs-dark"
            value={code[currentFile]}
            onChange={(value) => updateCode(currentFile, value)}
            options={{
              fontSize: 14,
              fontFamily: 'Cascadia Code, JetBrains Mono, Fira Code, Consolas, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'line',
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
              cursorBlinking: 'blink',
              renderWhitespace: 'selection',
              renderControlCharacters: false,
              fontLigatures: true,
              contextmenu: true,
              mouseWheelZoom: true,
              smoothScrolling: true,
              cursorSmoothCaretAnimation: 'on',
              renderValidationDecorations: 'on',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
              },
            }}
          />
        </div>

        {/* Output/Preview Panel */}
        <div className="w-1/2 bg-[#252526] border-l border-[#3c3c3c] flex flex-col min-w-0">
          <div className="bg-[#2d2d30] px-4 py-2 border-b border-[#3c3c3c]">
            <h3 className="text-[#cccccc] text-sm font-medium">
              {currentFile === 'python' || currentFile === 'javascript' ? 'Console Output' : 'Live Preview'}
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto">
            {currentFile === 'python' || currentFile === 'javascript' ? (
              <div className="p-4 bg-[#1e1e1e]">
                <pre className="text-[#4ec9b0] font-mono text-sm whitespace-pre-wrap">
                  {output || `Click "Run Code" to execute ${currentFile === 'python' ? 'Python' : 'JavaScript'} code...`}
                </pre>
              </div>
            ) : (
              <iframe
                id="preview"
                className="w-full h-full border-none bg-white"
                title="HTML/CSS/JavaScript Preview"
                sandbox="allow-scripts"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderCivilIDE = () => (
    <div className="flex-1 bg-white">
      <iframe
        src="https://www.geogebra.org/3d"
        className="w-full h-full border-none"
        title="GeoGebra Calculator for Civil Engineering"
        allow="camera; microphone; geolocation"
      />
    </div>
  );

  const renderElectricalIDE = () => (
    <div className="flex-1 bg-white">
      <iframe
        src="https://www.circuitlab.com/editor/"
        className="w-full h-full border-none"
        title="CircuitLab for Electrical Engineering"
        allow="camera; microphone; geolocation"
      />
    </div>
  );

  return (
    <DashboardLayout fullscreen={true}>
      <div className="h-[calc(100vh-4rem)] bg-[#1e1e1e] flex flex-col">
        {/* IDE Selector and Controls */}
        <div className="bg-[#2d2d30] border-b border-[#3c3c3c] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={currentIDE} onValueChange={(value: IDEType) => setCurrentIDE(value)}>
              <SelectTrigger className="w-[200px] bg-[#3c3c3c] border-[#555] text-white hover:bg-[#464647]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252526] border-[#3c3c3c]">
                <SelectItem value="code" className="text-white hover:bg-[#2a2d2e] focus:bg-[#094771] focus:text-white">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Programming IDE
                  </div>
                </SelectItem>
                <SelectItem value="civil" className="text-white hover:bg-[#2a2d2e] focus:bg-[#094771] focus:text-white">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4" />
                    Civil Engineering
                  </div>
                </SelectItem>
                <SelectItem value="electrical" className="text-white hover:bg-[#2a2d2e] focus:bg-[#094771] focus:text-white">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Electrical Engineering
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {currentIDE === 'code' && (
            <div className="flex gap-2">
              <Button
                onClick={runCode}
                disabled={isLoading}
                className="bg-[#0e639c] hover:bg-[#1177bb] text-white border-[#0e639c]"
                size="sm"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {isLoading ? 'Running...' : 'Run Code'}
              </Button>
              <Button
                onClick={resetCode}
                variant="outline"
                size="sm"
                className="border-[#464647] text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* IDE Content */}
        {currentIDE === 'code' && renderCodeIDE()}
        {currentIDE === 'civil' && renderCivilIDE()}
        {currentIDE === 'electrical' && renderElectricalIDE()}
      </div>
    </DashboardLayout>
  );
}
