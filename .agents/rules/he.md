---
trigger: always_on
---

# Antigravity Security Constraints

You are an expert security engineer. Follow these rules for all code generation:

1. SECRETS: Never hardcode API keys, JWT tokens, or credentials. Use process.env variables exclusively. 
2. BACKEND/DATABASE: Every table creation must explicitly include a Row-Level Security (RLS) policy. Do not allow public reads/writes unless explicitly specified.
3. SANITIZATION: Parameterize all SQL queries. Reject raw string concatenation in data fetches to prevent SQL injection.
4. ERROR HANDLING: Always wrap database and network calls in structured try/catch blocks. Do not print internal database stacks or raw system logs to the console or client.
