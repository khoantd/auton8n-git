-- Seed Workflows
-- After running this, run: npm run seed:workflow-demo  (to backfill workflow_json/instructions for n8n demo)
INSERT INTO workflows (title, description, author_name, author_avatar, category, integrations, views, featured, is_pro, price)
VALUES 
('Build Your First AI Agent', 'Create an intelligent AI agent that can understand context, make decisions, and execute tasks autonomously.', 'Lucas Peyrin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', 'AI', '["OpenAI", "Webhook", "HTTP"]', 12500, true, false, 0),
('Personal Life Manager with Telegram & Voice-Enabled AI', 'Manage your personal life with an AI assistant connected to Telegram, Google Services, and voice commands.', 'Derek Cheung', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Derek', 'AI', '["OpenAI", "Google Sheets", "Slack", "Webhook", "Gmail", "Google Calendar"]', 8900, false, true, 19.99),
('Talk to Your Google Sheets Using ChatGPT', 'Query and analyze your spreadsheet data using natural language powered by ChatGPT integration.', 'Robert Breen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert', 'AI', '["OpenAI", "Google Sheets", "HTTP"]', 7200, false, false, 0),
('Generate AI Viral Videos with VEO 3', 'Automatically generate and upload viral video content to TikTok using AI-powered video generation.', 'Sarah Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'Marketing', '["OpenAI", "HTTP", "Webhook", "Google Sheets", "Gmail"]', 15600, false, true, 24.99),
('Automated Email Campaign Manager', 'Create and manage email marketing campaigns with AI-powered content generation and scheduling.', 'Michael Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', 'Marketing', '["Gmail", "Google Sheets", "OpenAI"]', 5400, false, false, 0),
('Slack to Database Sync Workflow', 'Automatically sync Slack messages and channels to your PostgreSQL database for analytics and backup.', 'Emily Davis', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', 'IT Ops', '["Slack", "PostgreSQL", "Webhook"]', 3200, false, false, 0),
('Customer Support Ticket Automation', 'Automate customer support workflows with AI-powered ticket classification and routing.', 'James Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', 'Support', '["OpenAI", "Slack", "Gmail", "PostgreSQL"]', 6800, false, false, 0),
('Invoice Processing with OCR', 'Extract data from invoices automatically using OCR and AI, then sync to your accounting system.', 'Lisa Anderson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', 'Document Ops', '["OpenAI", "Google Sheets", "Webhook"]', 4100, false, true, 14.99),
('Social Media Content Scheduler', 'Schedule and automate social media posts across multiple platforms with AI content suggestions.', 'David Kim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', 'Marketing', '["OpenAI", "HTTP", "Google Sheets"]', 9300, false, false, 0),
('Lead Scoring Automation', 'Automatically score and qualify leads using AI analysis of customer data and behavior.', 'Jennifer Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer', 'Sales', '["OpenAI", "PostgreSQL", "Webhook", "Gmail"]', 7600, false, false, 0),
('Server Monitoring & Alerting', 'Monitor your servers and receive instant alerts via Slack when issues are detected.', 'Chris Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris', 'IT Ops', '["HTTP", "Slack", "Webhook"]', 2800, false, false, 0),
('Meeting Notes Summarizer', 'Automatically transcribe and summarize meeting recordings, then share key points via Slack.', 'Amanda Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda', 'AI', '["OpenAI", "Slack", "Google Calendar"]', 11200, false, false, 0),
('E-commerce Order Processor', 'Automatically process new orders, update inventory, and send confirmation emails to customers.', 'Ryan Thompson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan', 'Sales', '["Webhook", "PostgreSQL", "Gmail", "Google Sheets"]', 8400, false, false, 0),
('AI-Powered Code Review Assistant', 'Analyze pull requests and provide automated code review feedback using GPT-4.', 'Nina Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina', 'IT Ops', '["OpenAI", "Webhook", "Slack"]', 14200, false, false, 0),
('Document Translation Pipeline', 'Automatically translate documents between languages while preserving formatting.', 'Marco Rodriguez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco', 'Document Ops', '["OpenAI", "Google Sheets", "HTTP"]', 5600, false, false, 0),
('Competitive Intelligence Tracker', 'Monitor competitor websites and social media, generating weekly summary reports.', 'Sophie Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', 'Marketing', '["HTTP", "OpenAI", "Gmail", "Google Sheets"]', 6300, false, false, 0),
('Customer Feedback Analyzer', 'Collect and analyze customer feedback using sentiment analysis to identify trends.', 'Tom Baker', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', 'Support', '["OpenAI", "PostgreSQL", "Slack"]', 4900, false, false, 0),
('Automated Report Generator', 'Generate weekly business reports from multiple data sources and distribute via email.', 'Grace Liu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace', 'Document Ops', '["PostgreSQL", "Google Sheets", "Gmail", "OpenAI"]', 7100, false, false, 0),
('Sales Pipeline Automation', 'Automate lead tracking, follow-ups, and deal progression through your sales pipeline.', 'Alex Rivera', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'Sales', '["PostgreSQL", "Gmail", "Slack", "Google Calendar"]', 9800, false, false, 0),
('Knowledge Base Chatbot', 'Create an AI chatbot that answers questions from your company''s knowledge base.', 'Helen Park', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Helen', 'Support', '["OpenAI", "PostgreSQL", "Webhook"]', 12300, false, false, 0),
('Infrastructure Cost Optimizer', 'Monitor cloud infrastructure costs and suggest optimizations based on usage patterns.', 'Kevin O''Brien', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', 'IT Ops', '["HTTP", "PostgreSQL", "Slack", "Gmail"]', 5200, false, false, 0),
('Content Calendar Manager', 'Plan and schedule content across multiple platforms with team collaboration features.', 'Mia Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', 'Marketing', '["Google Sheets", "Google Calendar", "Slack"]', 6700, false, false, 0),
('Contract Analysis Workflow', 'Extract key terms and dates from contracts using AI, flagging important clauses.', 'Daniel Kim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel', 'Document Ops', '["OpenAI", "Google Sheets", "Gmail"]', 4500, false, false, 0),
('Multi-Channel Lead Capture', 'Capture leads from website forms, social media, and email into a unified database.', 'Emma Wilson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', 'Sales', '["Webhook", "PostgreSQL", "Gmail", "Slack"]', 8100, false, false, 0);

-- Seed Subscription Plans
INSERT INTO subscription_plans (name, price, features, is_popular)
VALUES 
('Free', 0, '["Up to 3 workflows", "Basic analytics", "Community support"]', false),
('Pro', 29, '["Unlimited workflows", "Advanced analytics", "Priority support", "Team collaboration"]', true),
('Enterprise', 0, '["Custom integrations", "Dedicated account manager", "SLA & uptime guarantees", "SSO & advanced security"]', false);

-- Seed Payment Types
INSERT INTO payment_types (name, description, is_enabled)
VALUES 
('Stripe', 'Accept all major credit cards and digital wallets.', true),
('PayPal', 'Secure payments via PayPal balance or linked cards.', true),
('Crypto', 'Accept Bitcoin, Ethereum, and other major tokens.', false);

-- Seed Documents
INSERT INTO documents (title, slug, section, content, "order")
VALUES 
('Getting Started', 'getting-started', 'General', '# Getting Started\n\nWelcome to Workflow Canvas! This guide will help you build your first automation...', 1),
('AI Integration Guide', 'ai-integration', 'Advanced', '# AI Integration\n\nLearn how to connect your favorite AI models like OpenAI and Claude to your workflows...', 2),
('API Reference', 'api-reference', 'Developer', '# API Reference\n\nExplore our comprehensive API documentation for building custom integrations...', 3);
