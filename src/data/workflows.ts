import type { Workflow } from "@/components/WorkflowCard";

export const workflows: Workflow[] = [
  {
    id: "1",
    title: "Build Your First AI Agent",
    description: "Create an intelligent AI agent that can understand context, make decisions, and execute tasks autonomously.",
    author: {
      name: "Lucas Peyrin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
    },
    category: "AI",
    integrations: ["OpenAI", "Webhook", "HTTP"],
    views: 12500,
    featured: true,
    workflowJson: JSON.stringify({
      "nodes": [
        {
          "id": "webhook-trigger",
          "name": "Webhook Trigger",
          "type": "n8n-nodes-base.webhook",
          "position": [250, 300],
          "parameters": {
            "httpMethod": "POST",
            "path": "ai-agent"
          }
        },
        {
          "id": "extract-query",
          "name": "Extract User Query",
          "type": "n8n-nodes-base.set",
          "position": [450, 300],
          "parameters": {
            "values": {
              "string": [
                {
                  "name": "query",
                  "value": "={{$json.body.query}}"
                }
              ]
            }
          }
        },
        {
          "id": "ai-agent",
          "name": "AI Agent",
          "type": "n8n-nodes-base.openAi",
          "position": [650, 300],
          "parameters": {
            "operation": "chat",
            "model": "gpt-4",
            "messages": {
              "values": [
                {
                  "role": "system",
                  "content": "You are an intelligent AI agent that can analyze requests and execute tasks autonomously."
                },
                {
                  "role": "user",
                  "content": "={{$json.query}}"
                }
              ]
            }
          }
        },
        {
          "id": "format-response",
          "name": "Format Response",
          "type": "n8n-nodes-base.set",
          "position": [850, 300],
          "parameters": {
            "values": {
              "string": [
                {
                  "name": "response",
                  "value": "={{$json.choices[0].message.content}}"
                },
                {
                  "name": "timestamp",
                  "value": "={{$now.toISO()}}"
                }
              ]
            }
          }
        },
        {
          "id": "send-response",
          "name": "Send Response",
          "type": "n8n-nodes-base.respondToWebhook",
          "position": [1050, 300],
          "parameters": {
            "respondWith": "json",
            "responseBody": "={{$json}}"
          }
        }
      ],
      "connections": {
        "Webhook Trigger": {
          "main": [[{ "node": "Extract User Query", "type": "main", "index": 0 }]]
        },
        "Extract User Query": {
          "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
        },
        "AI Agent": {
          "main": [[{ "node": "Format Response", "type": "main", "index": 0 }]]
        },
        "Format Response": {
          "main": [[{ "node": "Send Response", "type": "main", "index": 0 }]]
        }
      }
    }),
    instructions: `This workflow demonstrates how to build a simple AI agent that receives requests via webhook and responds intelligently.<br/><br/>

<strong>Setup:</strong><br/>
1. Activate the workflow to get your webhook URL<br/>
2. Add your OpenAI API key in credentials<br/>
3. Send a POST request to test:<br/>
<code>curl -X POST [your-webhook-url] -H "Content-Type: application/json" -d '{"query": "Hello AI!"}'</code><br/><br/>

<strong>What it does:</strong><br/>
• Receives user queries via HTTP webhook<br/>
• Processes with GPT-4<br/>
• Returns intelligent responses in JSON format`
  },
  {
    id: "2",
    title: "Personal Life Manager with Telegram & Voice-Enabled AI",
    description: "Manage your personal life with an AI assistant connected to Telegram, Google Services, and voice commands.",
    author: {
      name: "Derek Cheung",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Derek",
    },
    category: "AI",
    integrations: ["OpenAI", "Google Sheets", "Slack", "Webhook", "Gmail", "Google Calendar"],
    views: 8900,
    isPro: true,
    price: 19.99,
    workflowJson: JSON.stringify({
      "nodes": [
        {
          "id": "telegram-trigger",
          "name": "Telegram Trigger",
          "type": "n8n-nodes-base.telegramTrigger",
          "position": [250, 300],
          "parameters": {
            "updates": ["message"]
          }
        },
        {
          "id": "check-voice",
          "name": "Check if Voice",
          "type": "n8n-nodes-base.if",
          "position": [450, 300],
          "parameters": {
            "conditions": {
              "string": [
                {
                  "value1": "={{$json.message.voice}}",
                  "operation": "isNotEmpty"
                }
              ]
            }
          }
        },
        {
          "id": "get-voice-file",
          "name": "Get Voice File",
          "type": "n8n-nodes-base.telegram",
          "position": [650, 200],
          "parameters": {
            "operation": "getFile",
            "fileId": "={{$json.message.voice.file_id}}"
          }
        },
        {
          "id": "transcribe-voice",
          "name": "OpenAI Transcribe",
          "type": "n8n-nodes-base.openAi",
          "position": [850, 200],
          "parameters": {
            "operation": "transcribe",
            "model": "whisper-1"
          }
        },
        {
          "id": "merge-text",
          "name": "Merge Text Input",
          "type": "n8n-nodes-base.merge",
          "position": [1050, 300],
          "parameters": {
            "mode": "combine",
            "mergeByFields": {
              "values": [
                {
                  "field1": "text",
                  "field2": "text"
                }
              ]
            }
          }
        },
        {
          "id": "ai-assistant",
          "name": "AI Assistant Jackie",
          "type": "n8n-nodes-base.openAi",
          "position": [1250, 300],
          "parameters": {
            "operation": "chat",
            "model": "gpt-4",
            "messages": {
              "values": [
                {
                  "role": "system",
                  "content": "You are Jackie, a helpful AI assistant that can check emails, calendar, and manage tasks."
                },
                {
                  "role": "user",
                  "content": "={{$json.text}}"
                }
              ]
            },
            "options": {
              "temperature": 0.7
            }
          }
        },
        {
          "id": "get-emails",
          "name": "Get Unread Emails",
          "type": "n8n-nodes-base.gmail",
          "position": [1450, 200],
          "parameters": {
            "operation": "getAll",
            "filters": {
              "labelIds": ["UNREAD"],
              "maxResults": 10
            }
          }
        },
        {
          "id": "get-calendar",
          "name": "Get Calendar Events",
          "type": "n8n-nodes-base.googleCalendar",
          "position": [1450, 300],
          "parameters": {
            "operation": "getAll",
            "timeMin": "={{$now.toISO()}}",
            "timeMax": "={{$now.plus({days: 7}).toISO()}}"
          }
        },
        {
          "id": "get-tasks",
          "name": "Get Google Tasks",
          "type": "n8n-nodes-base.googleTasks",
          "position": [1450, 400],
          "parameters": {
            "operation": "getAll"
          }
        },
        {
          "id": "send-response",
          "name": "Send to Telegram",
          "type": "n8n-nodes-base.telegram",
          "position": [1650, 300],
          "parameters": {
            "operation": "sendMessage",
            "chatId": "={{$json.message.chat.id}}",
            "text": "={{$json.response}}",
            "additionalFields": {
              "parseMode": "Markdown"
            }
          }
        }
      ],
      "connections": {
        "Telegram Trigger": {
          "main": [[{ "node": "Check if Voice", "type": "main", "index": 0 }]]
        },
        "Check if Voice": {
          "main": [
            [{ "node": "Get Voice File", "type": "main", "index": 0 }],
            [{ "node": "Merge Text Input", "type": "main", "index": 1 }]
          ]
        },
        "Get Voice File": {
          "main": [[{ "node": "OpenAI Transcribe", "type": "main", "index": 0 }]]
        },
        "OpenAI Transcribe": {
          "main": [[{ "node": "Merge Text Input", "type": "main", "index": 0 }]]
        },
        "Merge Text Input": {
          "main": [[{ "node": "AI Assistant Jackie", "type": "main", "index": 0 }]]
        },
        "AI Assistant Jackie": {
          "main": [
            [
              { "node": "Get Unread Emails", "type": "main", "index": 0 },
              { "node": "Get Calendar Events", "type": "main", "index": 0 },
              { "node": "Get Google Tasks", "type": "main", "index": 0 }
            ]
          ]
        },
        "Get Unread Emails": {
          "main": [[{ "node": "Send to Telegram", "type": "main", "index": 0 }]]
        },
        "Get Calendar Events": {
          "main": [[{ "node": "Send to Telegram", "type": "main", "index": 0 }]]
        },
        "Get Google Tasks": {
          "main": [[{ "node": "Send to Telegram", "type": "main", "index": 0 }]]
        }
      }
    }),
    instructions: `<strong>How it works:</strong><br/>
This workflow creates a personal AI assistant named Jackie that operates through Telegram. Jackie can summarize unread emails, check calendar events, manage Google Tasks, and handle both voice and text interactions.<br/><br/>

<strong>Setup Steps:</strong><br/>
1. Create a Telegram bot via @BotFather and get your bot token<br/>
2. Set up OpenAI API key for voice transcription and AI responses<br/>
3. Configure Google OAuth2 for Gmail, Calendar, and Tasks access<br/>
4. Deploy the workflow and start chatting with Jackie!<br/><br/>

<strong>API Keys Required:</strong><br/>
• Telegram Bot API<br/>
• OpenAI API (for Whisper & GPT-4)<br/>
• Google OAuth2 (Gmail, Calendar, Tasks)`,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "3",
    title: "Talk to Your Google Sheets Using ChatGPT",
    description: "Query and analyze your spreadsheet data using natural language powered by ChatGPT integration.",
    author: {
      name: "Robert Breen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    },
    category: "AI",
    integrations: ["OpenAI", "Google Sheets", "HTTP"],
    views: 7200,
  },
  {
    id: "4",
    title: "Generate AI Viral Videos with VEO 3",
    description: "Automatically generate and upload viral video content to TikTok using AI-powered video generation.",
    author: {
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    category: "Marketing",
    integrations: ["OpenAI", "HTTP", "Webhook", "Google Sheets", "Gmail"],
    views: 15600,
    isPro: true,
    price: 24.99,
  },
  {
    id: "5",
    title: "Automated Email Campaign Manager",
    description: "Create and manage email marketing campaigns with AI-powered content generation and scheduling.",
    author: {
      name: "Michael Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    category: "Marketing",
    integrations: ["Gmail", "Google Sheets", "OpenAI"],
    views: 5400,
  },
  {
    id: "6",
    title: "Slack to Database Sync Workflow",
    description: "Automatically sync Slack messages and channels to your PostgreSQL database for analytics and backup.",
    author: {
      name: "Emily Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    },
    category: "IT Ops",
    integrations: ["Slack", "PostgreSQL", "Webhook"],
    views: 3200,
  },
  {
    id: "7",
    title: "Customer Support Ticket Automation",
    description: "Automate customer support workflows with AI-powered ticket classification and routing.",
    author: {
      name: "James Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    },
    category: "Support",
    integrations: ["OpenAI", "Slack", "Gmail", "PostgreSQL"],
    views: 6800,
  },
  {
    id: "8",
    title: "Invoice Processing with OCR",
    description: "Extract data from invoices automatically using OCR and AI, then sync to your accounting system.",
    author: {
      name: "Lisa Anderson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    },
    category: "Document Ops",
    integrations: ["OpenAI", "Google Sheets", "Webhook"],
    views: 4100,
    isPro: true,
    price: 14.99,
  },
  {
    id: "9",
    title: "Social Media Content Scheduler",
    description: "Schedule and automate social media posts across multiple platforms with AI content suggestions.",
    author: {
      name: "David Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    category: "Marketing",
    integrations: ["OpenAI", "HTTP", "Google Sheets"],
    views: 9300,
  },
  {
    id: "10",
    title: "Lead Scoring Automation",
    description: "Automatically score and qualify leads using AI analysis of customer data and behavior.",
    author: {
      name: "Jennifer Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer",
    },
    category: "Sales",
    integrations: ["OpenAI", "PostgreSQL", "Webhook", "Gmail"],
    views: 7600,
  },
  {
    id: "11",
    title: "Server Monitoring & Alerting",
    description: "Monitor your servers and receive instant alerts via Slack when issues are detected.",
    author: {
      name: "Chris Martinez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris",
    },
    category: "IT Ops",
    integrations: ["HTTP", "Slack", "Webhook"],
    views: 2800,
  },
  {
    id: "12",
    title: "Meeting Notes Summarizer",
    description: "Automatically transcribe and summarize meeting recordings, then share key points via Slack.",
    author: {
      name: "Amanda Brown",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda",
    },
    category: "AI",
    integrations: ["OpenAI", "Slack", "Google Calendar"],
    views: 11200,
  },
  {
    id: "13",
    title: "E-commerce Order Processor",
    description: "Automatically process new orders, update inventory, and send confirmation emails to customers.",
    author: {
      name: "Ryan Thompson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan",
    },
    category: "Sales",
    integrations: ["Webhook", "PostgreSQL", "Gmail", "Google Sheets"],
    views: 8400,
  },
  {
    id: "14",
    title: "AI-Powered Code Review Assistant",
    description: "Analyze pull requests and provide automated code review feedback using GPT-4.",
    author: {
      name: "Nina Patel",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
    },
    category: "IT Ops",
    integrations: ["OpenAI", "Webhook", "Slack"],
    views: 14200,
  },
  {
    id: "15",
    title: "Document Translation Pipeline",
    description: "Automatically translate documents between languages while preserving formatting.",
    author: {
      name: "Marco Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marco",
    },
    category: "Document Ops",
    integrations: ["OpenAI", "Google Sheets", "HTTP"],
    views: 5600,
  },
  {
    id: "16",
    title: "Competitive Intelligence Tracker",
    description: "Monitor competitor websites and social media, generating weekly summary reports.",
    author: {
      name: "Sophie Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    },
    category: "Marketing",
    integrations: ["HTTP", "OpenAI", "Gmail", "Google Sheets"],
    views: 6300,
  },
  {
    id: "17",
    title: "Customer Feedback Analyzer",
    description: "Collect and analyze customer feedback using sentiment analysis to identify trends.",
    author: {
      name: "Tom Baker",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
    },
    category: "Support",
    integrations: ["OpenAI", "PostgreSQL", "Slack"],
    views: 4900,
  },
  {
    id: "18",
    title: "Automated Report Generator",
    description: "Generate weekly business reports from multiple data sources and distribute via email.",
    author: {
      name: "Grace Liu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
    },
    category: "Document Ops",
    integrations: ["PostgreSQL", "Google Sheets", "Gmail", "OpenAI"],
    views: 7100,
  },
  {
    id: "19",
    title: "Sales Pipeline Automation",
    description: "Automate lead tracking, follow-ups, and deal progression through your sales pipeline.",
    author: {
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    category: "Sales",
    integrations: ["PostgreSQL", "Gmail", "Slack", "Google Calendar"],
    views: 9800,
  },
  {
    id: "20",
    title: "Knowledge Base Chatbot",
    description: "Create an AI chatbot that answers questions from your company's knowledge base.",
    author: {
      name: "Helen Park",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Helen",
    },
    category: "Support",
    integrations: ["OpenAI", "PostgreSQL", "Webhook"],
    views: 12300,
  },
  {
    id: "21",
    title: "Infrastructure Cost Optimizer",
    description: "Monitor cloud infrastructure costs and suggest optimizations based on usage patterns.",
    author: {
      name: "Kevin O'Brien",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
    },
    category: "IT Ops",
    integrations: ["HTTP", "PostgreSQL", "Slack", "Gmail"],
    views: 5200,
  },
  {
    id: "22",
    title: "Content Calendar Manager",
    description: "Plan and schedule content across multiple platforms with team collaboration features.",
    author: {
      name: "Mia Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    },
    category: "Marketing",
    integrations: ["Google Sheets", "Google Calendar", "Slack"],
    views: 6700,
  },
  {
    id: "23",
    title: "Contract Analysis Workflow",
    description: "Extract key terms and dates from contracts using AI, flagging important clauses.",
    author: {
      name: "Daniel Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel",
    },
    category: "Document Ops",
    integrations: ["OpenAI", "Google Sheets", "Gmail"],
    views: 4500,
  },
  {
    id: "24",
    title: "Multi-Channel Lead Capture",
    description: "Capture leads from website forms, social media, and email into a unified database.",
    author: {
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
    category: "Sales",
    integrations: ["Webhook", "PostgreSQL", "Gmail", "Slack"],
    views: 8100,
  },
];

export const categories = [
  "AI",
  "Sales",
  "IT Ops",
  "Marketing",
  "Document Ops",
  "Support",
];
