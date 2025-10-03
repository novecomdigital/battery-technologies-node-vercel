/**
 * Standardized Error Handling Utilities
 * 
 * This module provides consistent error handling patterns for API routes
 * to prevent common variable reference errors and improve error reporting.
 * 
 * Based on lessons learned from the service-desk migration.
 */

import { NextResponse } from 'next/server';

export interface ErrorContext {
  operation: string;
  userId?: string;
  orgId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  requestId?: string;
  timestamp: string;
}

/**
 * Creates a standardized error handler for API operations
 */
export function createErrorHandler(operation: string) {
  return (error: unknown, context?: ErrorContext): ErrorResponse => {
    const timestamp = new Date().toISOString();
    const requestId = context?.requestId || generateRequestId();
    
    // Log the error with context
    console.error(`${operation} failed:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      context,
      requestId,
      timestamp
    });
    
    // Return standardized error response
    if (error instanceof Error) {
      return {
        error: error.message,
        code: (error as any).code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          context
        } : undefined,
        requestId,
        timestamp
      };
    }
    
    return {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      requestId,
      timestamp
    };
  };
}

/**
 * Standardized API route error handling wrapper
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  operation: string
) {
  return async (...args: T): Promise<NextResponse> => {
    const handleError = createErrorHandler(operation);
    
    try {
      return await handler(...args);
    } catch (error) {
      const errorResponse = handleError(error, {
        operation,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(errorResponse, { 
        status: getErrorStatusCode(error) 
      });
    }
  };
}

/**
 * Standardized API route pattern for GET requests
 */
export function createGetHandler<T = any>(
  handler: (req: Request, context?: ErrorContext) => Promise<T>,
  operation: string
) {
  return withErrorHandling(async (req: Request) => {
    const context: ErrorContext = {
      operation,
      requestId: generateRequestId(),
      timestamp: new Date().toISOString()
    };
    
    const result = await handler(req, context);
    return NextResponse.json(result);
  }, operation);
}

/**
 * Standardized API route pattern for POST requests
 */
export function createPostHandler<T = any, R = any>(
  handler: (req: Request, context?: ErrorContext) => Promise<R>,
  operation: string
) {
  return withErrorHandling(async (req: Request) => {
    const context: ErrorContext = {
      operation,
      requestId: generateRequestId(),
      timestamp: new Date().toISOString()
    };
    
    const result = await handler(req, context);
    return NextResponse.json(result, { status: 201 });
  }, operation);
}

/**
 * Standardized API route pattern for PUT/PATCH requests
 */
export function createUpdateHandler<T = any, R = any>(
  handler: (req: Request, context?: ErrorContext) => Promise<R>,
  operation: string
) {
  return withErrorHandling(async (req: Request) => {
    const context: ErrorContext = {
      operation,
      requestId: generateRequestId(),
      timestamp: new Date().toISOString()
    };
    
    const result = await handler(req, context);
    return NextResponse.json(result);
  }, operation);
}

/**
 * Standardized API route pattern for DELETE requests
 */
export function createDeleteHandler(
  handler: (req: Request, context?: ErrorContext) => Promise<void>,
  operation: string
) {
  return withErrorHandling(async (req: Request) => {
    const context: ErrorContext = {
      operation,
      requestId: generateRequestId(),
      timestamp: new Date().toISOString()
    };
    
    await handler(req, context);
    return NextResponse.json({ success: true });
  }, operation);
}

/**
 * Authentication error handler
 */
export function createAuthErrorHandler() {
  return (error: unknown, context?: ErrorContext) => {
    const handleError = createErrorHandler('Authentication');
    
    if (error instanceof Error && (error as any).status === 401) {
      return NextResponse.json(
        handleError(error, context),
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      handleError(error, context),
      { status: 500 }
    );
  };
}

/**
 * Validation error handler
 */
export function createValidationErrorHandler() {
  return (error: unknown, context?: ErrorContext) => {
    const handleError = createErrorHandler('Validation');
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        handleError(error, context),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      handleError(error, context),
      { status: 500 }
    );
  };
}

/**
 * Database error handler
 */
export function createDatabaseErrorHandler() {
  return (error: unknown, context?: ErrorContext) => {
    const handleError = createErrorHandler('Database');
    
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        handleError(error, context),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      handleError(error, context),
      { status: 500 }
    );
  };
}

/**
 * Get appropriate HTTP status code for error
 */
function getErrorStatusCode(error: unknown): number {
  if (error instanceof Error) {
    const status = (error as any).status;
    if (typeof status === 'number') {
      return status;
    }
    
    // Common error patterns
    if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
      return 401;
    }
    
    if (error.message.includes('Forbidden') || error.message.includes('Permission')) {
      return 403;
    }
    
    if (error.message.includes('Not found') || error.message.includes('does not exist')) {
      return 404;
    }
    
    if (error.message.includes('Validation') || error.message.includes('Invalid')) {
      return 400;
    }
    
    if (error.message.includes('Conflict') || error.message.includes('already exists')) {
      return 409;
    }
  }
  
  return 500;
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Example usage:
 * 
 * ```typescript
 * // GET endpoint
 * export const GET = createGetHandler(async (req, context) => {
 *   // Your logic here
 *   return { data: 'success' };
 * }, 'GetUserData');
 * 
 * // POST endpoint
 * export const POST = createPostHandler(async (req, context) => {
 *   const body = await req.json();
 *   // Your logic here
 *   return { id: 'new-id' };
 * }, 'CreateUser');
 * 
 * // Custom error handling
 * export async function GET(req: Request) {
 *   const handleError = createErrorHandler('CustomOperation');
 *   
 *   try {
 *     // Your logic here
 *     return NextResponse.json({ success: true });
 *   } catch (error) {
 *     const errorResponse = handleError(error, { userId: '123' });
 *     return NextResponse.json(errorResponse, { status: 500 });
 *   }
 * }
 * ```
 */
