'use client';

import { useState } from 'react';
import { writeClient } from '@/sanity/lib/client';
import { Button } from '@/components/ui/button';

export function SanityTokenTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testTokenPermissions = async () => {
    setIsLoading(true);
    setTestResult('Testing Sanity API permissions...\n');
    
    try {
      // Test 1: Read permissions
      setTestResult(prev => prev + '✅ Testing read permissions...\n');
      const readTest = await writeClient.fetch('*[_type == "course"][0..2]');
      setTestResult(prev => prev + `✅ Read test passed. Found ${readTest.length} courses.\n`);
      
      // Test 2: Create permissions - create a test document
      setTestResult(prev => prev + '🔄 Testing create permissions...\n');
      const testDoc = await writeClient.create({
        _type: 'lecture',
        title: 'Token Test Lecture',
        description: 'This is a test document to verify create permissions',
        duration: 1,
        videoUrl: '',
        order: 999,
        isPreview: false,
        slug: {
          _type: 'slug',
          current: `token-test-${Date.now()}`
        }
      });
      setTestResult(prev => prev + `✅ Create test passed. Created document: ${testDoc._id}\n`);
      
      // Test 3: Update permissions - update the test document
      setTestResult(prev => prev + '🔄 Testing update permissions...\n');
      const updateResult = await writeClient
        .patch(testDoc._id)
        .set({ title: 'Updated Token Test Lecture' })
        .commit();
      setTestResult(prev => prev + `✅ Update test passed. Updated document: ${updateResult._id}\n`);
      
      // Test 4: Delete permissions - clean up test document
      setTestResult(prev => prev + '🔄 Testing delete permissions...\n');
      await writeClient.delete(testDoc._id);
      setTestResult(prev => prev + `✅ Delete test passed. Deleted test document.\n`);
      
      setTestResult(prev => prev + '\n🎉 All permission tests passed! Your Sanity API token is working correctly.\n');
      
    } catch (error: any) {
      console.error('Token test error:', error);
      setTestResult(prev => prev + `\n❌ Permission test failed:\n${error.message}\n`);
      
      if (error.message?.includes('permission')) {
        setTestResult(prev => prev + '\n💡 This indicates your API token lacks the required permissions.\n');
        setTestResult(prev => prev + '💡 Go to Sanity Studio → API → Tokens and ensure your token has "Editor" permissions.\n');
      } else if (error.message?.includes('unauthorized')) {
        setTestResult(prev => prev + '\n💡 This indicates authentication issues with your token.\n');
        setTestResult(prev => prev + '💡 Check your .env.local file and ensure tokens are correctly set.\n');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Sanity Token Permission Test</h2>
      <p className="text-sm text-gray-600 mb-4">
        This tool tests if your Sanity API token has the required permissions for create, read, update, and delete operations.
      </p>
      
      <Button 
        onClick={testTokenPermissions} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Token Permissions'}
      </Button>
      
      {testResult && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Test Results:</h3>
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
}