#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import prettier for code formatting
const prettier = require('prettier');

/**
 * Recursively generate TypeScript type for a STRUCT schema
 */
const generateStructType = (fields, indent = '    ') => {
  const structFields = fields
    .map((f) => {
      if (f.schema.type === 'STRUCT' && f.schema.fields) {
        // Recursively handle nested STRUCT
        const nestedType = generateStructType(f.schema.fields, indent + '  ');
        return `${indent}${f.name}: {\n${nestedType}\n${indent}} | null;`;
      } else if (f.schema.type === 'ARRAY' && f.schema.memberSchema) {
        // Handle arrays
        if (f.schema.memberSchema.type === 'STRUCT' && f.schema.memberSchema.fields) {
          // Array of structs
          const arrayStructType = generateStructType(f.schema.memberSchema.fields, indent + '    ');
          return `${indent}${f.name}:\n${indent}  | {\n${arrayStructType}\n${indent}    }[]\n${indent}  | null;`;
        } else {
          // Array of primitives
          const memberType = mapKsqlTypeToTs(f.schema.memberSchema);
          return `${indent}${f.name}: ${memberType}[] | null;`;
        }
      } else {
        // Primitive type
        const fieldType = mapKsqlTypeToTs(f.schema);
        return `${indent}${f.name}: ${fieldType} | null;`;
      }
    })
    .join('\n');
  return structFields;
};

/**
 * Map ksqlDB schema type to TypeScript type
 */
const mapKsqlTypeToTs = (schema) => {
  if (!schema || !schema.type) return 'unknown';

  const type = schema.type;

  switch (type) {
    case 'STRING':
      return 'string';
    case 'BIGINT':
    case 'INTEGER':
    case 'DOUBLE':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'ARRAY':
      if (schema.memberSchema) {
        // Handle STRUCT within ARRAY - use recursive generator
        if (schema.memberSchema.type === 'STRUCT' && schema.memberSchema.fields) {
          const structType = generateStructType(schema.memberSchema.fields, '    ');
          return `{\n${structType}\n  }[]`;
        }
        const memberType = mapKsqlTypeToTs(schema.memberSchema);
        return `${memberType}[]`;
      }
      return 'unknown[]';
    case 'STRUCT':
      // Will be handled specially to generate nested interface
      return 'STRUCT';
    default:
      return 'unknown';
  }
};

/**
 * Convert a field to TypeScript property definition
 */
const fieldToTsProperty = (field, indent = '  ') => {
  const fieldName = field.name;
  const isKey = field.type === 'KEY';

  if (field.schema.type === 'STRUCT' && field.schema.fields) {
    // Generate nested interface inline
    const nestedFields = field.schema.fields
      .map((f) => fieldToTsProperty(f, indent + '  '))
      .join('\n');
    const structType = `{\n${nestedFields}\n${indent}}`;
    
    // Add | null for non-KEY fields (ksqlDB STRUCT objects can be NULL)
    const finalType = !isKey ? `${structType} | null` : structType;
    
    return `${indent}${fieldName}: ${finalType};`;
  }

  let tsType = mapKsqlTypeToTs(field.schema);

  // Handle nullable fields (not marked as KEY)
  if (!isKey) {
    tsType = `${tsType} | null`;
  }

  return `${indent}${fieldName}: ${tsType};`;
};

/**
 * Generate TypeScript interface for a stream or table
 */
const generateTypeScriptInterface = (description) => {
  const { name, type, fields } = description;

  // Convert table/stream name to PascalCase interface name with Ksql prefix
  const interfaceName =
    'Ksql' +
    name
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

  // Generate field definitions
  const fieldDefs = fields
    .filter((f) => f.name) // Filter out fields without names
    .map((f) => fieldToTsProperty(f))
    .join('\n');

  const header = `/***
 * DO NOT MODIFY THIS FILE BY HAND
 * This file was generated from ksqlDB ${type.toLowerCase()} schema
 * Source: ${name}
 */

export interface ${interfaceName} {
${fieldDefs}
}
`;

  return { interfaceName, content: header };
};

/**
 * Check if a table/stream should be excluded from code generation
 */
const shouldExcludeSource = (sourceName, description) => {
  // Exclude migration-related tables
  const migrationKeywords = ['MIGRATION', 'KSQL_PROCESSING'];
  if (migrationKeywords.some((keyword) => sourceName.includes(keyword))) {
    return true;
  }

  return false;
};

/**
 * Generate TypeScript type files for all tables and streams
 */
const generateTypeScriptFiles = async (state, outputDir) => {
  // Clear output directory before generating new files
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      if (file.endsWith('.generated.ts')) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    }
  } else {
    // Create output directory if it doesn't exist
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedFiles = [];

  // Generate types for all descriptions (tables and streams)
  for (const [sourceName, description] of Object.entries(state.descriptions)) {
    // Skip excluded sources
    if (shouldExcludeSource(sourceName, description)) {
      continue;
    }
    try {
      const { interfaceName, content } =
        generateTypeScriptInterface(description);

      // Format with prettier
      const formatted = await prettier.format(content, {
        parser: 'typescript',
        singleQuote: true,
      });

      // Write to file
      const fileName = `${interfaceName}.generated.ts`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, formatted);

      generatedFiles.push(fileName);
    } catch (error) {
      console.error(
        `  ✗ Failed to generate types for ${sourceName}:`,
        error.message,
      );
    }
  }

  return generatedFiles;
};

/**
 * Main codegen function - reads from state.json and generates TypeScript types
 */
const main = async () => {
  const stateFile = path.join(__dirname, '..', 'state.json');
  const outputDir = path.join(__dirname, '..', '..', 'src', 'generated', 'ksql');

  // Check if state.json exists
  if (!fs.existsSync(stateFile)) {
    console.error(`Error: ${stateFile} not found`);
    console.error('Please run migrations first to generate state.json');
    process.exit(1);
  }

  try {
    console.log('Generating TypeScript types from state.json...');

    // Read state from file
    const stateContent = fs.readFileSync(stateFile, 'utf8');
    const state = JSON.parse(stateContent);

    // Generate TypeScript types
    const generatedFiles = await generateTypeScriptFiles(state, outputDir);
    console.log(
      `  ✓ Generated ${generatedFiles.length} type file(s) in ${outputDir}`,
    );

    console.log('\n✓ Codegen complete\n');
  } catch (error) {
    console.error('Error in codegen:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { main };
