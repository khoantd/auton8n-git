import { N8nWorkflow } from '../types';

export const sampleWorkflows: N8nWorkflow[] = [
  {
    name: "Simple HTTP Request Workflow",
    nodes: [
      {
        id: "1",
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [240, 300],
        parameters: {}
      },
      {
        id: "2", 
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          url: "https://api.github.com/users/n8n-io",
          method: "GET"
        }
      },
      {
        id: "3",
        name: "Set",
        type: "n8n-nodes-base.set",
        typeVersion: 1,
        position: [680, 300],
        parameters: {
          values: {
            string: [
              {
                name: "username",
                value: "={{ $json.login }}"
              }
            ]
          }
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
              node: "Set",
              type: "main", 
              index: 0
            }
          ]
        ]
      }
    }
  },
  {
    name: "Data Processing Pipeline",
    nodes: [
      {
        id: "1",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 200],
        parameters: {
          httpMethod: "POST",
          path: "data"
        }
      },
      {
        id: "2",
        name: "Code",
        type: "n8n-nodes-base.code",
        typeVersion: 1,
        position: [460, 200],
        parameters: {
          code: "// Process incoming data\nreturn items.map(item => {\n  return {\n    json: {\n      ...item.json,\n      processed: true,\n      timestamp: new Date().toISOString()\n    }\n  };\n});"
        }
      },
      {
        id: "3",
        name: "IF",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [680, 200],
        parameters: {
          conditions: {
            string: [
              {
                value1: "={{ $json.processed }}",
                operation: "equal",
                value2: true
              }
            ]
          }
        }
      },
      {
        id: "4",
        name: "Send Email",
        type: "n8n-nodes-base.emailSend",
        typeVersion: 1,
        position: [900, 120],
        parameters: {
          toEmail: "test@example.com",
          subject: "Data Processed Successfully",
          text: "Data has been processed: {{ $json }}"
        }
      },
      {
        id: "5",
        name: "Error Handler",
        type: "n8n-nodes-base.noOp",
        typeVersion: 1,
        position: [900, 280],
        parameters: {}
      }
    ],
    connections: {
      "Webhook": {
        main: [
          [
            {
              node: "Code",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Code": {
        main: [
          [
            {
              node: "IF",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "IF": {
        main: [
          [
            {
              node: "Send Email",
              type: "main",
              index: 0
            }
          ],
          [
            {
              node: "Error Handler",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    }
  },
  {
    name: "Database Sync Workflow",
    nodes: [
      {
        id: "1",
        name: "Cron",
        type: "n8n-nodes-base.cron",
        typeVersion: 1,
        position: [240, 300],
        parameters: {
          cronExpression: "0 0 * * *"
        }
      },
      {
        id: "2",
        name: "MySQL",
        type: "n8n-nodes-base.mysql",
        typeVersion: 1,
        position: [460, 300],
        parameters: {
          operation: "executeQuery",
          query: "SELECT * FROM users WHERE updated_at > '{{ $now }}'"
        }
      },
      {
        id: "3",
        name: "Merge",
        type: "n8n-nodes-base.merge",
        typeVersion: 1,
        position: [680, 300],
        parameters: {
          mode: "combine",
          combineBy: "combineAll"
        }
      },
      {
        id: "4",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 1,
        position: [900, 300],
        parameters: {
          url: "https://api.external-service.com/sync",
          method: "POST",
          bodyParameters: {
            data: "={{ $json }}"
          }
        }
      }
    ],
    connections: {
      "Cron": {
        main: [
          [
            {
              node: "MySQL",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "MySQL": {
        main: [
          [
            {
              node: "Merge",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Merge": {
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
  }
];
