// scripts/analyze-schema-diff-with-llm.js
// Usage: node scripts/analyze-schema-diff-with-llm.js <diffFile> <schemaFile> <outputFile>
// Requires: process.env.OPENAI_API_KEY

const fs = require('fs');
const https = require('https');

const [,, diffFile, schemaFile, outputFile] = process.argv;

if (!diffFile || !schemaFile || !outputFile) {
  console.error('Usage: node scripts/analyze-schema-diff-with-llm.js <diffFile> <schemaFile> <outputFile>');
  process.exit(1);
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is not set.');
  process.exit(1);
}

const diff = fs.readFileSync(diffFile, 'utf8');
const schema = fs.readFileSync(schemaFile, 'utf8');

const prompt = `
You are an expert GraphQL reviewer. You will be given:
- A GraphQL schema diff (from graphql-inspector) between the main branch and a PR branch.
- The full generated GraphQL schema for the PR branch.
- If there is no diff or changes detected in this PR. Just say that and nothing else. We don't need any examples

Your task:
1. Provide examples of how the new API would be interacted with. Include example variables you would pass to mutations/queries

Format your response as Markdown

--- GraphQL Schema Diff ---
${diff}

--- PR Branch Generated Schema ---
${schema}
`;

function callOpenAI(prompt, callback) {
  const data = JSON.stringify({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a senior GraphQL reviewer and API architect." },
      { role: "user", content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.2
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Length': Buffer.byteLength(data, 'utf8')
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error('OpenAI API error:', res.statusCode, body);
        process.exit(1);
      }
      try {
        const json = JSON.parse(body);
        const content = json.choices[0].message.content;
        callback(null, content);
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', (e) => {
    callback(e);
  });

  req.write(data);
  req.end();
}

callOpenAI(prompt, (err, result) => {
  if (err) {
    console.error('Error calling OpenAI:', err);
    process.exit(1);
  }
  fs.writeFileSync(outputFile, result, 'utf8');
  console.log('LLM analysis written to', outputFile);
});
