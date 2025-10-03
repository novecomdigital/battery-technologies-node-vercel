# Scalability Testing with 500+ Job Records

This document explains how to use the scalability seed data for testing the Battery Technologies application with a larger dataset.

## Quick Start

To populate your database with ~500 job records for scalability testing:

```bash
npm run db:seed-scalability
```

## What Gets Created

The scalability seed generates realistic test data including:

- **2 technician users** (Mike Broom, Wesley Broom)
- **5 service providers** (Linde, Toyota, Hyster-Yale, Crown, Yale)
- **58 customers** (mix of major UK companies)
- **116 locations** (1-3 locations per customer)
- **79 contacts** (1-2 contacts per customer)
- **500 jobs** with realistic:
  - Job numbers (510001-510500)
  - Service types (battery inspections, repairs, installations, etc.)
  - Job statuses (OPEN, VISITED, COMPLETE, etc.)
  - Due dates (spread across past, present, and future)
  - Technician assignments (70% assigned, 30% unassigned)
  - Realistic descriptions and metadata
- **~150 job photos** (30% of jobs have photos)

## Data Distribution

### Job Statuses
- Mixed distribution across all status types
- Realistic date patterns based on status
- COMPLETE jobs have start/end dates
- OPEN jobs have future due dates

### Technician Assignment
- 70% of jobs assigned to Mike or Wesley Broom
- 30% unassigned for testing filtering

### Customer Types
- 40% referred customers (via service providers)
- 60% direct customers

### Geographic Distribution
- Spread across major UK cities
- Realistic addresses and contact information

## Testing Scenarios

With 500 job records, you can test:

### Performance
- **Page load times** with large datasets
- **Search functionality** across hundreds of records
- **Filtering performance** by status, technician, service type
- **Sorting performance** on various columns
- **Pagination** with different page sizes

### UI/UX
- **Table rendering** with many rows
- **Scroll performance** in job listings
- **Filter responsiveness** with large result sets
- **Mobile performance** with substantial data

### API Performance
- **Database query optimization**
- **API response times** with complex filters
- **Memory usage** with large result sets
- **Concurrent user simulation**

## Useful Test Commands

```bash
# Count total jobs
npx prisma studio
# or query directly:
# SELECT COUNT(*) FROM jobs;

# Test API performance
curl "http://localhost:3000/api/jobs?limit=50&page=1"

# Test filtering performance
curl "http://localhost:3000/api/jobs?status=OPEN&limit=25"

# Test search performance
curl "http://localhost:3000/api/jobs?search=battery&limit=25"

# Test technician filtering
curl "http://localhost:3000/api/jobs?assignedToId=<technician-id>&limit=25"
```

## Performance Benchmarks

Use this data to establish baseline performance metrics:

1. **Initial page load** (jobs listing)
2. **Filter application time** (status, technician, service type)
3. **Search response time** (text search across jobs)
4. **Pagination navigation** (between pages)
5. **Job detail page load** (individual job view)
6. **Edit mode responsiveness** (job editing)

## Cleanup

To return to minimal test data:

```bash
npm run db:seed-simple
```

Or to use the original seed data:

```bash
npm run db:seed
```

## Notes

- All generated data is realistic but fictional
- Email addresses use realistic patterns but are not real
- Phone numbers follow UK/US patterns but are not real
- Job numbers follow the existing sequence (510001+)
- Technician users are the same as in production (Mike & Wesley Broom)
