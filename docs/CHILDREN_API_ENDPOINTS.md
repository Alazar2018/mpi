# Children API Endpoints

This document outlines the new API endpoints needed for parents to view their children's information.

## 👶 Children Endpoints

### 1. Get List of Children (Parents Only)
```http
GET /api/v1/users/children
```

**Description**: Get list of children for the current parent user  
**Access**: Parents only  
**Authentication**: Required (Bearer token)  
**Query Parameters**:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of children per page (default: 10)
- `search` (optional): Search query for filtering children by name

**Response**:
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "_id": "child_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "emailAddress": {
          "email": "john.doe@example.com"
        },
        "phoneNumber": {
          "countryCode": "+1",
          "number": "5551234567"
        },
        "avatar": "https://example.com/avatar.jpg",
        "lastOnline": "2024-01-15T10:30:00Z",
        "coaches": [...],
        "classes": [...]
      }
    ],
    "total": 2,
    "page": 1,
    "totalPages": 1
  }
}
```

**Error Responses**:
- `403 Forbidden`: User is not a parent
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server error

---

### 2. Search Children (Parents Only)
```http
GET /api/v1/users/children/search
```

**Description**: Search children by name or other criteria  
**Access**: Parents only  
**Authentication**: Required (Bearer token)  
**Query Parameters**:
- `search` (required): Search query string
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 10)

**Response**: Same as list endpoint with filtered results

**Error Responses**: Same as list endpoint

---

### 3. Get Child Details (Parents Only)
```http
GET /api/v1/users/children/:id
```

**Description**: Get detailed information about a specific child  
**Access**: Parents only (can only view their own children)  
**Authentication**: Required (Bearer token)  
**Path Parameters**:
- `id` (required): Child user ID

**Response**:
```json
{
  "success": true,
  "data": {
    "child": {
      "_id": "child_id_1",
      "firstName": "John",
      "lastName": "Doe",
      "emailAddress": {
        "email": "john.doe@example.com"
      },
      "phoneNumber": {
        "countryCode": "+1",
        "number": "5551234567"
      },
      "avatar": "https://example.com/avatar.jpg",
      "lastOnline": "2024-01-15T10:30:00Z",
      "coaches": [
        {
          "_id": "coach_id_1",
          "firstName": "Coach",
          "lastName": "Smith",
          "emailAddress": {
            "email": "coach.smith@example.com"
          }
        }
      ],
      "classes": [...],
      "coachGoals": [...]
    }
  }
}
```

**Error Responses**:
- `403 Forbidden`: User is not a parent or trying to access another parent's child
- `404 Not Found`: Child not found or user doesn't have permission to view
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server error

---

## 🔐 Security & Access Control

### Role-Based Access
- **Parents**: Can only view their own children
- **Coaches**: Cannot access children endpoints (use players endpoints instead)
- **Players**: Cannot access children endpoints
- **Admins**: Should have access to all children (future enhancement)

### Data Privacy
- Parents can only see their own children's information
- Children's personal data is protected from unauthorized access
- API responses should not include sensitive information like passwords or internal IDs

### Authentication Requirements
- All endpoints require valid Bearer token
- Token must belong to a user with parent role
- Token validation should check user role before allowing access

---

## 📝 Implementation Notes

### Backend Requirements
1. **User Role Validation**: Check if authenticated user has 'parent' role
2. **Parent-Child Relationship**: Verify the parent-child relationship exists
3. **Data Filtering**: Ensure parents only see their own children
4. **Pagination**: Implement proper pagination for large datasets
5. **Search Functionality**: Implement search by name, email, or other relevant fields

### Database Considerations
1. **Parent-Child Relationship Table**: Store parent-child associations
2. **Indexing**: Index on parent_id and child_id for efficient queries
3. **Data Consistency**: Ensure referential integrity between users and relationships

### Error Handling
1. **Clear Error Messages**: Provide meaningful error messages for different scenarios
2. **Proper HTTP Status Codes**: Use appropriate status codes for different error types
3. **Logging**: Log access attempts and errors for security monitoring

---

## 🚀 Future Enhancements

### Potential Additional Endpoints
1. **Child Progress Tracking**: Get child's learning progress and achievements
2. **Child Schedule**: View child's class schedule and upcoming events
3. **Child Performance**: View child's match results and statistics
4. **Parent Notifications**: Get notifications about child's activities

### Advanced Features
1. **Multiple Parents**: Support for children with multiple parents/guardians
2. **Parent Permissions**: Different permission levels for different parents
3. **Child Invitations**: Allow parents to invite children to the platform
4. **Parent Dashboard**: Comprehensive view of all children's activities
