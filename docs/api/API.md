# API Reference

## Overview

Reality 3D API provides comprehensive endpoints for 3D model generation, reality digitization, and asset management. This document details the available endpoints, request/response formats, and usage examples.

## Base URL

```
https://api.reality3d.ai/v1
```

## Authentication

All API requests require authentication using an API key in the header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 3D Generation

#### Generate 3D Model from Image

```http
POST /generate/image-to-3d
Content-Type: multipart/form-data
```

Parameters:
- `image` (file, required): Source image file
- `options` (object, optional):
  - `detail_level`: 1-5 (default: 3)
  - `texture_quality`: 1-5 (default: 3)
  - `output_format`: "glb", "obj", "fbx" (default: "glb")

Response:
```json
{
  "model_id": "m123xyz",
  "status": "processing",
  "estimated_time": 120
}
```

#### Generate 3D Model from Text

```http
POST /generate/text-to-3d
Content-Type: application/json
```

Parameters:
```json
{
  "description": "A modern glass building with curved walls",
  "options": {
    "detail_level": 3,
    "texture_quality": 3,
    "output_format": "glb"
  }
}
```

### Asset Management

#### List Models

```http
GET /models
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status ("processing", "completed", "failed")

Response:
```json
{
  "models": [
    {
      "id": "m123xyz",
      "created_at": "2024-01-01T12:00:00Z",
      "status": "completed",
      "download_url": "https://..."
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### Get Model Status

```http
GET /models/{model_id}/status
```

Response:
```json
{
  "status": "completed",
  "progress": 100,
  "download_url": "https://..."
}
```

### Reality Digitization

#### Upload Reality Data

```http
POST /reality/upload
Content-Type: multipart/form-data
```

Parameters:
- `images[]` (files, required): Multiple image files
- `metadata` (json, required):
  ```json
  {
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "tags": ["building", "historical"],
    "description": "Historic building facade"
  }
  ```

#### Search Reality Data

```http
GET /reality/search
```

Query Parameters:
- `query`: Search text
- `location`: Coordinates (lat,lng)
- `radius`: Search radius in meters
- `tags`: Comma-separated tags

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Invalid image format",
    "details": {
      "supported_formats": ["jpg", "png"]
    }
  }
}
```

Common Error Codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

API requests are limited to:
- 100 requests per minute per API key
- 1000 requests per day per API key

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

Register webhook endpoints to receive real-time updates:

```http
POST /webhooks
Content-Type: application/json
```

Parameters:
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["model.completed", "model.failed"]
}
```

## SDK Support

Official SDKs are available for:
- Python
- JavaScript/TypeScript
- Unity

Example (Python):
```python
from reality3d import Reality3D

client = Reality3D(api_key="your-api-key")

# Generate 3D model from image
with open("image.jpg", "rb") as f:
    result = client.generate.from_image(f)
    model_id = result.model_id

# Check status
status = client.models.get_status(model_id)
print(f"Status: {status.status}")
```

## Best Practices

1. Implement retry logic for failed requests
2. Use webhook notifications for long-running operations
3. Optimize image sizes before upload
4. Cache API responses when appropriate
5. Monitor rate limits and adjust request patterns

## Support

For API support and questions:
- Email: api-support@reality3d.ai
- Documentation: https://docs.reality3d.ai
- Status Page: https://status.reality3d.ai