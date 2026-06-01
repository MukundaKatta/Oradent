import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Format Zod validation errors into a readable field-level map.
 */
function formatErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.errors) {
    const fieldName = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!fields[fieldName]) {
      fields[fieldName] = issue.message;
    }
  }
  return fields;
}

/**
 * Validate req.body against a Zod schema.
 * Returns 400 with detailed field-level errors on failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        target: 'body',
        fields: formatErrors(result.error),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate req.query against a Zod schema.
 * Returns 400 with detailed field-level errors on failure.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        target: 'query',
        fields: formatErrors(result.error),
      });
      return;
    }
    req.query = result.data;
    next();
  };
}

/**
 * Validate req.params against a Zod schema.
 * Returns 400 with detailed field-level errors on failure.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        target: 'params',
        fields: formatErrors(result.error),
      });
      return;
    }
    req.params = result.data;
    next();
  };
}
