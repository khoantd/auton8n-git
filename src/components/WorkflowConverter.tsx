import React, { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useToast } from '@/hooks/use-toast';
import { convertWorkflow, validateWorkflow, type ConversionResult, type ConversionOptions } from '@/utils/workflowConverter';

interface WorkflowConverterProps {
  onWorkflowConverted?: (workflow: any) => void;
}

export const WorkflowConverter: React.FC<WorkflowConverterProps> = ({ onWorkflowConverted }) => {
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>({
    preserveIds: true,
    updateTypeVersions: true,
    addMetadata: true,
  });
  const { toast } = useToast();

  const handleConvert = useCallback(() => {
    if (!inputJson.trim()) {
      toast({
        title: 'Error',
        description: 'Please input a workflow JSON to convert',
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true);
    
    try {
      const workflowData = JSON.parse(inputJson);
      const result = convertWorkflow(workflowData, options);
      
      setConversionResult(result);
      
      if (result.success && result.convertedWorkflow) {
        const validation = validateWorkflow(result.convertedWorkflow);
        
        if (validation.valid) {
          setOutputJson(JSON.stringify(result.convertedWorkflow, null, 2));
          toast({
            title: 'Success',
            description: 'Workflow converted successfully',
          });
          
          if (onWorkflowConverted) {
            onWorkflowConverted(result.convertedWorkflow);
          }
        } else {
          setOutputJson(JSON.stringify(result.convertedWorkflow, null, 2));
          toast({
            title: 'Conversion completed with warnings',
            description: `Workflow converted but has ${validation.errors.length} validation errors`,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Conversion failed',
          description: result.errors?.join(', ') || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please check your input JSON format',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  }, [inputJson, options, toast, onWorkflowConverted]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputJson(content);
    };
    reader.readAsText(file);
  }, []);

  const handleDownload = useCallback(() => {
    if (!outputJson) return;

    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-workflow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [outputJson]);

  const handleSampleInput = useCallback(() => {
    const sampleWorkflow = {
      name: "Sample Legacy Workflow",
      nodes: [
        {
          id: "1",
          name: "Manual Trigger",
          type: "manualTrigger",
          typeVersion: 1,
          position: [240, 300],
          parameters: {}
        },
        {
          id: "2", 
          name: "HTTP Request",
          type: "httpRequest",
          typeVersion: 1,
          position: [460, 300],
          parameters: {
            url: "https://api.github.com/users/n8n-io",
            method: "GET"
          }
        }
      ],
      connections: {
        "Manual Trigger": {
          main: [
            [
              {
                node: "HTTP Request",
                type: "main",
                index: 0
              }
            ]
          ]
        }
      }
    };
    
    setInputJson(JSON.stringify(sampleWorkflow, null, 2));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">n8n Workflow Converter</h1>
        <p className="text-gray-600">Convert legacy workflows to the latest n8n format</p>
      </div>

      {/* Conversion Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Conversion Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="preserve-ids">Preserve original node IDs</Label>
            <Switch
              id="preserve-ids"
              checked={options.preserveIds}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, preserveIds: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="update-versions">Update node type versions</Label>
            <Switch
              id="update-versions"
              checked={options.updateTypeVersions}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, updateTypeVersions: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="add-metadata">Add workflow metadata</Label>
            <Switch
              id="add-metadata"
              checked={options.addMetadata}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, addMetadata: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Input Workflow
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSampleInput}>
                Load Sample
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Upload File
                  <input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your workflow JSON here or upload a file..."
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleConvert} 
          disabled={isConverting || !inputJson.trim()}
          size="lg"
          className="px-8"
        >
          {isConverting ? 'Converting...' : 'Convert Workflow'}
        </Button>
      </div>

      {/* Results Section */}
      {conversionResult && (
        <div className="space-y-4">
          {/* Conversion Status */}
          {conversionResult.success ? (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Workflow converted successfully!
                {conversionResult.warnings && conversionResult.warnings.length > 0 && (
                  <span className="ml-2">
                    {conversionResult.warnings.length} warnings generated.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Conversion failed: {conversionResult.errors?.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {conversionResult.warnings && conversionResult.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <strong>Warnings:</strong>
                  {conversionResult.warnings.map((warning, index) => (
                    <div key={index} className="text-sm">• {warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Output Section */}
          {outputJson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Converted Workflow
                  </span>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    Download JSON
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={outputJson}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
