import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';

const SPEC_CANDIDATES = [
  path.resolve(__dirname, '../../../docs/api/combined.openapi.yaml'),
  path.resolve(__dirname, '../../../../docs/api/combined.openapi.yaml'),
  path.join(process.cwd(), 'docs/api/combined.openapi.yaml'),
  path.join(process.cwd(), '../docs/api/combined.openapi.yaml'),
];

export function loadOpenApiSpec(): Record<string, unknown> {
  for (const candidate of SPEC_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return YAML.load(candidate);
    }
  }
  throw new Error(`OpenAPI spec not found. Tried: ${SPEC_CANDIDATES.join(', ')}`);
}
