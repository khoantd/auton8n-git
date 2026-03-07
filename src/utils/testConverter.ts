import { convertWorkflow, validateWorkflow } from './workflowConverter';
import { sampleWorkflows } from '@/data/sampleWorkflows';

// Test the converter with sample workflows
export function testConverter() {
  console.log('Testing workflow converter...');
  
  // Test with sample workflows
  sampleWorkflows.forEach((workflow, index) => {
    console.log(`\n=== Testing Sample Workflow ${index + 1}: ${workflow.name} ===`);
    
    const result = convertWorkflow(workflow, {
      preserveIds: true,
      updateTypeVersions: true,
      addMetadata: true,
    });
    
    console.log('Conversion Result:', {
      success: result.success,
      errors: result.errors,
      warnings: result.warnings,
    });
    
    if (result.success && result.convertedWorkflow) {
      const validation = validateWorkflow(result.convertedWorkflow);
      console.log('Validation Result:', {
        valid: validation.valid,
        errors: validation.errors,
      });
      
      console.log('Converted nodes count:', result.convertedWorkflow.nodes.length);
      console.log('Converted connections count:', Object.keys(result.convertedWorkflow.connections).length);
    }
  });
  
  // Test with a legacy format workflow
  console.log('\n=== Testing Legacy Format Workflow ===');
  
  const legacyWorkflow = {
    name: "Legacy Test Workflow",
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
          url: "https://api.example.com",
          method: "GET"
        }
      },
      {
        id: "3",
        name: "Code",
        type: "code",
        typeVersion: 1,
        position: [680, 300],
        parameters: {
          code: "return items;"
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
      },
      "HTTP Request": {
        main: [
          [
            {
              node: "Code",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    }
  };
  
  const legacyResult = convertWorkflow(legacyWorkflow, {
    preserveIds: false,
    updateTypeVersions: true,
    addMetadata: true,
  });
  
  console.log('Legacy Conversion Result:', {
    success: legacyResult.success,
    errors: legacyResult.errors,
    warnings: legacyResult.warnings,
  });
  
  if (legacyResult.success && legacyResult.convertedWorkflow) {
    console.log('Converted node types:', legacyResult.convertedWorkflow.nodes.map(n => ({
      name: n.name,
      type: n.type,
      typeVersion: n.typeVersion
    })));
    
    const validation = validateWorkflow(legacyResult.convertedWorkflow);
    console.log('Legacy Validation Result:', {
      valid: validation.valid,
      errors: validation.errors,
    });
  }
  
  console.log('\n=== Test Complete ===');
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testConverter = testConverter;
}
