import { useState } from "react";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import { sampleWorkflows } from "@/data/sampleWorkflows";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WorkflowDemo = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(sampleWorkflows[0]);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">n8n Workflow Visualization Demo</h1>
            <p className="text-muted-foreground mt-1">
              Interactive workflow graphs powered by n8n-demo component
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workflow Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Workflows</CardTitle>
                <CardDescription>
                  Click to visualize different workflow patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleWorkflows.map((workflow, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedWorkflow(workflow)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWorkflow.name === workflow.name
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-foreground">
                        {workflow.name}
                      </h4>
                      {selectedWorkflow.name === workflow.name && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{workflow.nodes.length} nodes</span>
                      <span>•</span>
                      <span>{Object.keys(workflow.connections).length} connections</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Current Workflow Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Current Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground">{selectedWorkflow.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedWorkflow.nodes.length} nodes with {Object.keys(selectedWorkflow.connections).length} connections
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-foreground">Nodes:</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedWorkflow.nodes.map((node, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {node.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Visualization */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Workflow Visualization
                </CardTitle>
                <CardDescription>
                  Interactive n8n workflow graph - powered by n8n-demo component
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] p-0">
                <WorkflowCanvas workflow={selectedWorkflow} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How This Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">1. n8n-Demo Component</h4>
                <p className="text-muted-foreground">
                  Loads the official n8n-demo web component from CDN to render workflow graphs
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">2. Workflow Data</h4>
                <p className="text-muted-foreground">
                  Converts workflow data to n8n format with nodes and connections
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">3. Interactive Display</h4>
                <p className="text-muted-foreground">
                  Provides zoom, pan, and node interaction capabilities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowDemo;
