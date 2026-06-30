import React, { useState } from 'react';
import { runValidationTests } from '../lib/testing/validationRunner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ValidationTests() {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    try {
      const res = await runValidationTests();
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = results.filter(r => r.status === 'PASS').length;
  const totalCount = results.length;

  return (
    <div className="container mx-auto p-8 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
              ← Back to Transformer
            </a>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Validation Tests</h1>
          <p className="text-muted-foreground mt-2">
            Verify the transformation pipeline against expected canonical profiles and edge cases.
          </p>
        </div>
        <Button onClick={handleRunTests} disabled={isRunning} size="lg">
          {isRunning ? 'Running Tests...' : 'Run Validation Tests'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((test, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-medium">{test.name}</CardTitle>
                <Badge variant={test.status === 'PASS' ? 'default' : 'destructive'} 
                       className={test.status === 'PASS' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                  {test.status === 'PASS' ? '✔ PASS' : '✖ FAIL'}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <span className="font-semibold text-muted-foreground">Input:</span>
                  <span className="font-mono bg-muted p-1 rounded max-w-max">{test.inputSummary}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <span className="font-semibold text-muted-foreground">Expected:</span>
                  <span className="text-foreground">{test.expectedResult}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <span className="font-semibold text-muted-foreground">Actual:</span>
                  <span className={test.status === 'PASS' ? 'text-green-500' : 'text-red-500'}>
                    {test.actualResult}
                  </span>
                </div>
                {test.error && (
                  <div className="mt-2 p-3 bg-red-950/30 text-red-400 rounded-md border border-red-900/50 whitespace-pre-wrap font-mono text-xs">
                    {test.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Card className="bg-muted/30 border-muted">
            <CardContent className="pt-6 pb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Validation Summary</h2>
              <div className="flex items-center justify-center gap-3 text-lg">
                <span className={passedCount === totalCount ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                  {passedCount} / {totalCount}
                </span>
                <span>Tests Passed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
