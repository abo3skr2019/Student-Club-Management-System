# **Event Management System API Documentation**

## **Overview**
This is the API documentation for the Event Management System.

### **Key Features**
1. OAuth-based authentication (Google, GitHub).
2. User profiles with past and upcoming event registrations.
3. Clubs management.
4. Event management.
5. Role-based access control for Admins, Club Admins, and Users.

---

## **Authentication**
### Base URL: `/auth`

#### **POST** `/login`
- **Description**: Logs in the user using Google or GitHub.
- **Request**:
  ```json
  {
    "provider": "google" | "github"
  }
  ```
- **Response**:
  ```json
  {
    "token": "<JWT>",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```

#### **POST** `/logout`
- **Description**: Logs out the user by invalidating the client-side token.
- **Request**: None.
- **Response**:
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

---

## **Users**
### Base URL: `/api/users`

#### **GET** `/profile`
- **Description**: Fetch the logged-in user's profile.
- **Authentication**: Required (JWT).
- **Request Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "pastEvents": [
      {
        "id": "string",
        "name": "string",
        "date": "ISO_8601_string"
      }
    ],
    "upcomingEvents": [
      {
        "id": "string",
        "name": "string",
        "date": "ISO_8601_string"
      }
    ]
  }
  ```

---

## **Clubs**
### Base URL: `/api/clubs`

#### **GET** `/`
- **Description**: Fetch all clubs.
- **Response**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "logo": "string (URL)"
    }
  ]
  ```

#### **GET** `/:clubId`
- **Description**: Fetch details of a specific club.
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "logo": "string (URL)",
    "events": [
      {
        "id": "string",
        "name": "string",
        "date": "ISO_8601_string"
      }
    ]
  }
  ```

#### **POST** `/`
- **Description**: Create a new club (Admin only).
- **Request**:
  ```json
  {
    "name": "string",
    "description": "string",
    "logo": "string (base64 or file upload URL)"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Club created.",
    "club": {
      "id": "string",
      "name": "string",
      "description": "string",
      "logo": "string"
    }
  }
  ```

#### **PUT** `/:clubId`
- **Description**: Update a club's details (Club Admin only).
- **Request**:
  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)",
    "logo": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Club updated.",
    "club": {
      "id": "string",
      "name": "string",
      "description": "string",
      "logo": "string"
    }
  }
  ```

#### **POST** `/:clubId/assign-admin`
- **Description**: Assign a user as the Club Admin.
- **Request**:
  ```json
  {
    "userId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Club admin assigned.",
    "admin": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```

---

## **Events**
### Base URL: `/api/events`

#### **GET** `/`
- **Description**: Fetch all events.
- **Response**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "registrationStartDate": "ISO_8601_string",
      "registrationEndDate": "ISO_8601_string",
      "eventStartDate": "ISO_8601_string",
      "eventEndDate": "ISO_8601_string",
      "location": "string",
      "category": "string",
      "poster": "string (URL)",
      "availableSeats": "number"
    }
  ]
  ```

#### **GET** `/:eventId`
- **Description**: Fetch details of a specific event.
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "registrationStartDate": "ISO_8601_string",
    "registrationEndDate": "ISO_8601_string",
    "eventStartDate": "ISO_8601_string",
    "eventEndDate": "ISO_8601_string",
    "location": "string",
    "category": "string",
    "poster": "string (URL)",
    "availableSeats": "number"
  }
  ```

#### **POST** `/`
- **Description**: Create a new event (Club Admin only).
- **Request**:
  ```json
  {
    "name": "string",
    "description": "string",
    "registrationStartDate": "ISO_8601_string",
    "registrationEndDate": "ISO_8601_string",
    "eventStartDate": "ISO_8601_string",
    "eventEndDate": "ISO_8601_string",
    "location": "string",
    "category": "string",
    "poster": "string (base64 or file upload URL)",
    "availableSeats": "number",
    "clubId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Event created.",
    "event": {
      "id": "string",
      "name": "string",
      "description": "string",
      "registrationStartDate": "ISO_8601_string",
      "registrationEndDate": "ISO_8601_string",
      "eventStartDate": "ISO_8601_string",
      "eventEndDate": "ISO_8601_string",
      "location": "string",
      "category": "string",
      "poster": "string",
      "availableSeats": "number"
    }
  }
  ```
